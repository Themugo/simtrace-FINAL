import type { CSSProperties } from "react";

/**
 * CSSProperties extended to allow CSS custom properties (e.g. `--accent`)
 * in inline `style` objects. React's built-in CSSProperties type only
 * recognizes standard CSS properties, so setting a custom property inline
 * needs this widened type rather than an `any` cast at each call site.
 *
 * Usage: style={{ "--accent": color } as CSSPropertiesWithVars}
 */
export type CSSPropertiesWithVars = CSSProperties & {
  [key: `--${string}`]: string | number;
};
