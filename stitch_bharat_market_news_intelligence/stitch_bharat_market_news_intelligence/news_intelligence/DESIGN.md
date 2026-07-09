---
name: News Intelligence
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#b9cbbb'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#849586'
  outline-variant: '#3b4b3e'
  surface-tint: '#00e383'
  primary: '#f2fff1'
  on-primary: '#00391d'
  primary-container: '#00ff94'
  on-primary-container: '#00713f'
  inverse-primary: '#006d3c'
  secondary: '#ffb4ab'
  on-secondary: '#690006'
  secondary-container: '#d30017'
  on-secondary-container: '#ffe2de'
  tertiary: '#fcfbff'
  on-tertiary: '#003060'
  tertiary-container: '#d0e0ff'
  on-tertiary-container: '#0062b9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#5bffa1'
  primary-fixed-dim: '#00e383'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000c'
  tertiary-fixed: '#d5e3ff'
  tertiary-fixed-dim: '#a7c8ff'
  on-tertiary-fixed: '#001b3b'
  on-tertiary-fixed-variant: '#004788'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  stat-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.05em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 48px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style

This design system is engineered for the high-stakes world of financial intelligence, blending the information density of a professional trading terminal with the sophisticated aesthetics of modern glassmorphism. The brand persona is authoritative, predictive, and technologically advanced. It targets institutional investors and data-driven analysts who require clarity amidst complexity.

The visual direction follows a **Futuristic Glassmorphic** style. It utilizes deep layering, background blurs, and luminous accents to prioritize critical data points. The interface feels like a high-end heads-up display (HUD), emphasizing real-time movement through glowing states and translucent surfaces that maintain a sense of depth and spatial awareness.

## Colors

The palette is rooted in a "Deep Space" neutral base to minimize eye strain during long-form analysis. 

- **Primary (Neon Green):** Reserved for positive market trends, "Buy" signals, and successful growth metrics. 
- **Secondary (Glowing Red):** Utilized for negative trends, "Sell" alerts, and critical warnings. 
- **Tertiary (Electric Blue):** The primary brand accent used for interactive elements, neutral data points, and system-level information.
- **Glass Surfaces:** Backgrounds should utilize the `background_glass_hex` with a `backdrop-filter: blur(20px)` to create the signature glassmorphic effect.

## Typography

This design system utilizes a dual-font strategy. **Outfit** provides a sleek, geometric feel for headlines and display elements, evoking a futuristic tone. **Inter** is used for all body copy and tabular data to ensure maximum legibility and functional precision.

For financial tickers and numerical data, use the `stat-lg` style with tabular lining figures enabled (monospaced numbers) to ensure columns of data align perfectly for quick scanning.

## Layout & Spacing

The layout follows a **Fluid Grid** system based on a 12-column architecture for desktop and a 4-column architecture for mobile. 

The spacing rhythm is strictly 4px-based. Information density should remain high, reflecting a "terminal" environment. Containers should use `16px` internal padding to allow the glassmorphic background blurs to feel substantial without wasting excessive screen real estate. Large-scale data visualizations should span at least 8 columns on desktop to maintain clarity.

## Elevation & Depth

Depth is communicated through **Glassmorphism** rather than traditional shadows. 

1.  **Base Layer:** The deepest background level (`#0A0C10`).
2.  **Surface Level:** Semi-transparent panels with 20px background blur and a 1px solid stroke at 10% opacity.
3.  **Raised Level:** Panels used for active modals or hovered cards. These gain a subtle outer glow using the Tertiary Blue (`rgba(49, 145, 255, 0.15)`) with a 15px spread.

Avoid solid black shadows. Instead, use "Inner Glows" on the top-left edge of components to simulate light hitting the edge of a glass pane.

## Shapes

The shape language is defined by a high degree of roundedness, contrasting the "sharp" nature of financial data with a "soft" futuristic container. All buttons and status badges must be fully **Pill-shaped**. 

Cards and larger containers use the `rounded-xl` (3rem) setting to reinforce the premium, liquid-crystal-display feel of the interface. This curvature helps distinguish distinct data modules on a dense dashboard.

## Components

### Buttons & Interactivity
- **Action Buttons:** Fully pill-shaped. Primary buttons use a gradient of Tertiary Blue to a slightly darker shade, with a subtle 4px outer glow of the same color.
- **Ghost Buttons:** 1px Electric Blue border with 0% background fill, becoming 10% on hover.

### Badges & Chips
- **Trend Indicators:** Pill-shaped badges with a 10% opacity background of the trend color (Green/Red) and 100% opacity text. Add a 2px "pulse" animation for real-time price updates.
- **Glowing Badges:** For "Breaking News" or "Live," use a solid Neon Green badge with an external glow.

### Input Fields
- Inputs are translucent dark wells with 1px borders. Upon focus, the border glows Electric Blue, and the background blur intensity increases.

### Cards
- Financial cards should feature a subtle gradient border (Top-Left to Bottom-Right) ranging from `rgba(255,255,255,0.1)` to `rgba(255,255,255,0)`.

### Data Visualizations
- Line charts should use 2px thickness with a vertical gradient fill beneath the line, fading to 0% opacity at the baseline. Line colors must strictly follow the Primary/Secondary trend logic.