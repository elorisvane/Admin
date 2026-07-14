"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import type { GlobePoint } from "@/app/src/data/live";

/**
 * The dotted globe on Live View: one marker per place a session came from in the
 * last 24 hours, spinning slowly and draggable.
 *
 * Rendered with `cobe` (~5KB WebGL) rather than a map library — it ships its own
 * landmass data, so the whole thing stays self-contained with no tiles, no map
 * API key and no external requests.
 */

// Admin palette, as cobe's 0–1 RGB triples.
const GOLD_500: [number, number, number] = [0.667, 0.486, 0.239]; // #aa7c3d
// Somewhere a session came from earlier in the window, but nobody is there now.
const DORMANT: [number, number, number] = [0.78, 0.75, 0.7];

/** Bigger dot for a busier place, but flattened so one spike can't swamp the map. */
function markerSize(sessions: number, peak: number): number {
  const share = peak > 0 ? sessions / peak : 0;
  return 0.03 + Math.sqrt(share) * 0.06;
}

export default function Globe({ points }: { points: GlobePoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read inside onRender (which runs every frame) so new poll data appears
  // without tearing down and rebuilding the globe.
  const pointsRef = useRef(points);
  pointsRef.current = points;

  // Drag-to-spin state, kept in refs so it never triggers a React re-render.
  const phi = useRef(0);
  const width = useRef(0);
  const dragging = useRef<number | null>(null);
  const offset = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      width.current = canvas.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width.current * 2,
      height: width.current * 2,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [0.95, 0.94, 0.92],
      markerColor: GOLD_500,
      glowColor: [1, 1, 1],
      markers: [],
    });

    // cobe v2 runs no loop of its own — each `update()` paints one frame, so the
    // spin (and picking up freshly polled markers) is driven from here.
    let frame = requestAnimationFrame(function render() {
      const live = pointsRef.current;
      const peak = Math.max(1, ...live.map((p) => p.sessions));

      // Idle: drift eastward. Held: follow the pointer instead.
      if (dragging.current === null) phi.current += 0.003;

      globe.update({
        phi: phi.current + offset.current,
        width: width.current * 2,
        height: width.current * 2,
        markers: live.map((p) => ({
          location: [p.lat, p.lng] as [number, number],
          size: markerSize(p.sessions, peak),
          // Gold where someone is on the site right now; muted where they were
          // earlier in the window. Same split as the legend.
          color: p.live ? GOLD_500 : DORMANT,
        })),
      });

      canvas.style.opacity = "1";
      frame = requestAnimationFrame(render);
    });

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = e.clientX - offset.current * 200;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current === null) return;
    offset.current = (e.clientX - dragging.current) / 200;
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = null;
    e.currentTarget.style.cursor = "grab";
  };

  return (
    <div className="relative aspect-square w-full max-w-2xl">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="h-full w-full cursor-grab opacity-0 transition-opacity duration-700"
        style={{ contain: "layout paint size" }}
      />
      {points.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-muted">
          No located sessions yet
        </p>
      )}
    </div>
  );
}
