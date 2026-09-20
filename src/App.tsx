import { useCallback, useRef, useState, useEffect } from 'react';
import config from './config';
import type { LinkItem } from './config';
import SpaceBackground from './components/SpaceBackground';
import ProfileHeader from './components/ProfileHeader';
import GlassCard from './components/GlassCard';
import LinkTransition from './components/LinkTransition';
import LiquidGlassFilters from './components/LiquidGlassFilters';
import './styles/global.css';

export default function App() {
  const [warpFactor, setWarpFactor] = useState(0);
  const [activeLink, setActiveLink] = useState<LinkItem | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const lockRef = useRef(false);

  const handleActivate = useCallback((link: LinkItem) => {
    // Prevent double-clicks during transition
    if (lockRef.current) return;
    lockRef.current = true;
    setActiveLink(link);
    setTransitioning(true);
  }, []);

  const handleWarpFactorChange = useCallback((v: number) => {
    setWarpFactor(v);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    // Reset after navigation (or on pageshow/bfcache)
    const reset = () => {
      setTransitioning(false);
      setActiveLink(null);
      setWarpFactor(0);
      lockRef.current = false;
    };

    // Delay reset slightly so the flash is visible before navigation occurs
    setTimeout(reset, 300);
  }, []);

  // Reset when returning to the tab from an external app or bfcache
  useEffect(() => {
    const handleReturn = () => {
      setTransitioning(false);
      setActiveLink(null);
      setWarpFactor(0);
      lockRef.current = false;
    };

    window.addEventListener('pageshow', handleReturn);
    window.addEventListener('focus', handleReturn);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleReturn();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pageshow', handleReturn);
      window.removeEventListener('focus', handleReturn);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <>
      <LiquidGlassFilters />
      <SpaceBackground warpFactor={warpFactor} />

      <main className="app-container">
        <div className="content-wrapper">
          <ProfileHeader />

          <nav className="cards-list" aria-label="Social links">
            {config.links.map((link, i) => (
              <GlassCard
                key={link.id}
                link={link}
                index={i}
                disabled={transitioning}
                onActivate={handleActivate}
              />
            ))}
          </nav>
        </div>
      </main>

      <LinkTransition
        activeLink={activeLink}
        active={transitioning}
        onWarpFactorChange={handleWarpFactorChange}
        onComplete={handleTransitionComplete}
      />
    </>
  );
}
