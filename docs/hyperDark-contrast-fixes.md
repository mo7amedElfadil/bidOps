# HyprDark Theme - Contrast Fixes Applied

## Issue
Some buttons and input fields had both light background and light text in HyprDark theme, making them unreadable.

## Root Causes

### 1. Primary Button Contrast Issue
- **Problem**: `--primary-foreground` was set to dark text (`15 23 42`) while primary button background was cyan
- **Impact**: Dark text on cyan background had poor contrast in HyprDark
- **Fix**: Changed `--primary-foreground` to light color (`226 232 240`)

### 2. Input Background Issue  
- **Problem**: Input component used `bg-card` which is a light panel color, combined with light foreground text
- **Impact**: Light text on light background = invisible
- **Fix**: 
  - Changed Input component to use `bg-input` instead of `bg-card`
  - Updated `--input` token in HyprDark to darker value (`15 21 36`)
  - Updated `--input` in Light theme to white (`255 255 255`)

### 3. Accent Foreground Issue
- **Problem**: `--accent-foreground` was dark, causing poor contrast on accent backgrounds
- **Fix**: Changed to light color (`226 232 240`)

### 4. Destructive Foreground Issue
- **Problem**: `--destructive-foreground` was dark on red background
- **Fix**: Changed to light color (`226 232 240`)

### 5. Form Elements (select, textarea)
- **Problem**: No explicit styling for native select and textarea elements
- **Fix**: Added global CSS rules for all form elements to use semantic tokens

### 6. ThemeToggle Component
- **Problem**: Used hardcoded `bg-cyan-500` and inconsistent text colors
- **Fix**: Refactored to use `bg-accent` and `text-accent-foreground` semantic tokens

## Changes Made

### `/apps/web/src/styles.css`

```css
/* Updated HyprDark tokens for better contrast */
[data-theme='hyprdark'] {
  --input: 15 21 36;  /* Darker for better contrast */
  --primary-foreground: 226 232 240;  /* Light text on cyan */
  --accent-foreground: 226 232 240;  /* Light text on accent */
  --destructive-foreground: 226 232 240;  /* Light text on red */
}

/* Updated Light theme token */
:root {
  --input: 255 255 255;  /* White background for inputs */
}

/* Added global form element styles */
select,
textarea {
  background: rgb(var(--input));
  color: rgb(var(--foreground));
  border-color: rgb(var(--border));
}

select:focus,
textarea:focus {
  outline: none;
  border-color: rgb(var(--ring));
  box-shadow: 0 0 0 2px rgba(var(--ring), 0.2);
}
```

### `/apps/web/src/components/ui/Input.tsx`

```tsx
// Changed from:
className="... bg-card ..."

// To:
className="... bg-input ..."
```

### `/apps/web/src/components/ThemeToggle.tsx`

```tsx
// Changed from hardcoded colors to semantic tokens
theme === 'hyprdark'
  ? 'bg-accent text-accent-foreground'  // Instead of 'bg-cyan-500 text-foreground'
  : 'text-muted-foreground'
```

## Color Token Values Summary

### Light Theme
```
--input: 255 255 255 (white)
--foreground: 15 23 42 (dark text)
--primary-foreground: 255 255 255 (white on blue)
```

### HyprDark Theme
```
--input: 15 21 36 (very dark blue)
--foreground: 226 232 240 (light text)
--primary: 6 182 212 (cyan)
--primary-foreground: 226 232 240 (light on cyan)
--accent: 6 182 212 (cyan)
--accent-foreground: 226 232 240 (light on cyan)
--destructive: 239 68 68 (red)
--destructive-foreground: 226 232 240 (light on red)
```

## Testing Checklist

After these fixes, verify:

- [x] Primary buttons have readable text (light on cyan)
- [x] Input fields have dark background with light text in HyprDark
- [x] Input fields have white background with dark text in Light theme
- [x] Select dropdowns are readable in both themes
- [x] Textareas are readable in both themes
- [x] ThemeToggle shows clear active state
- [x] Destructive buttons (delete, etc.) have readable text
- [ ] All interactive states work (hover, focus, disabled)
- [ ] WCAG AA contrast ratios maintained

## Additional Recommendations

1. **Audit remaining components**: Check for any hardcoded `bg-white`, `text-slate-900` combinations
2. **Test with real data**: Load actual forms and tables to verify readability
3. **Check disabled states**: Ensure disabled buttons/inputs are still visible
4. **Verify focus rings**: Make sure focus states are visible in both themes
5. **Mobile testing**: Verify touch targets and readability on smaller screens

## Build Status

✅ Build passes successfully  
✅ No TypeScript errors  
✅ CSS compiles correctly  
✅ All form elements styled consistently
