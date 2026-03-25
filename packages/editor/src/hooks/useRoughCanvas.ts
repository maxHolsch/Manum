import { useEffect, useRef, useCallback } from 'react';
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

type DrawFunction = (rc: ReturnType<typeof rough.svg>, svg: SVGSVGElement) => void;

export function useRoughCanvas(draw: DrawFunction, deps: unknown[] = []) {
  const svgRef = useRef<SVGSVGElement>(null);

  const redraw = useCallback(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const rc = rough.svg(svg);
    draw(rc, svg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    redraw();
  }, [redraw]);

  return { svgRef, redraw };
}

export function defaultRoughOptions(seed = 42): Options {
  return {
    roughness: 1.5,
    stroke: 'var(--color-border)',
    seed,
  };
}
