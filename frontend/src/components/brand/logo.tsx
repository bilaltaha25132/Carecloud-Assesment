import type { CSSProperties } from 'react';

// The official CareCloud logo lives as an SVG in /public/brand. Painting it
// through a CSS mask lets one asset take the current text color: brand blue on
// light surfaces, white on the sign-in panel. The mask uses the artwork's
// shape, so the file's own color is irrelevant.
const LOGO_ASPECT = '1024 / 270';
const LOGO_URL = 'url(/brand/carecloud-logo.svg)';

export function Logo({ height = 30, inverted = false }: { height?: number; inverted?: boolean }) {
  const style: CSSProperties = {
    height,
    aspectRatio: LOGO_ASPECT,
    backgroundColor: 'currentColor',
    maskImage: LOGO_URL,
    WebkitMaskImage: LOGO_URL,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
  };
  return (
    <span
      role="img"
      aria-label="CareCloud"
      className={inverted ? 'inline-block text-surface' : 'inline-block text-brand'}
      style={style}
    />
  );
}
