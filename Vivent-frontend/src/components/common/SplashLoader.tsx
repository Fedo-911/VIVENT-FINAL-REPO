import { useEffect } from "react";
import "./SplashLoader.css";

// Keep the splash mark identical to the browser tab favicon.
const viventFavicon = "/favicon.png";

type SplashLoaderProps = {
  isExiting?: boolean;
  onExited?: () => void;
};

/** Full-screen startup surface shown while the application bootstraps. */
const SplashLoader = ({ isExiting = false, onExited }: SplashLoaderProps) => {
  useEffect(() => {
    if (!isExiting || !onExited) return undefined;

    const fallback = window.setTimeout(onExited, 650);
    return () => window.clearTimeout(fallback);
  }, [isExiting, onExited]);

  return (
    <div
      className={`splash-loader${isExiting ? " splash-loader--exiting" : ""}`}
      role="status"
      aria-label="Loading VIVENT"
      aria-live="polite"
      onAnimationEnd={(event) => {
        if (isExiting && event.target === event.currentTarget) onExited?.();
      }}
    >
      <div className="splash-loader__grid" aria-hidden="true" />
      <div className="splash-loader__orb splash-loader__orb--one" aria-hidden="true" />
      <div className="splash-loader__orb splash-loader__orb--two" aria-hidden="true" />

      <div className="splash-loader__content">
        <div className="splash-loader__logo-wrap">
          <div className="splash-loader__logo-aura" aria-hidden="true" />
          <img className="splash-loader__logo" src={viventFavicon} alt="VIVENT" />
        </div>
        <p className="splash-loader__name">VIVENT</p>
        <p className="splash-loader__tagline">Smart Event Management Platform</p>
        <p className="splash-loader__message">Loading your experience...</p>
        <div className="splash-loader__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default SplashLoader;
