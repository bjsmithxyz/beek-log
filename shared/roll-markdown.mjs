// Pure roll validation and Markdown serialization. The only dependency is the
// small YAML parser used by both the local and hosted authoring paths.
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

function locationFrontmatter(location) {
  const output = { name: location.name, lat: location.lat, lng: location.lng };
  if (location.region) {
    output.region = {
      name: location.region.name,
      lat: location.region.lat,
      lng: location.region.lng,
    };
  }
  return output;
}

function sameRegion(a, b) {
  if (!a && !b) return true;
  return !!a && !!b && a.name === b.name && a.lat === b.lat && a.lng === b.lng;
}

function sameLocation(a, b) {
  return a && b && a.name === b.name && a.lat === b.lat && a.lng === b.lng && sameRegion(a.region, b.region);
}

export function buildRollMarkdown({ title, stock, date, location, draft, photos, body = '' }) {
  const frontmatter = {
    title,
    stock,
    date,
    location: locationFrontmatter(location),
  };
  if (draft) frontmatter.draft = true;
  frontmatter.photos = photos.map((photo) => {
    const output = { src: photo.src, alt: photo.alt };
    if (photo.caption) output.caption = photo.caption;
    if (photo.location && !sameLocation(photo.location, location)) {
      output.location = locationFrontmatter(photo.location);
    }
    return output;
  });
  const yaml = stringifyYaml(frontmatter).trimEnd();
  return `---\n${yaml}\n---\n\n${String(body).trim()}\n`;
}

export function parseRollMarkdown(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('no frontmatter found');
  return { data: parseYaml(match[1]), body: (match[2] || '').trim() };
}

// Field validation shared by local and hosted roll publishing. Alt text is
// intentionally optional; the content schema accepts an empty string.
export function rollInputErrors({ slug, sourceSlug, stock, date, location, frames }, filmStocks = {}) {
  const errors = [];
  if (!/^[a-z0-9-]+$/.test(slug || '')) errors.push('slug must match [a-z0-9-]');
  if (sourceSlug && !/^[a-z0-9-]+$/.test(sourceSlug)) errors.push('sourceSlug must match [a-z0-9-]');
  if (!(stock in filmStocks)) errors.push(`unknown stock: ${stock}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) errors.push('date must be YYYY-MM-DD');
  if (!location || !location.name || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    errors.push('roll location needs name + numeric lat/lng');
  }
  const badRegion = (value) => value && value.region && (
    !value.region.name || !Number.isFinite(value.region.lat) || !Number.isFinite(value.region.lng)
  );
  if (badRegion(location)) errors.push('roll region invalid');
  if (!Array.isArray(frames) || frames.length === 0) errors.push('at least one frame required');
  (frames || []).forEach((frame, index) => {
    if (frame.location && (
      !frame.location.name || !Number.isFinite(frame.location.lat) || !Number.isFinite(frame.location.lng)
    )) {
      errors.push(`frame ${index + 1} location invalid`);
    }
    if (badRegion(frame.location)) errors.push(`frame ${index + 1} region invalid`);
  });
  return errors;
}
