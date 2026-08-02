// Photo drafts appear locally and in Netlify Deploy Previews, but never in a
// production deploy. Kept pure so the otherwise-silent context rule is tested.
export function includePhotoDrafts({ dev = false, context = '' } = {}) {
  return dev || context === 'deploy-preview';
}
