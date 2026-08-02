export function scaledDimensions(width, height, maxEdge) {
  if (![width, height, maxEdge].every((value) => Number.isFinite(value) && value > 0)) {
    throw new TypeError('Image dimensions must be positive numbers');
  }
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
