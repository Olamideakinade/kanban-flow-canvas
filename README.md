# Kanban Flow Canvas

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-Play_on_GitHub_Pages-2ea44f?style=for-the-badge)](https://olamideakinade.github.io/kanban-flow-canvas/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Olamideakinade/kanban-flow-canvas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

![Project Snapshot](preview.svg)

> 🚀 **Live Demo Available:** Test and play this project live right now: **[https://olamideakinade.github.io/kanban-flow-canvas/](https://olamideakinade.github.io/kanban-flow-canvas/)**

Kanban Flow Canvas is a lightweight, zero-dependency project management workspace designed for speed and local data sovereignty. It uses standard DOM APIs and HTML5 Canvas rendering for performance-critical swimlanes, storing state locally via `localStorage`.

## Key Capabilities

- **Zero-Dependency Runtime**: Written in vanilla JavaScript with no external framework overhead or heavy build chains.
- **Local Persistence**: Automatic state serialization to `localStorage` with JSON export/import utilities for backup.
- **Keyboard Driven**: Full keyboard navigation shortcuts for rapid task creation, movement, and status updates.
- **Adaptive Layout**: Responsive grid layout adapting cleanly from desktop viewports down to tablet displays.

## Quickstart

Clone the repository and serve the root directory using any standard static file server:

```bash
git clone https://github.com/Olamideakinade/kanban-flow-canvas.git
cd kanban-flow-canvas
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

## Architecture & Design

- `index.html`: Semantic DOM structure defining the application shell, toolbar, and board layout.
- `style.css`: Clean, professional interface styling utilizing a restrained color palette, CSS variables, and native system typography.
- `app.js`: State machine, event listeners, drag-and-drop controller, and persistence layer.
- `.gitignore`: Excludes local development artifacts and OS-specific metadata files.

## License

MIT