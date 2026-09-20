/**
 * Hidden SVG filter for a subtle liquid refraction on glass card edges.
 * Uses feTurbulence + feDisplacementMap to distort the region.
 * Referenced via CSS `filter: url(#liquid-distortion)`.
 */
export default function LiquidGlassFilters() {
  return (
    <svg
      className="liquid-glass-filters"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="liquid-distortion" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves={3}
            seed={2}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
