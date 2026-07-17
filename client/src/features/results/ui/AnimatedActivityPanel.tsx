import { useEffect, useState, type ReactNode } from "react";

export function AnimatedActivityPanel({
  children,
  isExpanded,
}: {
  children: ReactNode;
  isExpanded: boolean;
}) {
  const [isRendered, setIsRendered] = useState(isExpanded);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let animationFrame: number | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    if (isExpanded) {
      setIsRendered(true);
      animationFrame =
        globalThis.requestAnimationFrame?.(() => setIsOpen(true)) ?? null;
      if (animationFrame === null) setIsOpen(true);
    } else {
      setIsOpen(false);
      closeTimer = globalThis.setTimeout(() => setIsRendered(false), 340);
    }

    return () => {
      if (animationFrame !== null) {
        globalThis.cancelAnimationFrame?.(animationFrame);
      }
      if (closeTimer !== null) globalThis.clearTimeout(closeTimer);
    };
  }, [isExpanded]);

  return (
    <div
      aria-hidden={!isOpen}
      className={[
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
        isOpen
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0",
      ].join(" ")}
      inert={!isOpen}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && !isExpanded) {
          setIsRendered(false);
        }
      }}
    >
      <div className="min-h-0 overflow-hidden">
        {isRendered ? children : null}
      </div>
    </div>
  );
}
