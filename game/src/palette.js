// The look plan, in one place. Six values and one accent hue; the lighting makes every
// shade the game needs, so no other colour appears in the code. The same six names are
// the CSS custom properties in index.html.
export const PALETTE = {
  canvas: '#18202b',
  surface: '#39465a',
  hairline: '#2c3a4d',
  ink: '#e2e8f0',
  muted: '#8293ad',
  accent: '#f59e0b',
  teal: '#0d9488',
  oxide: '#b91c1c',
  sand: '#d4b595',
};

export function shade(name) {
  return PALETTE[name];
}
