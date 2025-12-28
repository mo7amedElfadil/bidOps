Got it. Here’s a **stack-specific, screenshot-free** prompt you can give an AI implementation agent. It describes the look in enough detail to recreate the Hyprland/Neovim/Arch-terminal vibe without seeing your images, and it sets guardrails so you don’t end up maintaining two separate UIs.

---

## AI Agent Prompt: Add a “HyprDark” Theme Variant (Hyprland + Neovim + Arch Terminal vibe)

You are implementing a **second theme** for an existing bid management web platform. The current theme is a standard **light theme**. Add an alternative dark theme called **HyprDark** that changes the UI’s visual language significantly. The goal is not “dark mode” but a **terminal/tiling-window-manager dashboard** feel inspired by Hyprland, Neovim, and Arch terminal setups.

### Tech Stack (must respect)

* React 18 + Vite
* TypeScript
* Tailwind CSS
* shadcn/ui components (Radix)
* TanStack Query
* React Router v6
* Recharts
* MSAL for AAD login when `AUTH_PROVIDER=aad`

### Hard requirements

1. **No duplicated pages**. Do not create separate “dark versions” of pages/components.
2. Build HyprDark using **design tokens and CSS variables**, primarily by extending the existing shadcn theme system.
3. Theme must be switchable:

   * Light ↔ HyprDark (and optionally System)
   * Persist selection in localStorage
4. HyprDark should **visibly change layout styling**: panels, borders, separators, typography usage, and component density. Logic stays shared.

---

# 1) Describe the HyprDark aesthetic precisely (no screenshots)

## Overall vibe

HyprDark should look like a **tiling window manager**: the UI feels like it is made of distinct “tiles/panels” with crisp separation. It should evoke a **terminal dashboard** rather than a typical web app.

### Background

* Background is **not pure black**. Use a **deep navy / midnight blue** base with a subtle gradient (very subtle).
* Optional: a *very low opacity* noise/scanline overlay is acceptable but must not reduce readability.

### Panels/Tiles (core visual unit)

* Most content should be contained inside **rectangular tiles** with:

  * visible but **subtle cool-toned borders** (blue/teal tinted gray)
  * slightly lighter panel fill than the page background
  * crisp corners with moderate radius (not bubbly)
* Panels should feel “window-like”:

  * a thin “titlebar strip” at the top of panels is encouraged for key surfaces (cards, sections)
  * titlebar shows a compact label on the left and optional tiny actions/icons on the right

### Borders and separation

* Borders are essential to the aesthetic:

  * default border: thin, cool-toned, semi-transparent
  * strong separators: slightly stronger border for dividing regions and tables
* “Active/focused” panel gets:

  * border brightening + *very subtle glow* (restrained, professional)

### Typography

* Primary UI text can remain a clean sans font.
* Introduce a monospace layer for “terminal metadata,” such as:

  * IDs, codes, timestamps, stage labels, numeric values, system-like tags
* Increase alignment and density:

  * spacing should be slightly tighter than light theme (more dashboard-like)

### Color language (terminal palette, muted)

* Accent should be **cyan/blue** (primary highlight)
* Secondary accent: **purple/magenta** (used sparingly for selection and emphasis)
* Success: muted green
* Warning: muted amber
* Destructive: muted red
* Everything should feel **cool** and **technical**, not neon or gamer-y.

### Component feel

* Buttons: “keycap-like” (outlined or subtle filled), with crisp hover/focus states.
* Inputs: terminal field feel (dark surface, border defined, focus border brightens).
* Tables: tight, grid-like separators; monospace for numeric columns; row hover is subtle.
* Chips/badges: outlined, compact, square-ish, terminal tag vibe.
* Modals/popovers: same panel tile treatment (bordered, slightly elevated, no heavy drop shadow).

---

# 2) Implementation plan (stack-specific)

## A) Use shadcn/ui theming properly (do not fork components)

You must implement HyprDark by extending the existing shadcn token system (CSS variables). shadcn commonly uses `:root` and `.dark` variables. Do the following:

1. Keep `:root` for light theme variables.
2. Add a new theme attribute approach:

   * Use `data-theme="light"` and `data-theme="hyprdark"`
   * Do **not** rely solely on `.dark` if it will conflict with existing conventions. Prefer explicit `data-theme`.
3. Define a full set of CSS variables under `[data-theme="hyprdark"]`:

   * `--background`, `--foreground`
   * `--card`, `--card-foreground`
   * `--popover`, `--popover-foreground`
   * `--muted`, `--muted-foreground`
   * `--border`, `--input`, `--ring`
   * `--primary`, `--primary-foreground`
   * `--secondary`, `--accent`, `--destructive`
   * charts tokens if you have them
4. Add **additional HyprDark-only tokens** (custom CSS variables) for the tiling look:

   * `--panel-bg` (tile background)
   * `--panel-bg-2` (nested tile background)
   * `--panel-titlebar-bg`
   * `--panel-border`
   * `--panel-border-strong`
   * `--panel-glow` (subtle)
   * `--grid-line` (table separators)
   * `--mono` font stack token (optional)

## B) Tailwind integration

* Update `tailwind.config` to ensure `colors` map to CSS variables consistently.
* Use Tailwind utilities that reference CSS vars via the shadcn approach.
* If using `cn()` helpers, keep them.

## C) ThemeProvider + persistence

Implement a `ThemeProvider` that:

* reads saved theme from localStorage
* applies `document.documentElement.dataset.theme = "hyprdark" | "light"`
* exposes a hook like `useTheme()`
* supports System theme optionally

Add a theme toggle UI (e.g., in user menu/settings):

* options: Light / HyprDark / System (optional)
* persist selection

---

# 3) Component styling rules (what to change without duplication)

## Global layout

* Background uses the HyprDark gradient.
* Main content areas should use a subtle container padding and tile grid feel.

## Card → Tile transformation (key requirement)

shadcn Card should become a “tile” in HyprDark:

* In HyprDark:

  * Card background uses `--panel-bg`
  * Border uses `--panel-border`
  * Radius slightly larger than default
  * Optional: insert a `CardTitlebar` region (thin top strip)
* In Light:

  * Keep existing behavior

Implementation detail:

* Do not create a new Card component copy.
* Enhance Card with variant classes based on theme (read from context or via CSS selectors using `[data-theme="hyprdark"] .card { ... }`).

## Tables

* Increase grid separators in HyprDark:

  * row/column borders visible but subtle
* Use monospace for numeric columns and IDs
* Hover states should not flood-fill; use mild lift or slight background shift

## Badges/Chips

* In HyprDark:

  * outlined badges
  * compact padding
  * subtle background (almost transparent)
  * crisp borders

## Buttons

* Primary button:

  * slightly brighter fill with accent border
* Secondary buttons:

  * outlined keycap style
* Focus ring:

  * visible, cool-toned

## Inputs

* Terminal-field feel:

  * dark fill
  * defined border
  * brightened border on focus + ring

## Panels within pages (Approvals/Pricing/Submission)

These pages must feel like a **dashboard**:

* Use tiles for:

  * approval stage cards
  * pricing pack sections
  * checklists
* Add thin “statusline” elements:

  * compact line showing stage, due date, owner, time remaining
  * use monospace for the metadata

---

# 4) Recharts styling (dark theme must be coherent)

For HyprDark:

* Chart backgrounds should match panel surface.
* Grid lines should be subtle.
* Tooltip should look like a tile (bordered, dark surface).
* Avoid bright neon series colors; use muted terminal palette.
  Implementation:
* Create a chart theme wrapper that reads CSS variables and passes them into Recharts components.
* Do not hardcode colors in many places; centralize palette.

---

# 5) Where to apply / pages to validate

Ensure HyprDark looks excellent on:

* Available Tenders list/detail
* Opportunity board (cards/columns feel like tiling WM tiles)
* Approvals page (stage cards, comments, statusline)
* Pricing page (tables, margin notes, approval actions)
* Submission checklist (bond item, reminders)
* Modals, dropdowns, toasts
* Login screen (AAD MSAL path and normal login)
but ensure that it is implemented across all of the UI pages. Create a tracking file, hyperDarkTracking.md that you update once each page or section is updated:
 - Dashboard & Navigation
      - Dashboard home (/, /dashboard) with role-based onboarding + admin setup checklist
      - Header mega‑menu groups: Pipeline, Market, User, Admin
      - In‑app notifications (/notifications) + header inbox dropdown
  - Opportunities (Pipeline)
      - Opportunities list (/opportunities)
      - Kanban board (/board)
      - Timeline (/timeline)
      - Tracker import wizard (/import/tracker)
      - Post‑submission board lane (/post-submission)
      - Opportunity workspace:
          - Overview (/opportunity/:id)
          - Attachments (/opportunity/:id/attachments)
          - Compliance matrix (/opportunity/:id/compliance)
          - Clarifications (/opportunity/:id/clarifications)
          - Pricing workspace (/opportunity/:id/pricing)
          - Approvals workflow (/opportunity/:id/approvals)
          - Submission pack (/opportunity/:id/submission)
          - Outcome recording (/opportunity/:id/outcome)
  - Approvals
      - Bid review queue (/approvals/review)
  - Market / Intake
      - Awards staging (/awards/staging)
      - Curated awards (/awards/events)
      - Available tenders (/tenders/available)
  - Search
      - Attachment search (/search)
  - Settings
      - SLA + holiday calendar (/settings/sla)
      - Opportunity lifecycle lists (/settings/lifecycle)
      - System defaults (retention, timezone, import format, FX) (/settings/system)
  - User & Admin
      - Account/profile (/account)
      - Admin users (/admin/users)
      - Business roles (/admin/business-roles)
  - Auth
      - Callback (/auth/callback)
      - Login (/auth/login)
      - Signup (/auth/signup)
      - Accept invite (/auth/accept-invite)
      - Forgot/reset password (/auth/forgot-password, /auth/reset-password)
      - Change password (/auth/change-password)
      - Dev login (/auth/dev)

---

# 6) Maintainability rules (do not create two UIs)

* No duplicated route trees.
* No separate component copies for dark theme.
* Only allow small theme-conditionals for:

  * adding a titlebar strip
  * changing density and typography usage
    Everything else must be token-driven. Keep the same business logic and props.

---

# 7) Deliverables

1. Theme system:

   * `[data-theme="hyprdark"]` tokens in a global CSS file
   * ThemeProvider + hook
   * Toggle UI and persistence. Theme switcher UI in user settings (and/or header)
   * Refactored components using semantic tokens (best effort to refactor and abstract components to not repeat code)
2. Component refinements:

   * Cards as tiles
   * Table grid separators
   * Badges, inputs, buttons tuned for HyprDark
3. Recharts styling for HyprDark
4. Short dev doc:

   * how theme tokens work and live and add new tokens
   * how to style new components safely
 	* how to keep components theme-safe
   * what not to do (no duplication)

---

# 8) Acceptance criteria
* Switching themes instantly changes the entire look and feel, not just background color.
* Dark theme has:

  * deep background
  * clear tiling/panel separation
  * readable typography
  * restrained but distinct accents
* No duplicated pages.
* Minimal component branching and only where necessary.
* All interactive states are clear: hover, focus, disabled, selected.
* The approvals lifecycle UI remains easy to scan and is more “terminal dashboard” than “generic dark mode”.

In short:
* Switching to HyprDark feels like entering a different UI “mode,” not just dark colors.
* Panels are clearly separated like a tiling WM.
* Borders are visible but not bright; no “washed out” contrast.
* Metadata uses monospace in a tasteful way.
* No page duplication; theme is maintainable long-term.

---

## Optional add-on 

This is a future addition to implement **two HyprDark variants** as presets later:

* `hyprdark-blue` (cool cyan dominant)
* `hyprdark-purple` (slightly more magenta accents)
  …but for now implement just one.

---


