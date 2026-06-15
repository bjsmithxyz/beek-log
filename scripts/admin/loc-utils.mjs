// Pure location helpers shared by the admin browser app and its tests.
// No DOM, no I/O — safe to import in both the browser (served at /loc-utils.mjs)
// and node --test.

export function dedupeByName(locations) {
  const seen = new Set();
  const out = [];
  for (const loc of locations) {
    if (!loc || !loc.name) continue;
    const key = loc.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(loc);
  }
  return out;
}

// The roll's primary plus every frame's explicit location, deduped — these are
// the reuse chips offered in the picker.
export function knownLocations(rollPrimary, frames) {
  const all = [];
  if (rollPrimary) all.push(rollPrimary);
  for (const f of frames) if (f.location) all.push(f.location);
  return dedupeByName(all);
}

// Assign a location to one frame and cascade to following frames that have not
// been explicitly set. Mutates `frames` in place (the admin holds a single
// module-level array and re-renders manually after); returns it for convenience.
export function fillForward(frames, fromIndex, loc) {
  frames[fromIndex].location = loc;
  frames[fromIndex].explicit = true;
  for (let j = fromIndex + 1; j < frames.length && !frames[j].explicit; j++) {
    frames[j].location = loc;
  }
  return frames;
}
