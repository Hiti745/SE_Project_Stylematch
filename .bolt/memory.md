# Project memory

## Product intent & audience

- **StyleMatch** is a fashion/styling app presenting a clothing catalog with product details and similar-item recommendations.
- Audience inferred as Indian market — pricing shown in Indian rupees (₹) with Indian number-grouping formatting.

## Brand personality & voice

- Editorial, fashion-forward presentation; imagery is high-quality editorial photography.

## Visual design & UX direction

- Card-based catalog layout with real editorial photos and readable overlays.
- Preserves visual styling and interactions across changes (overlay system maintained when swapping image sources).
- Stable, direct Unsplash editorial image URLs used as image source (photo service unavailable in environment).

## Decisions, constraints & rationale

- Stack: Vite + React (JSX), Tailwind CSS, Lucide React icons, `@/` path alias to `src/`.
- No extra UI theme/icon packages installed beyond template defaults.
- Currency: Indian rupee (₹) applied consistently across catalog cards, product detail views, and similar-item recommendations.
- Number formatting uses Indian grouping convention (e.g., lakh/crore style).
- Build and type-check verified after updates.

## Open questions & assumptions

- Assumes Unsplash URLs remain stable; no local image assets or upload flow yet.
- Currency localization is rupee-only; multi-currency support not confirmed.
- No explicit product data source identified — images and prices may be hardcoded or static for now.