# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] - 2025-02-17

### Added
- Real-time search and filtering capabilities.
- JSON file import support alongside existing export functionality.
- Keyboard shortcuts (`N` for new task, `/` for search, `E` for export).
- Task counter badges on column headers.
- Modal dialog for task creation and editing with validation.

### Changed
- Upgraded UI styling with improved contrast and responsive layout.
- Refactored state management to ensure robust error boundaries and local storage fallback.

### Fixed
- Resolved edge case where empty columns dropped tasks incorrectly.
- Fixed layout overflow issues on smaller viewports.