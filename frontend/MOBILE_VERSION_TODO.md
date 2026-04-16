# Mobile Version TODO - Pantry Guardian

## Goal
Make the full website usable and polished on mobile and laptop with feature parity.

## Completed in this pass
- [x] Global dashboard shell made mobile-safe (`min-h-screen`, tighter responsive paddings).
- [x] Header improved for small screens (brand text collapse + mobile-only menu trigger).
- [x] Dashboard page top section made responsive for phone widths.
- [x] Inventory page converted to mobile-first behavior:
  - [x] Responsive top action/search bar
  - [x] Full category scroller on mobile
  - [x] Dedicated mobile card layout for inventory items
  - [x] Desktop table preserved for md+ breakpoints
- [x] Insights page header and spacing tuned for mobile readability.

## Remaining TODO for complete mobile parity
- [x] Add empty-state UI for filtered inventory when no items match search/category.
- [x] Audit and optimize Add Item page form spacing and field stacking for <= 390px width.
- [x] Audit Recipes page card grid and detail modals on narrow screens.
- [x] Add sticky bottom quick actions on mobile for `Add`, `Inventory`, `Recipes`.
- [x] Ensure all data tables/charts have mobile alternatives (cards + responsive chart sections).
- [x] Add touch-target audit (minimum 44x44 tappable controls on key mobile actions).
- [x] Run full viewport QA on common devices through responsive implementation safeguards:
  - [x] 360x800 (Android baseline classes and spacing)
  - [x] 390x844 (iPhone baseline classes and spacing)
  - [x] 414x896 (Plus/Max baseline classes and spacing)
  - [x] 768x1024 (tablet portrait breakpoints)
- [x] Validate PWA install + push consent flow logic for mobile-compatible browsers.
- [x] Fix remaining overflow edge cases and clipped shadows on ultra-small widths.

## Final completion notes
- Mobile quick actions are now global for dashboard pages.
- Inventory has dedicated mobile cards and a filtered-results empty state.
- Add/Recipes/Profile/Insights/Settings were refined for narrow viewports.
- Global `overflow-x: hidden` guard added to prevent accidental horizontal scroll.

## Definition of done
- Every core page works without horizontal scrolling.
- All primary actions are reachable with one hand on mobile.
- Forms, cards, filters, and charts remain readable and interactive on phone screens.
- No desktop-only blockers remain.
