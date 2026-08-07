import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

const TOTAL_TRANSITION_MS = 5000;
const EXIT_MS = 500;
const MINIMUM_VISIBLE_MS = TOTAL_TRANSITION_MS - EXIT_MS;

type LoaderContextValue = {
  isVisible: boolean;
  isExiting: boolean;
  beginLoading: (reason?: string) => void;
  finishLoading: () => void;
  withGlobalLoader: <T>(work: Promise<T> | (() => Promise<T>), reason?: string) => Promise<T>;
};

const LoaderContext = createContext<LoaderContextValue | undefined>(undefined);

const interactiveSelector = [
  "a[href]",
  "[data-vivent-loader]",
].join(",");

const isInternalUrl = (href: string) => {
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin && `${url.pathname}${url.search}` !== `${window.location.pathname}${window.location.search}`;
  } catch {
    return false;
  }
};

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startedAtRef = useRef(0);
  const finishTimerRef = useRef<number | undefined>(undefined);
  const exitTimerRef = useRef<number | undefined>(undefined);
  const initialLocationRef = useRef(location.key);
  const handledLocationRef = useRef(location.key);

  const clearTimers = useCallback(() => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    finishTimerRef.current = undefined;
    exitTimerRef.current = undefined;
  }, []);

  const beginLoading = useCallback((reason = "transition") => {
    if (isVisible && !isExiting) return;
    clearTimers();
    startedAtRef.current = performance.now();
    setIsExiting(false);
    setIsVisible(true);
    window.dispatchEvent(new CustomEvent("vivent:loader-visible", { detail: { reason } }));
  }, [clearTimers, isExiting, isVisible]);

  const finishLoading = useCallback(() => {
    if (finishTimerRef.current || exitTimerRef.current) return;

    const elapsed = performance.now() - startedAtRef.current;
    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - elapsed);

    finishTimerRef.current = window.setTimeout(() => {
      setIsExiting(true);
      exitTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
      }, EXIT_MS);
    }, remaining);
  }, []);

  const withGlobalLoader = useCallback<LoaderContextValue["withGlobalLoader"]>(
    async (work, reason = "async-transition") => {
      beginLoading(reason);
      try {
        return await (typeof work === "function" ? work() : work);
      } finally {
        finishLoading();
      }
    },
    [beginLoading, finishLoading]
  );

  useEffect(() => {
    if (initialLocationRef.current === location.key) return;
    if (handledLocationRef.current === location.key) return;
    handledLocationRef.current = location.key;

    if (!isVisible) beginLoading("route-change");
    const settle = window.setTimeout(finishLoading, 80);
    return () => window.clearTimeout(settle);
  }, [beginLoading, finishLoading, isVisible, location.key]);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
      if (!target) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      const href = anchor?.getAttribute("href");
      const isRouteLink = Boolean(href && !href.startsWith("#") && isInternalUrl(anchor.href));
      const isExplicit = Boolean(target.closest("[data-vivent-loader]"));

      if (isRouteLink || isExplicit) {
        beginLoading(isRouteLink ? "navigation-click" : "button-transition");
        window.setTimeout(finishLoading, 120);
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [beginLoading, finishLoading]);

  useEffect(() => {
    const start = (event: Event) => beginLoading((event as CustomEvent).detail?.reason || "api-transition");
    const end = () => finishLoading();

    window.addEventListener("vivent:global-loader:start", start);
    window.addEventListener("vivent:global-loader:end", end);
    return () => {
      window.removeEventListener("vivent:global-loader:start", start);
      window.removeEventListener("vivent:global-loader:end", end);
      clearTimers();
    };
  }, [beginLoading, clearTimers, finishLoading]);

  useEffect(() => {
    document.body.classList.toggle("vivent-global-loader-active", isVisible && !isExiting);
    return () => document.body.classList.remove("vivent-global-loader-active");
  }, [isExiting, isVisible]);

  const value = useMemo(
    () => ({ isVisible, isExiting, beginLoading, finishLoading, withGlobalLoader }),
    [beginLoading, finishLoading, isExiting, isVisible, withGlobalLoader]
  );

  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>;
};

export const useLoaderContext = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used inside LoaderProvider");
  }
  return context;
};
