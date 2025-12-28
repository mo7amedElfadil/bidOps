# HyprDark Theme Developer Guide

## Overview

HyprDark is a terminal/tiling-window-manager-inspired dark theme for BidOps. It transforms the UI into a dashboard-like experience with clear panel separation, cool-toned accents, and technical aesthetics inspired by Hyprland, Neovim, and Arch terminal setups.

## Design Principles

1. **No Duplication**: Single codebase for all themes using CSS variables
2. **Token-Driven**: All colors and spacing managed through CSS custom properties
3. **Panel/Tile Architecture**: Content organized in distinct bordered tiles
4. **Terminal Aesthetic**: Monospace for metadata, cool color palette, crisp borders
5. **Professional Restraint**: Subtle glows, muted colors, no neon

## Theme System

### Data Attribute

Themes are applied via `data-theme` attribute on the root HTML element:

```html
<html data-theme="light">  <!-- or "hyprdark" -->
```

The `ThemeProvider` context manages this automatically, persisting selection in localStorage.

### Using the Theme Context

```tsx
import { useTheme } from '../contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // theme: 'light' | 'hyprdark' | 'system'
  // resolvedTheme: 'light' | 'hyprdark' (resolved if system)
  // setTheme: (theme) => void
}
```

## CSS Variables

### Core Tokens (Both Themes)

```css
--background         /* Page background */
--foreground         /* Primary text */
--card               /* Card/panel background */
--card-foreground    /* Card text */
--border             /* Default borders */
--input              /* Input backgrounds */
--ring               /* Focus ring color */
--primary            /* Primary action color */
--primary-foreground
--secondary
--secondary-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--muted              /* Subtle backgrounds */
--muted-foreground   /* Subtle text */
--radius             /* Border radius base */
```

### HyprDark-Specific Tokens

```css
--panel-bg           /* Tile/panel background (slightly lighter than page) */
--panel-bg-2         /* Nested panel background */
--panel-titlebar-bg  /* Optional titlebar strip at top of panels */
--panel-border       /* Panel border color (cool-toned) */
--panel-border-strong /* Stronger borders for emphasis */
--panel-glow         /* Subtle glow for active/focused panels */
--grid-line          /* Table separator lines */
--font-mono          /* Monospace font stack */
```

## Using Semantic Tokens in Tailwind

The Tailwind config maps CSS variables to utility classes:

```tsx
// ✅ Good - uses semantic tokens
<div className="bg-card text-card-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
<input className="bg-input border-border text-foreground" />

// ❌ Bad - hardcoded colors
<div className="bg-white text-slate-900 border-slate-200" />
```

### Common Patterns

```tsx
// Card/Panel
<div className="bg-card border border-border rounded-lg shadow-sm" />

// Button variants
<button className="bg-primary text-primary-foreground hover:bg-primary/90" />
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />

// Muted/subtle elements
<p className="text-muted-foreground" />
<div className="bg-muted" />

// Destructive/error
<button className="bg-destructive text-destructive-foreground" />
```

## Component Guidelines

### Cards as Tiles

Cards should feel like window tiles in HyprDark:

```tsx
<Card 
  titlebar  // Add titlebar strip for major panels
  header={<div>Panel Title</div>}
>
  Content here
</Card>
```

The `Card` component automatically applies:
- Panel background in HyprDark
- Cool-toned borders
- Optional titlebar styling

### Tables

Tables get grid-like separators in HyprDark:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead className="font-mono">Code</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-mono">12345</TableCell>
      <TableCell>Value</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

Use `font-mono` class for numeric columns, IDs, timestamps, and codes.

### Badges/Chips

```tsx
<Badge variant="primary">Active</Badge>
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
```

Badges automatically become outlined and compact in HyprDark.

### Buttons

```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="danger">Delete</Button>
```

All button variants adapt to theme tokens automatically.

### Inputs

```tsx
<Input 
  placeholder="Search..."
  className="max-w-md"
/>
```

Inputs get terminal-field styling in HyprDark (dark surface, brightened focus border).

## Theme-Specific Conditionals

### When to Use Conditionals

Use sparingly and only when CSS alone cannot achieve the goal:

```tsx
import { useTheme } from '../contexts/ThemeContext'

function MyComponent() {
  const { resolvedTheme } = useTheme()
  
  // ✅ Good use case: adding titlebar only in HyprDark
  return (
    <Card titlebar={resolvedTheme === 'hyprdark'}>
      ...
    </Card>
  )
}
```

### When NOT to Use Conditionals

```tsx
// ❌ Bad - should use CSS variables
const bgColor = theme === 'hyprdark' ? '#1a1c2e' : '#ffffff'

// ✅ Good - use semantic classes
<div className="bg-card" />
```

## Adding Custom HyprDark Styles

Use data attribute selectors in CSS:

```css
/* Light theme default */
.my-component {
  background: white;
  border: 1px solid #e5e7eb;
}

/* HyprDark override */
[data-theme='hyprdark'] .my-component {
  background: rgb(var(--panel-bg));
  border: 1px solid rgb(var(--panel-border));
}
```

Or in Tailwind with arbitrary values:

```tsx
<div className="data-[theme='hyprdark']:bg-[rgb(var(--panel-bg))]" />
```

## Typography

### Monospace Usage

In HyprDark, use monospace for "terminal metadata":

```tsx
<span className="font-mono text-xs">OPP-2024-001</span>
<span className="font-mono text-sm">2024-12-26 15:30</span>
<td className="font-mono">$125,000.00</td>
```

### Density

HyprDark should feel slightly more compact. Reduce padding where appropriate:

```tsx
// Light theme comfort
<div className="p-6" />

// HyprDark density (conditional or use variables)
<div className="p-4 data-[theme='hyprdark']:p-3" />
```

## Charts (Recharts)

Create a theme-aware wrapper:

```tsx
import { useTheme } from '../contexts/ThemeContext'

function ThemedChart({ data }) {
  const { resolvedTheme } = useTheme()
  
  const colors = resolvedTheme === 'hyprdark' 
    ? ['#06b6d4', '#a855f7', '#34d399'] // cyan, purple, green
    : ['#3b82f6', '#8b5cf6', '#10b981']
  
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={resolvedTheme === 'hyprdark' ? 'rgb(var(--grid-line))' : '#e5e7eb'} 
        />
        ...
      </BarChart>
    </ResponsiveContainer>
  )
}
```

## Anti-Patterns (What NOT to Do)

### ❌ Don't Create Separate Components

```tsx
// ❌ Bad
<DarkModeCard />
<LightModeCard />

// ✅ Good
<Card />  // Adapts to theme automatically
```

### ❌ Don't Duplicate Pages

```tsx
// ❌ Bad
<Route path="/dashboard" element={<DashboardLight />} />
<Route path="/dashboard-dark" element={<DashboardDark />} />

// ✅ Good
<Route path="/dashboard" element={<Dashboard />} />
```

### ❌ Don't Hardcode Colors

```tsx
// ❌ Bad
<div style={{ background: '#1a1c2e' }} />
<div className="bg-[#1a1c2e]" />

// ✅ Good
<div className="bg-card" />
<div className="bg-[rgb(var(--panel-bg))]" />
```

### ❌ Don't Overuse Theme Conditionals

```tsx
// ❌ Bad - too much branching
function MyComponent() {
  const { resolvedTheme } = useTheme()
  
  if (resolvedTheme === 'hyprdark') {
    return <DarkVersion />
  }
  return <LightVersion />
}

// ✅ Good - shared component with theme tokens
function MyComponent() {
  return (
    <div className="bg-card text-card-foreground">
      Shared logic
    </div>
  )
}
```

## Testing Themes

1. Toggle between themes using `ThemeToggle` component
2. Check all interactive states (hover, focus, active, disabled)
3. Verify readability and contrast
4. Test on actual pages, not just component previews
5. Ensure no flash of unstyled content on load

## Adding New Tokens

If you need new theme-specific variables:

1. Add to both `:root` and `[data-theme='hyprdark']` in `styles.css`
2. Document in Tailwind config if needed as utility
3. Update this guide with usage examples
4. Ensure token has semantic name (not implementation detail)

```css
/* Add to styles.css */
:root {
  --my-new-token: 255 255 255;
}

[data-theme='hyprdark'] {
  --my-new-token: 20 28 46;
}
```

```tsx
// Use in components
<div className="bg-[rgb(var(--my-new-token))]" />
```

## Accessibility

- Maintain WCAG AA contrast ratios minimum
- Focus states must be visible in both themes
- Don't rely solely on color to convey information
- Test with screen readers
- Ensure theme preference persists and respects system settings

## Performance

- Theme switching should be instant (CSS variables enable this)
- No layout shift or reflow on theme change
- localStorage prevents flash on reload
- System theme detection uses `prefers-color-scheme` media query
