import React, { useState, useEffect, useRef } from 'react';

interface Props {
  viewKey: string;         // changes trigger transition
  direction?: 'left' | 'right' | 'up' | 'down' | 'fade';
  duration?: number;       // ms
  children: React.ReactNode;
}

const PageTransition: React.FC<Props> = ({
  viewKey,
  direction = 'left',
  duration = 350,
  children,
}) => {
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const prevKey = useRef(viewKey);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (viewKey === prevKey.current) {
      // Key hasn't changed — just update children in place
      setDisplayedChildren(children);
      return;
    }

    // Key changed — run exit → swap → enter
    setPhase('exit');

    timeoutRef.current = setTimeout(() => {
      setDisplayedChildren(children);
      prevKey.current = viewKey;
      setPhase('enter');

      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
      }, duration);
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [viewKey, children, duration]);

  const getTransform = () => {
    if (phase === 'idle') return 'translate3d(0,0,0)';

    const dist = '60px';
    const map: Record<string, Record<string, string>> = {
      left: {
        exit:  `translate3d(-${dist}, 0, 0)`,
        enter: `translate3d(${dist}, 0, 0)`,
      },
      right: {
        exit:  `translate3d(${dist}, 0, 0)`,
        enter: `translate3d(-${dist}, 0, 0)`,
      },
      up: {
        exit:  `translate3d(0, -${dist}, 0)`,
        enter: `translate3d(0, ${dist}, 0)`,
      },
      down: {
        exit:  `translate3d(0, ${dist}, 0)`,
        enter: `translate3d(0, -${dist}, 0)`,
      },
      fade: {
        exit:  'translate3d(0, 0, 0)',
        enter: 'translate3d(0, 0, 0)',
      },
    };

    return map[direction]?.[phase] ?? 'translate3d(0,0,0)';
  };

  const style: React.CSSProperties = {
    transition: phase === 'idle'
      ? 'none'
      : `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    opacity: phase === 'exit' || phase === 'enter' ? (phase === 'exit' ? 0 : 1) : 1,
    transform: phase === 'enter' ? 'translate3d(0,0,0)' : getTransform(),
    willChange: 'opacity, transform',
    width: '100%',
    height: '100%',
  };

  // On the very first frame of "enter", we need the offset position,
  // then immediately transition to (0,0,0). We use a rAF trick.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase === 'enter' && containerRef.current) {
      const el = containerRef.current;
      // Force the browser to start from the offset
      const enterTransform = (() => {
        const dist = '60px';
        switch (direction) {
          case 'left':  return `translate3d(${dist}, 0, 0)`;
          case 'right': return `translate3d(-${dist}, 0, 0)`;
          case 'up':    return `translate3d(0, ${dist}, 0)`;
          case 'down':  return `translate3d(0, -${dist}, 0)`;
          default:      return 'translate3d(0, 0, 0)';
        }
      })();
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = enterTransform;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          el.style.opacity = '1';
          el.style.transform = 'translate3d(0, 0, 0)';
        });
      });
    }
  }, [phase, direction, duration]);

  return (
    <div
      ref={containerRef}
      style={phase === 'enter' ? { width: '100%', height: '100%', willChange: 'opacity, transform' } : style}
    >
      {displayedChildren}
    </div>
  );
};

export default PageTransition;
