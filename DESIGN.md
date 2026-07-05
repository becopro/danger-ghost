---
name: Danger Ghost v2.0
description: Immersive fullscreen Web3/DeSo RPG with neon cyberpunk styling and dyslexia accessibility.
colors:
  primary: "#00ffff"
  secondary: "#ff00ff"
  accent-green: "#00ff00"
  accent-gold: "#ffd700"
  neutral-bg: "#070708"
  neutral-surface: "#0d0d10"
  text-main: "#e0ffff"
  text-muted: "#8c8c9a"
typography:
  display:
    fontFamily: "Orbitron, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.15em"
  body:
    fontFamily: "Inter, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "12px"
  lg: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-green}"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: Danger Ghost v2.0

## 1. Overview

**Creative North Star: "Cyberpunk Immersive Overlay"**

Danger Ghost v2.0 abandons external HTML controls in favor of an immersive fullscreen console. The entire viewport is occupied by the game canvas. Interface overlays (such as inventories, hero details, and equipment selectors) float directly on top of the gameplay using semi-transparent dark glass panels illuminated by stark neon glowing borders.

### Core Configuration (Dials):
* **`DESIGN_VARIANCE: 8`** (Strong identity, skewed header transformations, high-contrast neon borders).
* **`MOTION_INTENSITY: 6`** (Smooth transitions using exponential damping curves and spring equations).
* **`VISUAL_DENSITY: 7`** (Traditional RPG dashboard: attribute metrics and items are compact but breathe via generous text line heights).

### Depth Hierarchy (Semantic Z-Index Scale):
- `z-index: 10` - In-game UI bars (HP/XP indicators) and nameplates.
- `z-index: 100` - Core panel containers (HERO, BAG, EQUIP overlays).
- `z-index: 200` - Tooltips and sub-dropdown menus.
- `z-index: 300` - Prompts, confirmations, and dynamic dialog containers.
- `z-index: 500` - Notification toasts (Web3 state updates, loot notifications).

---

## 2. Colors

The color palette represents a dark cyberpunk universe where deep void backgrounds contrast with vibrant, glowing neon accents.

### Primary
- **Neon Cyan** (`#00ffff`): The primary color representing system notifications, magic power, level-ups, and user focus.

### Secondary
- **Neon Magenta** (`#ff00ff`): The secondary color used to denote threats, enemies, closing states, or risky actions.

### Tertiary
- **Neon Green** (`#00ff00`): The positive indicator color, representing player health (HP), successfully completed actions, and active powerups.
- **Neon Gold** (`#ffd700`): The Web3 color, representing rarity, legendary loot drops, and NFT/MINT interface elements.

### Neutral
- **Bg Void** (`#070708`): The main dark background color.
- **Surface Dark** (`#0d0d10`): The container background color.
- **Text Main** (`#e0ffff`): High contrast cyan-white used for primary body text to reduce eye strain.
- **Text Muted** (`#8c8c9a`): Secondary gray text.

### Named Rules
**The 10% Neon Rule.** Neon accents must cover no more than 10% of any overlay layout. Neon is meant to illuminate, not blind.
**The No-Pure-White Rule.** Pure white (`#ffffff`) text is forbidden on dark overlays to prevent screen glare. Use Text Main (`#e0ffff`) instead.
**The Color Consistency Lock.** Once a neon accent is chosen for a state (e.g. green for success/HP), it is locked and must not be mixed with other neon accents for that context.

---

## 3. Typography

**Display Font:** `Orbitron` (fallback: sans-serif)  
**Body Font:** `Inter` (fallback: `Roboto`, sans-serif)  

### Hierarchy
- **Display** (Bold 900, `24px` to `32px`, line-height 1.2, letter-spacing 0.15em): Large titles, heading headers, and level notifications.
- **Body** (Regular 400, `16px`, line-height 1.5): Stats list, descriptions, logs, dialog content, and general menus. Maximum line length capped at `65ch`.
- **Label** (Medium 500, `14px`, letter-spacing 0.05em, uppercase): Button labels, small titles, and table headers.

### Named Rules
**The Accessibility Spacing Rule.** Body text must always maintain a line-height of `1.5` and a minimum size of `16px` to assist users with dyslexia. Pixel-art font faces must never be used for long, dense paragraphs of text.
**Display Letter-Spacing Floor.** Letter-spacing for display headings must be at least `0.05em` to prevent character overlapping.

---

## 4. Elevation

Depth is conveyed through semi-transparent overlays and border glow effects rather than traditional drop shadows.

### Elevation Vocabulary
- **Neon Border Glow** (`box-shadow: 0 0 8px rgba(0, 255, 255, 0.4)`): Highlights interactive glass cards and active overlays.
- **Void Depth** (`backdrop-filter: blur(8px)`): Applied behind all active overlays to visually separate UI components from the active game canvas.

### Named Rules
**The Glass Separation Rule.** Floating panels must always use a combination of border stroke (`1px solid rgba(255, 255, 255, 0.08)`) and backdrop blur to lift the container off the canvas.

---

## 5. Components

### Buttons
- **Shape:** Rectilinear with sharp edges (`0px` to `4px` radius).
- **Primary Button:** Neon Cyan background with deep background-color text. Glow on hover.
- **Secondary Button:** Transparent background, Neon Cyan border stroke (`1px`). Full neon background fill on hover.
- **Tactile Feedback:** Active clicks translate the button (`transform: scale(0.98)` or `-translate-y-[1px]`) to simulate physical depth.

### Cards / Containers
- **Corner Style:** Rounded (`12px` or `16px` radius) on structural cards. Never exceed `16px`.
- **Background:** `rgba(24, 18, 36, 0.75)` with `backdrop-filter: blur(8px)`.
- **Border:** `1px solid rgba(255, 255, 255, 0.08)` to frame the window.

### Toast Notifications
- **Style:** Small overlay floating in the bottom-right corner.
- **HP / Success Toast:** Neon Green border, high-contrast text.
- **Danger / Error Toast:** Neon Magenta border, minor screenshake.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `Inter` at a minimum size of `16px` for player statistics and game descriptions.
- **Do** apply `backdrop-filter: blur(8px)` to all floating screens (Hero, Bag, Equip).
- **Do** style active selections with a subtle neon border glow.
- **Do** provide a `@media (prefers-reduced-motion: reduce)` fallback replacing slide animations with immediate crossfades.

### Don't:
- **Don't** use compact, pixelated fonts for stats, inventory labels, or game logs.
- **Don't** allow overlay text to touch card borders; use at least `16px` (`1rem`) of padding.
- **Don't** place control buttons or indicators outside of the 100vw/100vh game viewport.
- **Don't** combine borders with large blurred shadows (`box-shadow` blur >= 16px).
- **Don't** use colored side-stripes (e.g. `border-left` thicker than 1px) as decorative card indicators.
