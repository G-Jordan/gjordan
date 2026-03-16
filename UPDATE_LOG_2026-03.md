# G73 Update Log — 2026-03

This file consolidates the earlier patch notes, phase notes, and the latest Phase 9 work into one place.

## CHANGELOG.md

# Changelog

## [Unreleased]
- (placeholder)

## 2025-12-28
### Fixed
- Playlist selection bug where the last two tracks could desync row highlights/“bars” visualizer and playback controls.
- Row play/pause reliability for final tracks, including icon refresh and active-row state.
- Visualizer wiring stability with external analyser attachment + late analyser handoff events.

### Added
- Real analyser-driven beat glow for the Visualizer modal button (`vz-beat-glow.js`) synced to low-frequency energy (kick region).
- Organizer + list theme sync improvements and more robust UI injection/mount behavior.

### Improved
- Mobile reliability for duration loading via sequential metadata probing.
- Marquee measurement + list rebuild behavior after playlist reorder events.

## PATCH_NOTES_2026-03.md

# G73 stabilization patch

This patch focuses on low-risk fixes that improve stability without changing the product direction.

## Applied
- Added managed unsubscribe handling for per-song Firebase stats listeners.
- Prevented duplicate footer metrics boot when both metrics modules are loaded.
- Added `css/g73-scope.css` compatibility shim so the player page no longer references a missing stylesheet.
- Added safe layout overrides in `css/main.css` to preserve tablet/desktop responsiveness.
- Fixed `metrics-footer.js` loading as a module in pages that include it.

## Recommended next phase
- Consolidate the theme system to one storage key/source of truth.
- Reduce homepage boot complexity and merge numbered inline-logic files.
- Consolidate footer metrics into one module permanently.
- Add linting and a small smoke-test checklist.

## PHASE2_NOTES_2026-03.md

# Phase 2 stabilization notes — 2026-03-15

This pass focused on safe, low-risk refactors that reduce duplication and make future feature work safer without changing the public behavior of the site.

## Applied

### 1) Consolidated footer metrics boot logic
Created a shared module:
- `js/firebase/footer-metrics-core.js`

Updated wrappers:
- `js/metrics-footer.js`
- `js/firebase/firebase-metrics-lite.js`

Result:
- one source of truth for visitor/profile counts
- duplicate init removed as an architectural concern
- legacy imports still keep working

### 2) Removed duplicate metrics script tags
Pages updated:
- `index.html`
- `scripts/index.html`

Result:
- cleaner boot path
- fewer duplicate module fetches
- lower risk of future drift

### 3) Added a theme storage bridge
Created:
- `js/theme/theme-bridge.js`

Updated:
- `js/theme/theme-init.js`
- `js/theme/theme-save.js`
- `js/theme/theme-sync.js`
- `js/main.js`
- `index.html`
- `player/index.html`
- `scripts/index.html`

Result:
- `themeSettings` and `siteThemeV1` now stay aligned
- old inline binders continue to work
- newer theme UI keeps working
- feature work can target one normalized theme shape

## Intentionally deferred

- no destructive rewrite of inline page binders
- no conversion to a full application framework
- no Firebase schema changes
- no player engine rewrite
- no playlist DOM rewrite

## Recommended next phase

### Phase 3
- centralize page boot sequencing
- reduce `core-inline-logic-*` fragmentation on the homepage
- create a single shared theme binder used by all pages
- add a lightweight repo validation script for missing local assets/references

## PHASE3_NOTES_2026-03.md

# Phase 3 stabilization notes — 2026-03-15

This pass focused on homepage boot cleanup, safer shared theming, and repo validation.

## Applied

### 1) Consolidated homepage boot fragments
Created:
- `js/index/index-boot.js`

This bundles the small homepage-only boot fragments that were previously loaded as many separate files, including:
- analytics boot
- auth modal theme sync
- EQ mode toggle
- navbar height sync
- visualizer orb boot
- volume knob boot
- EQ button animator
- organizer list theme sync
- site theme modal boot
- scroll state helper
- GA helper events
- virtual page view tracking
- like/dislike/download analytics wrappers
- visualizer safety boot

Result:
- homepage script-tag sprawl reduced
- boot order is easier to reason about
- less fragmentation around `core-inline-logic-*`
- lower risk of accidental duplicate homepage init

### 2) Added shared theme binder
Created:
- `js/theme/shared-theme-binder.js`

Updated:
- `index.html`
- `player/index.html`
- `scripts/index.html`
- `js/theme/theme-bridge.js`

Result:
- app-level theme vars now normalize from one shared helper
- legacy storage + live CSS vars stay aligned more safely
- theme saves now emit a shared event (`theme:bridge-saved`)
- page-specific binders can continue to exist without losing a common base layer

### 3) Added repo reference validator
Created:
- `scripts/validate-references.mjs`

Result:
- quick check for missing local HTML/CSS references
- supports `<base href="/">`
- useful before deploys/refactors

### 4) Fixed local reference issues discovered during validation
Updated:
- `scripts/index.html` (added `<base href="/">`)
- `uc/index.html` (rooted logo path)
- `admin-uploader/public/uploader.html` (local asset paths)

Result:
- validator now passes cleanly
- fewer hidden routing/path issues in subdirectory pages

## Measurable homepage change

Homepage external script includes were reduced from roughly **48** to **34** while preserving behavior.

## Intentionally deferred

- no conversion to a bundler/framework
- no major rewrite of inline page-specific popup logic
- no deep player engine refactor
- no theme preset system rewrite
- no migration away from global `window` APIs yet

## Recommended next phase

### Phase 4
- player state cleanup (`window.*` dependency reduction)
- modularize analytics wrappers away from homepage boot
- split shared UI boot from page-specific feature boot
- add a deploy smoke checklist and optional lint config

## PHASE4_NOTES_2026-03.md

# Phase 4 Notes — Favorites System + Player State Cleanup

## Added
- `js/player/favorites-system.js`
  - localStorage-backed favorite songs system
  - main player heart button injected into reaction controls
  - events: `favorites:changed`, `favorites:viewchanged`
- playlist favorites support in `js/player/organizer-adapter.js`
  - per-song heart button beside play/pause control
  - All Songs / Favorites tabs
  - separate favorites-only scroll view
  - empty-state messaging when no favorites exist

## Updated
- `index.html`
  - loads favorites system before player logic
- `css/g73-fixes.css`
  - favorites tabs, favorite playlist button, empty-state styles
- `css/main.css`
  - active style for main player favorite button

## Storage
- favorites ids: `g73:favorites:v1`
- current playlist view: `g73:favorites:view:v1`

## Notes
- favorites are stored per browser/device via localStorage
- this phase avoids risky backend schema changes
- playlist playback still uses the canonical `window.allMusic` order under the hood

## PHASE5_NOTES_2026-03.md

# Phase 5 Notes (2026-03)

## Fixed
- Favorites tab selection/active-state mismatch by normalizing playlist row indexing to source indices.
- Main heart icon now uses themed gradient styling on initial load instead of appearing black.
- Visualizer editor and theme selector dialogs now center on landscape tablets instead of forcing bottom-sheet layout.

## Added
- Playlist filter/search field that works in both All Songs and Favorites views.
- Better empty states for filtered results and favorites.

## Stability
- `player-core` now prioritizes `data-source-index` for active-row detection, making filtered/favorites views behave like the main playlist.

## PHASE6_NOTES_2026-03.md

# Phase 6 Notes — 2026-03

## Fixed
- Stabilized theme modal centering by using viewport-safe flex centering instead of left/top translate positioning.
- Stabilized visualizer editor centering with a dedicated fullscreen overlay root and reliable reset-on-open behavior.
- Landscape tablets now use centered dialog behavior for the visualizer editor.

## Added
- Expanded Theme Studio controls:
  - surface opacity
  - glow intensity
  - corner radius scale
  - spacing scale
  - font scale
  - texture strength
  - background mode (Aurora / Midnight / Stage)
- Service worker registration for same-origin static asset caching.
- `sw.js` for lightweight static caching.
- Additional browser-wide metadata and preconnect/preload hints on major pages.

## Simplified
- Removed unused `css/theme-popup.css`.
- Removed unused `js/index/core-inline-logic-017.js`.
- Centralized more theme responsibility into `js/index/index-boot.js` and shared theme bridge/binder logic.

## Notes
- This is still a stabilization-focused pass, not a full framework rewrite.
- The controls theme plugin remains separate to avoid breaking player controls styling.

## PHASE7_NOTES_2026-03.md

# Phase 7 Notes (2026-03)

## Fixes
- tightened and centered Theme Studio overlay for landscape tablets and large screens
- tightened and centered Visualizer Editor overlay for landscape tablets and large screens
- added extra spacing between playlist header and tabs/search/actions
- reduced Theme Studio modal width to avoid off-screen clipping

## New features
- added Theme Studio action buttons: Randomize, Reset, Export, Import
- added Recent tab to the playlist using local storage
- added playlist quick actions: Play Favorites, Shuffle View
- added broader browser metadata on main pages for PWA/browser polish
- added stronger sitewide background mode handling in CSS

## Stability
- kept existing player, favorites, playlist, theme, and Firebase behavior intact
- no destructive rewrites to core player boot or Firebase schema

## PHASE8_NOTES_2026-03.md

# Phase 8 Notes

This pass focused on structure cleanup, performance, SEO, and stronger sitewide theming.

## Added
- `js/site-core.js` shared boot helper for nav spacing, menu safety, image decoding/lazy hints, and deferred section rendering
- richer Theme Studio controls: glass blur, border strength, control scale
- `browserconfig.xml` and `humans.txt`
- expanded PWA manifest shortcuts
- upgraded service worker caching strategy

## Simplified
- removed `js/menu-init.js`
- removed unused `css/layout-fix.css`
- removed unused `css/nav-fixes.css`

## SEO / Browser polish
- added broader application metadata and image dimensions/alts on key pages
- improved manifest metadata and shortcuts

## Performance
- shared lazy-loading/decoding hints for images
- content-visibility on heavier below-fold sections
- stale-while-revalidate static caching for faster repeat visits

## PHASE9_UPDATE_2026-03.md

# Phase 9 Update

## Visualizer Editor overhaul
- scene presets now apply as full exact presets instead of partially patching whatever settings were already active
- visualizer scene cards now show richer previews, mode badges, and descriptions
- visualizer scene application can also sync the website theme so the player look and site chrome move together
- import/export/share payloads now carry both visualizer settings and linked site theme data
- added a one-tap action to align visualizer colors with the current site theme

## Theme system improvements
- sitewide theme controls now visibly affect cards, controls, playlist rows, buttons, modals, spacing, glow, and blur much more broadly
- spacing, border strength, glow intensity, surface opacity, font scale, and control scale now have stronger visual impact across the site

## Structure / logging
- consolidated previous patch/phase notes into one `UPDATE_LOG_2026-03.md`
- removed the scattered phase note files in favor of one rolling update log


## Phase 9.1 Stabilization Pass

- fixed theme controls that were not visibly affecting the site by replacing fragile `color-mix()` math with derived CSS percentage variables
- reduced theme rebroadcast churn in the shared binder to avoid style-loop glitches
- added exact-scene application hooks to the visualizer so scene changes reset performance/dynamics state cleanly
- upgraded visualizer scene cards with static bar previews that better reflect the selected look
- made footer visualizer preset saves carry linked site theme data, matching import/export behavior
- normalized preset loading so legacy presets still work but now apply through the exact-scene path


## Phase 10 — lightweight visualizer rebuild
- removed the heavy multi-panel visualizer editor and replaced it with a lightweight Visualizer Studio
- presets now apply as full snapshots through `visualizerAPI.applySceneExact()`
- added direct custom color support (`color1` / `color2`) to the visualizer engine for better visual match
- added run-state gating so the visualizer sleeps when audio is paused and no editor overlay is open
- removed duplicate reaction-module dynamic import from `js/main.js`
- hardened organizer initial render so SPCK/Acode preview does not log a noisy reference error
- made song view increment gracefully warn on permission-denied without looking like a hard app failure

## Phase 10.1 — Visualizer Studio fit-and-presets pass
- rebuilt Visualizer Studio layout to fit better on tablets and landscape preview panes
- changed preset area to its own scrollable section so the whole editor stays usable
- expanded quick presets from 6 to 33
- kept Media Session / lockscreen notification player integration intact

Phase 11 – Visualizer Engine Rebuild
• new GPU-friendly visualizer engine
• unlimited bar slider
• mirror + mirror-invert modes
• navigation cleanup removing Videos link
• full-width layout containers

Phase 12 – Visualizer Pro Foundation
• preset style system
• beat pulse glow engine
• scalable architecture for future WebGL visualizer


## Phase 11.1 – Layout + Visualizer Studio Fixes
- removed the remaining narrow-width footer/home content caps so the info panel and quick links stretch much closer to player width on tablets and desktop
- rebuilt Visualizer Studio into a vertical stacked layout so presets fill the top section and controls live below without the giant empty left panel
- expanded preset visibility with a taller preset scroller and responsive one-column controls on smaller screens
- presets no longer lock bar counts; bar density stays user-controlled from the slider
- converted shipped presets to non-mirrored defaults and added a Mirror Inverted mode option for manual use
- improved scene application so missing preset values preserve the current visualizer bar count and other live settings


Phase 11.2 – Final layout + visualizer stability fixes
- Rebuilt Visualizer Studio into a fully vertical flow with a larger preset scroller and no dead empty control space.
- Removed preset bar-count locking; density slider now controls bar count directly up to 160.
- Removed performance-driven bar reduction from the visualizer engine.
- Added stable Firebase footer metric boot retries and cached fallbacks so first-load values populate more reliably.
- Expanded footer/info sections to full width and restored a complete bordered info panel like the main player.
- Disabled content-visibility deferral on key info/footer sections to avoid blank first-render data.


## Phase 11.3
- fixed Visualizer Studio slider dragging on touch devices by allowing horizontal range interaction again
- raised Visualizer Studio FPS cap control to 120 FPS
- removed silent density downsampling so chosen bar density is honored
- centered footer/info sections and forced full-width bordered layout to match the player shell
- added retries and visibility-refresh for footer Firebase metrics so first-load values populate more reliably


Phase 11.4 – Footer + metrics + visualizer stabilization

- Fixed a syntax error in firebase-stats footer totals boot that could stop totals from populating.
- Added safer cached/zero fallbacks for footer totals on first load and permission failures.
- Centered and widened the footer/info shell to match the player width more closely.
- Widened the stats rail and aligned key player rows to the same shell width.
- Raised visualizer density max to 256 and removed passive input listeners from editor sliders for better touch dragging.
- Adjusted canvas bar width logic so very high densities remain renderable instead of breaking the visualizer.
- Left renderer on 2D canvas in this build; WebGL was not swapped in here.

## Phase 11.5 – WebGL visualizer + footer alignment rebuild
- Replaced the old 2D-only background visualizer loop with a WebGL-first renderer and a 2D fallback for unsupported environments.
- Added beat-reactive glow pulses and a lightweight particle spectrum layer to the new visualizer renderer.
- Preserved unlimited density control from the editor without restoring the old device downsampling layer.
- Raised density ceiling to 512 in Visualizer Studio and updated the editor copy to reflect the WebGL renderer.
- Applied a stronger footer/info centering reset so the bordered info shell aligns with the player shell instead of drifting right.
- Seeded total plays/downloads with immediate zero fallbacks so first-time visitors do not see blank totals while Firebase boots.


Phase 11.6 – stability and footer alignment hotfix
- Fixed visualizer boot guard so WebGL/2D setup no longer crashes when the canvas is not ready yet.
- Added firebase-ready event dispatch and longer wait paths so footer metrics and fans/haters boot more reliably in local preview.
- Reduced repeated stats warnings when no song is active yet.
- Reworked footer/branding layout rules to center and fill the available shell width more consistently.


Phase 11.7c – Preview-safe visualizer and footer centering
- Replaced unstable visualizer boot with a preview-safe renderer path that reliably draws bars in localhost/Acode/SPCK environments.
- Kept the visualizer API surface compatible with the editor and equalizer.
- Added stronger footer/info centering overrides to force equal left/right gutters under the player shell.
