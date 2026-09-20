import { useRef, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import type { LinkItem } from '../config';

interface GlassCardProps {
  link: LinkItem;
  index: number;
  disabled: boolean;
  onActivate: (link: LinkItem) => void;
}

export default function GlassCard({ link, index, disabled, onActivate }: GlassCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleClick = useCallback(
    (e: ReactMouseEvent<HTMLAnchorElement>) => {
      // Allow right-click / middle-click / ctrl-click to use native behaviour
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      if (disabled) return;
      onActivate(link);
    },
    [disabled, link, onActivate],
  );

  // Pointer-following tilt on hover
  const handlePointerMove = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -6;
    el.style.transform = `translateY(-2px) perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.01)`;
  }, []);

  const handlePointerLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = '';
  }, []);

  return (
    <a
      ref={cardRef}
      href={link.url}
      className="glass glass-card"
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label={link.label}
      rel="noopener noreferrer"
      style={{
        animationDelay: `${0.3 + index * 0.22}s`,
        filter: `url(#liquid-distortion)`,
        ['--accent' as string]: link.accentColor,
      }}
      data-link-id={link.id}
    >
      <span
        className="glass-card-icon"
        style={{ color: link.accentColor }}
        dangerouslySetInnerHTML={{ __html: link.icon }}
        aria-hidden="true"
      />
      <span className="glass-card-label">{link.label}</span>
      <svg
        className="glass-card-arrow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </a>
  );
}
