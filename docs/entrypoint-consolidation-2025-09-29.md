# Entrypoint Consolidation (2025-09-29)

## Canonical Entrypoints
- `src/main.jsx` remains the only client bootstrap and imports `./App-enterprise.jsx`.
- `src/App-enterprise.jsx` is the canonical application shell for the Clerk-protected experience.

## Retired Variants
- Removed legacy crowds: `src/App-comprehensive.jsx`, `src/App-multistage.jsx`, `src/main-clean.jsx`, and `src/main-final.jsx`.
- Updated `build-minimal.js` and `build-staged.js` to stop mutating `main.jsx` toward non-existent stage files and to rely on the enterprise entrypoint.

## Notes
- Any deployment pipeline calling the old staged build scripts will now receive the canonical build while retaining the same command surface.
- If alternative skins or phased rollouts are required later, implement them via feature flags or route-level lazy modules instead of swapping the root App file.
