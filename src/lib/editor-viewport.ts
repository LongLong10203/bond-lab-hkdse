import type { Molecule } from '@/chemistry/types';
import { moleculeDisplayBounds } from './molecule-display';

export type CanvasSize = { width: number; height: number };
export type Camera = { x: number; y: number; scale: number };
export const MOBILE_SCALE = .85; // 22-unit letters render at about 19 CSS pixels.
export const DEFAULT_CAMERA: Camera = { x: 360, y: 170, scale: MOBILE_SCALE };
export function fullCanvasScale(size: CanvasSize) {
  return Math.min(size.width / 720, size.height / 340);
}
export function boundedCamera(camera: Camera, size: CanvasSize): Camera {
  const scale = Math.max(fullCanvasScale(size), Math.min(1.6, camera.scale));
  const halfWidth = size.width / scale / 2, halfHeight = size.height / scale / 2;
  const bound = (value: number, half: number, extent: number) => half >= extent / 2 ? extent / 2 : Math.max(half, Math.min(extent - half, value));
  return { x: bound(camera.x, halfWidth, 720), y: bound(camera.y, halfHeight, 340), scale };
}
export function cameraViewBox(camera: Camera, size: CanvasSize) {
  const bounded = boundedCamera(camera, size);
  const width = size.width / bounded.scale, height = size.height / bounded.scale;
  return { x: bounded.x - width / 2, y: bounded.y - height / 2, width, height };
}
export function fitCamera(molecule: Molecule, size: CanvasSize): Camera {
  if (!molecule.atoms.length) return boundedCamera(DEFAULT_CAMERA, size);
  const bounds = moleculeDisplayBounds(molecule);
  return boundedCamera({
    x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2,
    scale: Math.min(MOBILE_SCALE, size.width / (bounds.right - bounds.left + 48), size.height / (bounds.bottom - bounds.top + 48)),
  }, size);
}
