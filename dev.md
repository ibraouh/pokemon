# Dev Notes

A walkthrough of every decision made building this app, written as if I'm being interviewed about it.

---

## Packages added

**`react-intersection-observer`** — The standard way to implement infinite scroll in React. Rather than attaching scroll event listeners (which fire constantly and require debouncing), IntersectionObserver is a browser-native API that fires a callback only when an element enters or leaves the viewport. I placed a zero-height sentinel `<div>` at the bottom of the card list and wired it to `useInView`. When it becomes visible, the next page is fetched. This approach has zero scroll jank and works well on mobile.

**`use-debounce`** — The search input is controlled, meaning every keystroke triggers a React state update. Without debouncing, every single character typed would fire a network request to the API. `useDebounce` creates a derived value that only updates after the user stops typing for 400ms, so the API is only hit once per "finished" word rather than once per character. 400ms feels instant to a user but eliminates most of the noise.

**`next-themes`** — Handles dark/light mode toggling in a Next.js App Router context. The hard part of theme toggling in SSR frameworks is the hydration mismatch: the server doesn't know the user's preferred theme, so if you render dark on the server and the user's stored preference is light, you get a flash. `next-themes` solves this by injecting a blocking script that reads `localStorage` before the first paint, applying the correct class before React hydrates. `suppressHydrationWarning` on `<html>` tells React to ignore the class attribute mismatch since `next-themes` manages it intentionally.

**`shadcn/ui` (Badge, Button, Input, Skeleton, Dialog, ToggleGroup)** — Rather than writing UI primitives from scratch, all interactive and display components come from shadcn. shadcn components are not a black-box library — they're copied directly into the codebase as source files you own and can customize freely.

- `Button` — used for the 18 type filter tags. The `outline` variant is already theme-aware (adapts to light/dark via CSS variables). The `xs` size fits the compact toolbar. For active type tags, the base variant styles are overridden with the type's Tailwind color class via `cn()`.
- `Input` — the search bar.
- `Badge` — type labels on cards and in the hover overlay.
- `Skeleton` — loading placeholder that matches the card's `aspect-[2/3]` ratio so there's no layout shift when real cards load in.
- `Dialog` — Radix UI's `Dialog` primitive (available directly from the already-installed `radix-ui` unified package, no extra dependency needed) wrapped in a thin shadcn-style component at `src/components/ui/dialog.tsx`. Handles focus trapping, `Escape` to close, and click-outside-to-close out of the box. The overlay uses `backdrop-blur-sm` for a frosted-glass feel.
- `ToggleGroup` — Radix UI's `ToggleGroup` primitive, also from the `radix-ui` unified package. Used for the three toolbar controls: Dark/Light, Small/Large, and Metric/Imperial. Preferred over individual toggle buttons because it makes both options visible at once — the user can see the current state and the alternative without having to infer it from a label. The active item uses `bg-primary text-primary-foreground` for a filled highlight that reads clearly in both dark and light mode.

---

## Architecture decisions

### Single component file for the card (`PokemonCard.tsx`)

Everything specific to a card — the type, the color map, the stat config, the skeleton — lives in one file. I could have split these into separate files but that would be premature abstraction for what is essentially one coherent UI unit. The `colors` map and `getTypeColor` function are exported because `PokemonGrid` needs `getTypeColor` for the type filter tags, which use the same color system.

### Keeping data fetching in `PokemonGrid`, not in a custom hook

A common pattern is to extract fetch logic into a `usePokemon()` hook. I didn't do that here because the fetch logic is tightly coupled to the component's state (page, query, selectedTypes all live together, reset together, and affect the same list). Pulling it into a hook would just be moving the same code sideways into another file without gaining anything. The component is not large enough to justify that indirection.

### Two `useEffect`s for fetching

There are two effects:

1. **Reset effect** — depends on `[debouncedQuery, selectedTypes]`. When either changes, it clears the pokemon list, resets the page to 1, and sets `hasNext` back to true. This is the "start over" signal.

2. **Fetch effect** — depends on `[debouncedQuery, page, selectedTypes]`. It fetches and either replaces the list (when `page === 1`) or appends to it (when `page > 1`).

The reason for two effects instead of one is to avoid a double-fetch problem. When the search query changes, both effects fire in the same React flush. The reset effect clears state. The fetch effect runs with the new query and page=1, replacing the list. Because React batches these updates, `setPage(1)` in the reset effect is a no-op when the page is already 1 — it doesn't trigger an extra fetch cycle. This pattern is deliberate: the `page === 1` branch in the fetch effect handles the "we just reset" case cleanly.

I also use an `AbortController`-style `cancelled` flag in the fetch effect's cleanup. If a component unmounts or dependencies change while a fetch is in-flight, the stale result is discarded rather than written into state.

### CSS Grid instead of CSS Columns for the masonry-style layout

I initially used CSS `columns` because it produces a natural masonry layout. However, `columns` distributes items top-to-bottom within each column, which means when new items are appended via infinite scroll, the browser re-balances all columns — existing cards visibly shuffle around. This is a fundamental property of CSS columns, not a bug.

CSS Grid places items in DOM order left-to-right, row by row. New items always appear at the end. No reshuffling. Since all cards have a fixed `aspect-[2/3]` ratio, every card is the same height and a regular grid works perfectly.

### Stat bars scaled to 255

The maximum possible stat value in the dataset is 255, which is also the canonical maximum in the Pokemon game series. Each bar is `(value / 255) * 100`% wide. I use an inline `style` for this because Tailwind cannot generate arbitrary percentage widths at runtime — you can't do `w-[${n}%]` with a dynamic value and expect it to work, since Tailwind's JIT scanner reads static strings at build time.

### Metric / Imperial unit toggle

Height and weight are displayed in both the hover overlay and the detail modal. A `ToggleGroup` in the toolbar switches between metric (default) and imperial. The `imperial` boolean is owned by `PokemonGrid` and passed down as a prop to each `PokemonCard` — no context or global state needed since the grid already renders all cards and controls re-renders naturally when the prop changes.

Conversion is done at render time via two pure helper functions in `PokemonCard.tsx`:

- `formatHeight(meters, imperial)` — metric: `1.7m`; imperial: converts to total inches (`meters × 39.3701`), floors to feet, rounds the remainder to inches, formats as `5'7"`.
- `formatWeight(kg, imperial)` — metric: `68.0kg`; imperial: `kg × 2.20462` formatted as `149.9lbs`.

The data is always stored in metric (the canonical source). Imperial values are derived on the fly rather than stored separately so there's a single source of truth.

Dark is placed left of Light in the toggle, and Metric left of Imperial, because defaults go on the left — users read left-to-right and the leftmost option reads as "normal". Putting the default on the right would feel inverted.

### Click-to-modal for full detail view

Clicking a card opens a `Dialog` modal with the full photo on one side and all stats on the other. This complements the hover overlay rather than replacing it — hover is still the low-friction way to preview stats while browsing, and the click modal is for when you actually want to read everything at full size.

The modal uses a side-by-side layout on desktop (`sm:flex-row`) and a stacked layout on mobile (`flex-col`), with the photo on top on mobile. On mobile the modal is constrained to `w-[calc(100%-2rem)]` so it always has 1rem of margin on each side — without this it would be flush to the screen edges.

The image uses `object-contain` (not `object-cover`) in the modal so the full photo is always visible, not cropped. A `bg-muted` background fills any letterbox space.

### "Expand from card" animation via `transform-origin`

The modal appears to grow out of the card that was clicked. This is done purely with CSS — no animation library needed.

When a card is clicked, its center position in the viewport is computed: `cx = rect.left + rect.width / 2`, `cy = rect.top + rect.height / 2`. The offset from the viewport center is then `(cx - vw/2, cy - vh/2)`. This is passed as a CSS `transform-origin` on the modal content:

```
transform-origin: calc(50% + {offsetX}px) calc(50% + {offsetY}px)
```

Because the modal is centered at `50vw / 50vh`, adding that offset to `50%` maps the scale origin back to the card's position. The `zoom-in-75` animation from `tw-animate-css` then scales from 0.75 → 1.0 using that origin, making the modal visually expand from the card outward.

### Modal image uses `currentSrc`, not the raw `imageUrl`

The image data uses `loremflickr.com` URLs. Loremflickr selects photos based on the requested dimensions — even with a `?lock=` seed, requesting the same URL at a different size can return a different photo because it re-queries Flickr with new dimensions. Next.js Image optimization generates a srcset and requests different widths for the card vs the modal, which caused the modal to show a completely different photo.

The fix: on click, read `imgRef.current?.currentSrc` from the card's `<img>` element. This is the exact URL the browser already resolved and cached — the `/_next/image?url=...&w=256` entry that's sitting in the browser cache. The modal renders a plain `<img>` with that same URL, so it's guaranteed to show the same photo with no extra network request.

### Hover overlay instead of click-to-expand

The design spec showed expandable cards. I implemented hover overlays instead because it's a better desktop experience — hover is lower friction than click, and the card grid is primarily a browsing interface, not a selection one. The overlay uses a CSS gradient (`from-black/85 via-black/50 to-transparent`) so the image shows through at the top of the card while the bottom is opaque enough for legible text. In light mode the gradient is inverted to white so it doesn't look like a dark intrusion on a light page.

The name bar in the default state slides out with `translate-y-full` rather than fading with `opacity-0`. Fading to opacity 0 leaves the element rendering at the bottom of the card, which caused a 1px rendering artifact — a thin line visible at the card edge. Sliding it fully off-screen via `overflow-hidden` on the parent eliminates this completely.

### Type filter uses AND logic

When multiple type tags are selected, the filter requires a Pokemon to have all selected types, not just one. This is more useful for exploration — if you want to find dual-type Pokemon (e.g., Fire/Flying), selecting both types narrows to exactly those. OR logic would give you every Fire Pokemon plus every Flying Pokemon, which is much less specific. The API handles this with `selectedTypes.every(st => pokemon.types.some(t => t === st))`.

### Type filter tags sorted with active first

When a type is selected it moves to the front of the tag row. This serves two purposes: it confirms the selection is registered (visual feedback), and it groups all active filters together so the user can see at a glance what's active without scanning the whole row.

### `next-themes` hydration fix — `mounted` state

`resolvedTheme` from `useTheme()` is `undefined` on the server because there's no way to know the user's preference before the page loads. If I rendered the theme toggle button on the server with `isDark = undefined === 'dark'` (i.e., `false`), the server would output "Dark" with a Moon icon. But the client would immediately re-render it as "Light" with a Sun icon (since dark is the default). React would throw a hydration mismatch error. The fix is a `mounted` state — the theme toggle button is simply not rendered until after hydration, when `resolvedTheme` is known. The brief absence of the button on first paint is invisible to the user.

---

## Layout decisions

### Search and tags capped at `max-w-4xl`

On very wide monitors, a full-width search bar and tag row look awkward and the input becomes too long to be comfortable. Capping at `max-w-4xl` (896px) with `mx-auto` keeps the controls in a comfortable reading width while the card grid itself can span the full viewport, which is appropriate for a browsing grid.

### Buttons above the search bar

Originally the layout/theme buttons were absolutely positioned to the left of a centered search bar. This was awkward — the search bar wasn't truly centered (it was offset by the invisible button space), and on narrow screens the buttons would overlap the input. Moving the buttons to a row above the search bar gives both rows the same natural full width within the `max-w-4xl` container, making the search bar genuinely full-width and the layout visually balanced.

### One column on small screens

The grid defaults to `grid-cols-1` on mobile (below 640px `sm` breakpoint). At very small screen widths, two columns makes each card too narrow to be readable — the image gets cramped and the hover overlay text becomes illegible. One card per row on mobile is the correct call for this type of content.

### Small mode as default (more columns, tighter grid)

The "Small" mode shows 6 columns on large screens vs 4 in "Large" mode. Small is the default because it gives a better browsing experience — you can see more creatures at once, which is the primary purpose of this app. Large mode is useful when you want to appreciate individual images more closely or read the overlay content more comfortably.

---

## Styling decisions

### Mono font for stats, numbers, and type tags

Numbers and short labels (HP, ATK, DEF) are displayed in `font-mono` (Geist Mono). Monospaced fonts are designed for data — the fixed character width makes numeric columns align naturally and gives stat values a technical, data-readout feel appropriate for a creature database. Type tags also use mono because they're categorical identifiers (more like codes than prose), and the consistent character spacing makes the pill badges feel crisper.

### `rounded-md` instead of `rounded-xl` on cards

The original `rounded-xl` (12px border radius) made cards feel soft and app-like. Reducing to `rounded-md` (6px) gives the grid a more editorial, grid-magazine feel — less "mobile app", more "data explorer". It's a subtle shift but it makes the grid feel more intentional.

### Dark mode as default

The design spec was dark-first (black background, dark cards). Dark mode is also better for image-heavy interfaces — images pop more against a dark background, and there's less visual competition from the UI chrome. The theme toggle lets users switch to light if they prefer, but dark is the right starting point for this content type.

### Light mode overlay using white gradient

In light mode, the card overlay changes from `from-black/85` to `from-white/90`. This was necessary because a dark overlay on a light-background page looks like a UI error — as if the dark mode partially leaked in. The white gradient blends with the light page context and still provides enough contrast for the dark text (`text-neutral-900`) rendered on top of it.
