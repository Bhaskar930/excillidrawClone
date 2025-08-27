
# ExceliDraw (Simplified Version)

A lightweight version of ExceliDraw — a collaborative canvas drawing app built with **React** and **WebSockets**.  
This project allows users to draw **rectangles, circles, diamonds, lines, arrows, and freehand (pencil)** shapes on a canvas. Undo/redo functionality is included.

---

## Features

- Draw shapes: `Rectangle`, `Circle`, `Diamond`, `Line`, `Arrow`
- Freehand drawing (`Pencil`)
- Undo and Redo
- Real-time collaboration via WebSocket
- Easy-to-use toolbar for selecting drawing tools

> **Note:** Infinite canvas scrolling and advanced features are planned for future versions.

---

## Tech Stack

- **Frontend:** React, TypeScript, HTML5 Canvas
- **Backend:** WebSocket server for real-time collaboration
- **State Management:** Local component state + class-based canvas handling

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd excelidraw
Install dependencies

bash
Copy code
npm install
# or
yarn
Start the development server

bash
Copy code
npm run dev
# or
yarn dev
git clone <your-repo-url>
cd excelidraw
