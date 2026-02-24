import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  viewKey: string;
  direction?: 'left' | 'right' | 'up' | 'down' | 'fade';
  duration?: number;
  children: React.ReactNode;
}

/**
 * Dual-buffer page transition.
 *
 * Both the outgoing and incoming views are rendered simultaneously
 * (stacked via absolute positioning) so there is never a blank frame.
 *
 * Timeline:
 *   1. viewKey changes
 *   2. Current children become "outgoing" (animate out)
 *   3. New children become "incoming" (animate in)
 *   4. Both are rendered at once for `duration` ms
 *   5. After animation: outgoing is removed, incoming becomes idle
 */
const PageTransition: React.FC<Props> = ({
  viewKey,
  direction = 'left',
  duration = 300,
  children,
}) => {
  // Holds the currently displayed (idle) children
  const [idleChildren, setIdleChildren] = useState<React.ReactNode>(children);
  const [idleKey, setIdleKey] = useState(viewKey);

  // During a transition, these hold the outgoing snapshot
  const [outgoing, setOutgoing] = useState<React.ReactNode | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const incomingRef = useRef<HTMLDivElement>(null);
  const outgoingRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKeyRef = useRef(viewKey);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // Same key — just update children in place (no transition)
    if (viewKey === prevKeyRef.current) {
      setIdleChildren(children);
      return;
    }

    // Key changed — start dual-buffer transition
    // 1. Snapshot current idle children as outgoing
    setOutgoing(idleChildren);
    // 2. Set new children as incoming (will become idle after transition)
    setIdleChildren(children);
    setIdleKey(viewKey);
    setTransitioning(true);
    prevKeyRef.current = viewKey;

    // Clear any in-flight transition
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // After duration, remove outgoing
    timeoutRef.current = setTimeout(() => {
      setOutgoing(null);
      setTransitioning(false);
    }, duration);
  }, [viewKey, children, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animation helpers ───────────────────────────────────────────────

  const getExitTransform = useCallback((): string => {
    const dist = '60px';
    switch (direction) {
      case 'left':  return `translate3d(-${dist}, 0, 0)`;
      case 'right': return `translate3d(${dist}, 0, 0)`;
      case 'up':    return `translate3d(0, -${dist}, 0)`;
      case 'down':  return `translate3d(0, ${dist}, 0)`;
      case 'fade':  return 'translate3d(0, 0, 0)';
    }
  }, [direction]);

  const getEnterTransform = useCallback((): string => {
    const dist = '60px';
    switch (direction) {
      case 'left':  return `translate3d(${dist}, 0, 0)`;
      case 'right': return `translate3d(-${dist}, 0, 0)`;
      case 'up':    return `translate3d(0, ${dist}, 0)`;
      case 'down':  return `translate3d(0, -${dist}, 0)`;
      case 'fade':  return 'translate3d(0, 0, 0)';
    }
  }, [direction]);

  // Kick the incoming element from its start offset → (0,0,0)
  useEffect(() => {
    if (!transitioning || !incomingRef.current) return;
    const el = incomingRef.current;

    // Start from offset (no transition yet)
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = getEnterTransform();

    // Force reflow, then animate to final position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        el.style.opacity = '1';
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }, [transitioning, duration, getEnterTransform]);

  // Animate the outgoing element to its exit position
  useEffect(() => {
    if (!transitioning || !outgoingRef.current) return;
    const el = outgoingRef.current;

    // Start at current position
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'translate3d(0, 0, 0)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        el.style.opacity = '0';
        el.style.transform = getExitTransform();
      });
    });
  }, [transitioning, duration, getExitTransform]);

  // ── Render ──────────────────────────────────────────────────────────

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    willChange: 'opacity, transform',
  };

  // Not transitioning — render idle children normally (no absolute positioning)
  if (!transitioning) {
    return (
      <div style={baseStyle}>
        {idleChildren}
      </div>
    );
  }

  // Transitioning — render BOTH layers stacked
  return (
    <div style={{ ...baseStyle, position: 'relative', overflow: 'hidden' }}>
      {/* Outgoing — behind */}
      {outgoing && (
        <div
          ref={outgoingRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            willChange: 'opacity, transform',
          }}
        >
          {outgoing}
        </div>
      )}

      {/* Incoming — on top */}
      <div
        ref={incomingRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          willChange: 'opacity, transform',
        }}
      >
        {idleChildren}
      </div>
    </div>
  );
};

export default PageTransition;