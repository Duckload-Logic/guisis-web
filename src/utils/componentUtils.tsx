import { useEffect, RefObject } from "react";
import { useLocation } from "react-router-dom";

interface ScrollToTopProps {
  targetRef?: RefObject<HTMLDivElement>;
}

export default function ScrollToTop({ targetRef }: ScrollToTopProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const performScroll = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTo({ top: 0, behavior: "auto" });
      document.body.scrollTo({ top: 0, behavior: "auto" });

      if (targetRef?.current) {
        targetRef.current.scrollTo({ top: 0, behavior: "auto" });
      }

      let el = document.querySelector("main") as HTMLElement | null;
      while (el) {
        if (typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, behavior: "auto" });
        }
        el = el.parentElement;
      }
    };

    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 150);
    setTimeout(performScroll, 300);
  }, [pathname, targetRef]);

  return null;
}
