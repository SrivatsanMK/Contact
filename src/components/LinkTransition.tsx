import { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import type { LinkItem } from '../config';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface LinkTransitionProps {
  activeLink: LinkItem | null;
  active: boolean;
  onWarpFactorChange: (v: number) => void;
  onComplete: () => void;
}

/**
 * Cinematic hyperspace transition overlay.
 *
 * GSAP timeline syncs with warpFactor (pushed to Three.js via callback):
 * 1. Clicked card glows, others fade + blur
 * 2. Star speed ramps (warpFactor 0 → 1), FOV widens, stars streak
 * 3. Glass portal expands with icon + "Opening {label}…"
 * 4. Progress ring fills
 * 5. Bright flash → navigate
 */
export default function LinkTransition({
  activeLink,
  active,
  onWarpFactorChange,
  onComplete,
}: LinkTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const progressRingRef = useRef<SVGSVGElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  const resetAll = useCallback(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    setShowFallback(false);

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    if (flashRef.current) {
      gsap.killTweensOf(flashRef.current);
      flashRef.current.style.opacity = '0';
      flashRef.current.style.display = 'none';
      setTimeout(() => {
        if (flashRef.current) flashRef.current.style.display = '';
      }, 50);
    }

    if (overlayRef.current) {
      gsap.killTweensOf(overlayRef.current);
      overlayRef.current.style.opacity = '0';
    }

    if (portalRef.current) {
      gsap.killTweensOf(portalRef.current);
      portalRef.current.style.width = '0';
      portalRef.current.style.height = '0';
    }

    if (iconRef.current) {
      gsap.killTweensOf(iconRef.current);
      iconRef.current.style.opacity = '0';
    }

    if (textRef.current) {
      gsap.killTweensOf(textRef.current);
      textRef.current.style.opacity = '0';
    }

    if (progressRingRef.current) {
      gsap.killTweensOf(progressRingRef.current);
      progressRingRef.current.style.opacity = '0';
    }

    if (progressRef.current) {
      gsap.killTweensOf(progressRef.current);
      const circ = 2 * Math.PI * 42;
      progressRef.current.style.strokeDashoffset = `${circ}`;
    }

    // Reset card styles
    document.querySelectorAll<HTMLElement>('.glass-card').forEach((card) => {
      gsap.killTweensOf(card);
      card.style.opacity = '';
      card.style.filter = '';
      card.style.boxShadow = '';
      card.style.borderColor = '';
    });

    onWarpFactorChange(0);
  }, [onWarpFactorChange]);

  // Navigate after animation using native intents on mobile without blank tabs
  const navigate = useCallback((link: LinkItem) => {
    // Show fallback link after 4s in case navigation is blocked
    fallbackTimerRef.current = setTimeout(() => setShowFallback(true), 4000);

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (link.url.startsWith('tel:') || link.url.startsWith('mailto:')) {
      window.location.href = link.url;
      return;
    }

    if (isAndroid) {
      let targetUrl = link.url;
      const fallback = encodeURIComponent(link.url);
      if (link.id === 'instagram') {
        targetUrl = `intent://instagram.com/_u/__._srivatsan_.__/#Intent;package=com.instagram.android;scheme=https;S.browser_fallback_url=${fallback};end`;
      } else if (link.id === 'snapchat') {
        targetUrl = `intent://www.snapchat.com/add/srivatsanmk?share_id=zi7U5wkPS10&locale=en-GB#Intent;package=com.snapchat.android;scheme=https;S.browser_fallback_url=${fallback};end`;
      } else if (link.id === 'linkedin') {
        targetUrl = `intent://www.linkedin.com/in/srivatsan-mk/#Intent;package=com.linkedin.android;scheme=https;S.browser_fallback_url=${fallback};end`;
      }

      // On Android, navigating to an intent:// URI tells Chrome to launch the app directly
      // via Android OS without opening a blank white tab and without unloading the current document!
      window.location.href = targetUrl;
      return;
    }

    if (isIOS) {
      if (link.id === 'instagram') {
        window.location.href = 'instagram://user?username=__._srivatsan_.__';
        return;
      }
      if (link.id === 'snapchat') {
        window.location.href = 'snapchat://add/srivatsanmk';
        return;
      }
      if (link.id === 'linkedin') {
        window.location.href = 'linkedin://profile/srivatsan-mk';
        return;
      }
      window.location.href = link.url;
      return;
    }

    // On Desktop, open external link in a new tab smoothly
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, []);

  useEffect(() => {
    if (!active || !activeLink) return;

    const overlay = overlayRef.current;
    const portal = portalRef.current;
    const icon = iconRef.current;
    const text = textRef.current;
    const progress = progressRef.current;
    const progressRing = progressRingRef.current;
    const flash = flashRef.current;
    if (!overlay || !portal || !icon || !text || !progress || !progressRing || !flash) return;

    // Fade/blur non-active cards
    const allCards = document.querySelectorAll<HTMLElement>('.glass-card');
    const activeCard = document.querySelector<HTMLElement>(
      `[data-link-id="${activeLink.id}"]`,
    );

    // Warp factor proxy object for GSAP to tween
    const warp = { factor: 0 };

    const circumference = 2 * Math.PI * 42;
    progress.style.strokeDasharray = `${circumference}`;
    progress.style.strokeDashoffset = `${circumference}`;

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(activeLink);
        onComplete();
        // Immediately fade out overlay and reset so screen stays dark, alive, and clean
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            resetAll();
          },
        });
      },
    });

    timelineRef.current = tl;

    if (reducedMotion) {
      // Simple reduced-motion path: quick fade overlay → navigate
      tl.to(overlay, { opacity: 1, duration: 0.15 })
        .to(warp, {
          factor: 0.3,
          duration: 0.2,
          onUpdate: () => onWarpFactorChange(warp.factor),
        }, 0)
        .to(flash, { opacity: 0.2, duration: 0.15 }, '+=0.05');
      return;
    }

    // ── Full cinematic timeline (snappy 0.85s to preserve browser user gesture) ──

    // Phase 1: highlight active card, fade others (0 → 0.2s)
    tl.set(overlay, { opacity: 1 });

    allCards.forEach((card) => {
      if (card !== activeCard) {
        tl.to(card, {
          opacity: 0.15,
          filter: 'blur(6px)',
          duration: 0.2,
          ease: 'power2.out',
        }, 0);
      }
    });

    if (activeCard) {
      tl.to(activeCard, {
        boxShadow: `0 0 35px ${activeLink.accentColor}, inset 0 0 15px ${activeLink.accentColor}44`,
        borderColor: activeLink.accentColor,
        duration: 0.2,
        ease: 'power2.out',
      }, 0);
    }

    // Phase 2: ramp warp speed (0.15s → 0.8s)
    tl.to(warp, {
      factor: 1,
      duration: 0.65,
      ease: 'power3.in',
      onUpdate: () => onWarpFactorChange(warp.factor),
    }, 0.15);

    // Fade active card out as portal appears
    if (activeCard) {
      tl.to(activeCard, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0.2);
    }

    // Phase 3: expand portal (0.2s → 0.55s)
    tl.to(portal, {
      width: 210,
      height: 210,
      duration: 0.35,
      ease: 'power2.out',
    }, 0.2);

    // Logo and circle appear together inside the portal
    tl.to(progressRing, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.3);
    tl.to(icon, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.3);
    tl.to(text, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.4);

    // Phase 4: progress ring fills around the logo (0.35s → 0.75s)
    tl.to(progress, {
      strokeDashoffset: 0,
      duration: 0.4,
      ease: 'power1.inOut',
    }, 0.35);

    // Phase 5: portal warp plunge + subtle cosmic glow (0.75s → 0.85s) - never white
    tl.to(portal, {
      scale: 1.1,
      duration: 0.1,
      ease: 'power2.in',
    }, 0.75);

    tl.to(flash, {
      opacity: 0.2,
      duration: 0.1,
      ease: 'power2.in',
    }, 0.75);

    return () => {
      tl.kill();
    };
  }, [active, activeLink, navigate, onComplete, onWarpFactorChange, reducedMotion, resetAll]);

  // Listen for user returning to tab (app back button, app switch, bfcache, focus)
  useEffect(() => {
    const handleReturn = () => {
      resetAll();
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
  }, [resetAll]);

  // When active prop turns false, ensure resetAll is called
  useEffect(() => {
    if (!active) {
      resetAll();
    }
  }, [active, resetAll]);

  return (
    <>
      <div
        ref={overlayRef}
        className={`transition-overlay ${active ? 'active' : ''}`}
      >
        <div ref={portalRef} className="transition-portal">
          <div className="transition-circle-wrapper">
            <svg
              ref={progressRingRef}
              className="transition-progress-ring"
              viewBox="0 0 92 92"
            >
              <circle
                cx="46"
                cy="46"
                r="42"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                ref={progressRef}
                cx="46"
                cy="46"
                r="42"
                stroke={activeLink?.accentColor ?? '#fff'}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
            </svg>
            <span
              ref={iconRef}
              className="transition-icon"
              style={{ color: activeLink?.accentColor ?? '#fff' }}
              dangerouslySetInnerHTML={{ __html: activeLink?.icon ?? '' }}
            />
          </div>
          <span ref={textRef} className="transition-text">
            Opening {activeLink?.label ?? ''}…
          </span>
        </div>
      </div>

      <div ref={flashRef} className="transition-flash" />

      {showFallback && activeLink && (
        <a
          href={activeLink.url}
          className={`transition-fallback ${showFallback ? 'visible' : ''}`}
          rel="noopener noreferrer"
        >
          Tap here if it doesn&apos;t open
        </a>
      )}
    </>
  );
}
