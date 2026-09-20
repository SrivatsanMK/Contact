import { useCallback, useRef, useState } from 'react';
import type { LinkItem } from '../config';

export interface WarpState {
  /** True while the transition sequence is playing */
  active: boolean;
  /** 0 → 1 normalised warp intensity for Three.js */
  warpFactor: number;
  /** The link currently being opened */
  activeLink: LinkItem | null;
}

interface WarpControls {
  state: WarpState;
  /** Begin the warp – returns a promise that resolves when navigation should happen */
  startWarp: (link: LinkItem) => Promise<void>;
  /** Reset to idle (e.g. on pageshow / bfcache restore) */
  resetWarp: () => void;
  /** Setter exposed to GSAP tween to drive warpFactor */
  setWarpFactor: (v: number) => void;
}

export function useWarpState(): WarpControls {
  const [state, setState] = useState<WarpState>({
    active: false,
    warpFactor: 0,
    activeLink: null,
  });

  const resolveRef = useRef<(() => void) | null>(null);

  const setWarpFactor = useCallback((v: number) => {
    setState((prev) => ({ ...prev, warpFactor: v }));
  }, []);

  const startWarp = useCallback((link: LinkItem): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
      setState({ active: true, warpFactor: 0, activeLink: link });
    });
  }, []);

  const resetWarp = useCallback(() => {
    resolveRef.current = null;
    setState({ active: false, warpFactor: 0, activeLink: null });
  }, []);

  // Expose resolve trigger for the animation timeline
  const resolveWarp = useCallback(() => {
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  return {
    state,
    startWarp,
    resetWarp,
    setWarpFactor,
    // Attach resolveWarp as a side-channel via the ref pattern below
    ...({ resolveWarp } as { resolveWarp: () => void }),
  };
}
