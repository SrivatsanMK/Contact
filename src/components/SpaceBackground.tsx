import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';

// ─── Constants ───
const BASE_STAR_COUNT = 3200;
const MOBILE_STAR_COUNT = 1400;
const NEBULA_COUNT = 18;
const FIELD_DEPTH = 1200;
const SPEED_NORMAL = 60;
const SPEED_WARP_MAX = 900;
const FOV_NORMAL = 60;
const FOV_WARP = 110;
const PARALLAX_STRENGTH = 2.5;

function isMobile(): boolean {
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
}

// ─── Star Field (recycled infinite tunnel) ───
interface StarsProps {
  warpFactor: number;
  reducedMotion: boolean;
}

function Stars({ warpFactor, reducedMotion }: StarsProps) {
  const count = useMemo(() => (isMobile() ? MOBILE_STAR_COUNT : BASE_STAR_COUNT), []);
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const vel = new Float32Array(count);

    const colorPalette = [
      new THREE.Color(1, 1, 1),         // white
      new THREE.Color(0.75, 0.85, 1),   // pale blue
      new THREE.Color(0.6, 0.75, 1),    // blue
      new THREE.Color(1, 0.95, 0.8),    // warm yellow
      new THREE.Color(0.9, 0.85, 1),    // lavender
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 280;
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = Math.sin(angle) * radius;
      pos[i3 + 2] = -Math.random() * FIELD_DEPTH;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;

      sz[i] = 0.6 + Math.random() * 2.8;
      vel[i] = 0.6 + Math.random() * 1.4;
    }

    return { positions: pos, colors: col, sizes: sz, velocities: vel };
  }, [count]);

  const twinkleOffsets = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = Math.random() * Math.PI * 2;
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const sizeAttr = geom.getAttribute('size') as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const sizeArr = sizeAttr.array as Float32Array;

    const clampedDelta = Math.min(delta, 0.05);
    const speed = reducedMotion
      ? SPEED_NORMAL * 0.3
      : SPEED_NORMAL + (SPEED_WARP_MAX - SPEED_NORMAL) * warpFactor;
    const time = performance.now() * 0.001;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArr[i3 + 2] += speed * velocities[i] * clampedDelta;

      if (posArr[i3 + 2] > 50) {
        posArr[i3 + 2] = -FIELD_DEPTH - Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 280;
        posArr[i3] = Math.cos(angle) * radius;
        posArr[i3 + 1] = Math.sin(angle) * radius;
      }

      const twinkle = 0.7 + 0.3 * Math.sin(time * 2.5 + twinkleOffsets[i]);
      const warpStretch = 1 + warpFactor * 3;
      sizeArr[i] = sizes[i] * twinkle * warpStretch;
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        attribute vec3 starColor;
        varying vec3 vColor;
        void main() {
          vColor = starColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }
      `,
    });
  }, []);

  return (
    <points ref={meshRef} material={starMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-starColor" args={[colors, 3]} count={count} />
        <bufferAttribute attach="attributes-size" args={[sizes.slice(), 1]} count={count} />
      </bufferGeometry>
    </points>
  );
}

// ─── Nebula Sprites ───
interface NebulaProps {
  warpFactor: number;
}

function Nebulae({ warpFactor }: NebulaProps) {
  const groupRef = useRef<THREE.Group>(null);

  const nebulaTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const nebulae = useMemo(() => {
    const palette = [
      new THREE.Color(0.3, 0.1, 0.5),
      new THREE.Color(0.1, 0.2, 0.6),
      new THREE.Color(0.05, 0.35, 0.4),
      new THREE.Color(0.2, 0.08, 0.4),
      new THREE.Color(0.08, 0.25, 0.5),
    ];
    return Array.from({ length: NEBULA_COUNT }, (_, i) => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 400,
        -200 - Math.random() * FIELD_DEPTH,
      ),
      scale: 80 + Math.random() * 200,
      color: palette[i % palette.length],
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.12 + Math.random() * 0.08,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const speed = 15 + warpFactor * 80;
    groupRef.current.children.forEach((child, i) => {
      child.position.z += speed * nebulae[i].speed * dt;
      if (child.position.z > 100) {
        child.position.z = -FIELD_DEPTH - Math.random() * 400;
        child.position.x = (Math.random() - 0.5) * 500;
        child.position.y = (Math.random() - 0.5) * 400;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {nebulae.map((n, i) => (
        <sprite key={i} position={n.position} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={nebulaTexture}
            color={n.color}
            transparent
            opacity={n.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}

// ─── Camera Controller (parallax + FOV warp) ───
interface CameraControllerProps {
  warpFactor: number;
  reducedMotion: boolean;
}

function CameraController({ warpFactor, reducedMotion }: CameraControllerProps) {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', handler, { passive: true });
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;

    if (!reducedMotion) {
      const strength = PARALLAX_STRENGTH * (1 - warpFactor * 0.5);
      currentRef.current.x += (mouseRef.current.x * strength - currentRef.current.x) * 0.04;
      currentRef.current.y += (mouseRef.current.y * strength - currentRef.current.y) * 0.04;
      cam.rotation.y = -currentRef.current.x * 0.015;
      cam.rotation.x = -currentRef.current.y * 0.01;
    }

    const targetFov = FOV_NORMAL + (FOV_WARP - FOV_NORMAL) * warpFactor;
    cam.fov += (targetFov - cam.fov) * 0.08;
    cam.updateProjectionMatrix();
  });

  return null;
}

// ─── Main Scene ───
interface SceneProps {
  warpFactor: number;
  reducedMotion: boolean;
}

function Scene({ warpFactor, reducedMotion }: SceneProps) {
  return (
    <>
      <CameraController warpFactor={warpFactor} reducedMotion={reducedMotion} />
      <Stars warpFactor={warpFactor} reducedMotion={reducedMotion} />
      <Nebulae warpFactor={warpFactor} />
    </>
  );
}

// ─── Exported Canvas Wrapper ───
interface SpaceBackgroundProps {
  warpFactor: number;
}

export default function SpaceBackground({ warpFactor }: SpaceBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);

  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(new THREE.Color('#050810'), 1);
  }, []);

  if (webglFailed) {
    return <div className="space-fallback" aria-hidden="true" />;
  }

  return (
    <div className="space-canvas-container" aria-hidden="true">
      <Canvas
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{ position: [0, 0, 0], fov: FOV_NORMAL, near: 0.1, far: 2000 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={onCreated}
        onError={() => setWebglFailed(true)}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene warpFactor={warpFactor} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
