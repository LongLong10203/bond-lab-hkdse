'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Molecule } from '@/chemistry/types';
import { boundedCamera, cameraViewBox, DEFAULT_CAMERA, fitCamera, fullCanvasScale, type CanvasSize } from '@/lib/editor-viewport';

export function useEditorViewport(svg: RefObject<SVGSVGElement | null>) {
  const [mobile, setMobile] = useState(false);
  const [size, setSize] = useState<CanvasSize>({ width: 320, height: 320 });
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [pan, setPan] = useState(false);
  const drag = useRef<{ pointerId: number; x: number; y: number; camera: typeof camera } | null>(null);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const media = window.matchMedia('(max-width: 660px)');
    const sync = () => {
      setMobile(media.matches);
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height });
    };
    const observer = new ResizeObserver(sync);
    observer.observe(element); media.addEventListener('change', sync); sync();
    return () => { observer.disconnect(); media.removeEventListener('change', sync); };
  }, [svg]);
  const current = boundedCamera(camera, size);
  const box = cameraViewBox(current, size);
  return {
    mobile, panning: mobile && pan, setPan,
    viewBox: mobile ? `${box.x} ${box.y} ${box.width} ${box.height}` : '0 0 720 340',
    canZoomIn: current.scale < 1.6 - .001,
    canZoomOut: current.scale > fullCanvasScale(size) + .001,
    zoom: (factor: number) => setCamera(boundedCamera({ ...current, scale: current.scale * factor }, size)),
    fit: (molecule: Molecule) => { if (mobile) setCamera(fitCamera(molecule, size)); },
    startPan: (pointerId: number, x: number, y: number) => { drag.current = { pointerId, x, y, camera: current }; },
    movePan: (pointerId: number, x: number, y: number) => {
      const start = drag.current;
      if (!start || start.pointerId !== pointerId) return;
      setCamera(boundedCamera({ ...start.camera, x: start.camera.x - (x - start.x) / start.camera.scale, y: start.camera.y - (y - start.y) / start.camera.scale }, size));
    },
    endPan: () => { drag.current = null; },
    nudge: (x: number, y: number) => setCamera(boundedCamera({ ...current, x: current.x + x, y: current.y + y }, size)),
  };
}
