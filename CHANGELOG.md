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