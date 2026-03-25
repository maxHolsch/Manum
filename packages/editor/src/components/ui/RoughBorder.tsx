import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface RoughBorderProps {
  width: number;
  height: number;
  seed?: number;
  roughness?: number;
  strokeColor?: string;
  fillColor?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function RoughBorder({
  width,
  height,
  seed = 42,
  roughness = 1.5,
  strokeColor = 'var(--color-border)',
  fillColor = 'var(--color-paper)',
  children,
  style,
}: RoughBorderProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    // Clear previous drawings
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rc = rough.svg(svg);
    const rect = rc.rectangle(4, 4, width - 8, height - 8, {
      roughness,
      stroke: strokeColor,
      fill: fillColor,
      fillStyle: 'solid',
      seed,
    });
    svg.appendChild(rect);
  }, [width, height, seed, roughness, strokeColor, fillColor]);

  return (
    <div style={{ position: 'relative', width, height, ...style }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          bottom: 8,
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
