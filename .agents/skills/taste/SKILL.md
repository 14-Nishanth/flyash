---
name: taste
description: >-
  High-craft UI/UX design taste, visual polish, and responsive frontend engineering
  guidelines. Activate this skill whenever creating, editing, styling, or reviewing
  UI components, forms, tables, dashboards, or page layouts.
---

# UI/UX Design Taste & Frontend Craft (`taste`)

Follow these design and engineering standards whenever building or modifying user interfaces in this workspace.

---

## 1. Viewport, Scrolling & Multi-Device Ergonomics

1. **Locked 100% Display Shell (Zero Zoom Required)**:
   - Never design layouts that require the user to pinch-zoom in or zoom out on Mobile or Windows Desktop.
   - Keep the outer application shell fixed to the screen (`position: fixed; inset: 0; overflow: hidden`) and handle scrolling strictly inside `.app-scroll-container`.
2. **Fixed Display During Data Entry**:
   - Every `<input>`, `<select>`, and `<textarea>` must maintain at least `16px` font size on touch/mobile viewports (`@media (hover: none), (pointer: coarse), (max-width: 1024px)`) so mobile browsers never auto-zoom or shift the screen when typing.
   - Disable scroll-wheel value changes on `<input type="number">`.
3. **Left-Side Compact Navigation**:
   - Keep all primary module navigation in the compact Left-Side Small Button Bar (`w-14` on mobile, `w-36` on desktop) so 85%+ of horizontal screen width remains dedicated to data and forms.

---

## 2. Visual Hierarchy, Typography & Density

1. **Typography Pairing**:
   - **UI & Headings**: `Plus Jakarta Sans` — use clear weight contrast (`font-semibold`, `font-bold`, `font-extrabold`) and tight tracking (`tracking-tight`) on headings.
   - **Numbers, Currency, Dates, Stock & IDs**: Always apply `font-mono` (`JetBrains Mono`) so figures align vertically in tables and cards.
2. **High-Density Industrial ERP Layout**:
   - Prefer compact, scannable cards (`p-3` to `p-5`, `rounded-xl` or `rounded-2xl`) over bloated padding.
   - Group related form inputs in responsive grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`) so forms require minimal vertical scrolling.

---

## 3. Semantic Color & Accounting Conventions

Always use intentional, high-contrast semantic colors in both Light and Dark modes:

| Meaning / State | Color Token | Usage |
| :--- | :--- | :--- |
| **Primary Brand / Active** | `amber-500` / `amber-600` | Active navigation button, primary CTAs, highlights |
| **Credit (+) / Receivable / Paid** | `emerald-500` / `emerald-600` | Party needs to pay us (`Credit`), settled bills, positive stock |
| **Debit (-) / Payable / Due** | `rose-500` / `rose-600` | We need to pay party (`Debit`), `Remaining Amount to Pay`, alerts |
| **Neutral Surface (Dark)** | `slate-950` / `slate-900` | Page background (`slate-950`), elevated cards (`slate-900`) with `border-slate-800` |
| **Neutral Surface (Light)** | `slate-50` / `white` | Page background (`slate-50`), elevated cards (`white`) with `border-slate-200` |

---

## 4. Interactive Polish & Validation Checklist

Before completing any UI task, verify:
- [ ] All interactive buttons have tactile feedback (`active:scale-95`, `transition`, clear hover states).
- [ ] Wide tables are wrapped in `.overflow-x-auto` with `whitespace-nowrap` on numeric cells so they never break the page width.
- [ ] Empty states provide a clear, helpful message rather than blank space.
- [ ] `npm run build` succeeds with zero TypeScript or CSS errors.
