import * as React from "react";

const LG_BREAKPOINT = 1024;

export function useIsLg() {
  const [isLg, setIsLg] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= LG_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const onChange = () => {
      setIsLg(window.innerWidth >= LG_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLg;
}
