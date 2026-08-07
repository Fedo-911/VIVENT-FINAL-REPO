import { useEffect, useMemo, useRef, useState } from "react";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";
import "./GlobalPageLoader.css";

const viventLogo = "/favicon.png";

const loaderMessages = [
  "Loading events...",
  "Preparing dashboard...",
  "Fetching your workspace...",
  "Loading notifications...",
  "Syncing your account...",
  "Almost ready...",
  "Setting up your experience...",
];

const particles = Array.from({ length: 18 }, (_, index) => index);

const GlobalPageLoader = () => {
  const { isVisible, isExiting } = useGlobalLoader();
  const [messageIndex, setMessageIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isVisible) return undefined;
    setMessageIndex(0);
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % loaderMessages.length);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    overlayRef.current?.focus({ preventScroll: true });
  }, [isVisible]);

  const message = useMemo(() => loaderMessages[messageIndex], [messageIndex]);

  if (!isVisible) return null;

  return (
    <div
      aria-label="Preparing your VIVENT experience"
      aria-live="polite"
      aria-modal="true"
      className={`global-page-loader${isExiting ? " global-page-loader--exiting" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Tab") event.preventDefault();
      }}
      ref={overlayRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="global-page-loader__grid" aria-hidden="true" />
      <div className="global-page-loader__glow global-page-loader__glow--one" aria-hidden="true" />
      <div className="global-page-loader__glow global-page-loader__glow--two" aria-hidden="true" />
      <div className="global-page-loader__particles" aria-hidden="true">
        {particles.map((particle) => (
          <span key={particle} />
        ))}
      </div>

      <section className="global-page-loader__card" aria-busy="true">
        <div className="global-page-loader__shine" aria-hidden="true" />
        <div className="global-page-loader__logo-frame">
          <div className="global-page-loader__logo-ring" aria-hidden="true" />
          <img className="global-page-loader__logo" src={viventLogo} alt="VIVENT" />
        </div>

        <div className="global-page-loader__copy">
          <h2>Preparing your VIVENT experience</h2>
          <p key={message}>{message}</p>
        </div>

        <div className="global-page-loader__blocks" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="global-page-loader__progress" aria-hidden="true">
          <span />
        </div>
      </section>
    </div>
  );
};

export default GlobalPageLoader;
