# Flux Note

[![Convex](https://img.shields.io/badge/Backend-Convex-orange?style=for-the-badge)](https://convex.dev)
[![Vite](https://img.shields.io/badge/Frontend-Vite-646CFF?style=for-the-badge)](https://vitejs.dev)
[![React](https://img.shields.io/badge/Framework-React-61DAFB?style=for-the-badge)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Styling-Tailwind-38B2AC?style=for-the-badge)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-007ACC?style=for-the-badge)](https://www.typescriptlang.org/)

Flux Note is a collaborative markdown editor built for performance and reliability. It provides a real-time environment for teams and individuals to draft, organize, and share documents with zero latency.

---

## Features

- **Real-time Synchronization**: Collaborative editing powered by Convex, ensuring all changes are reflected across all clients instantly.
- **Presence Tracking**: Integrated presence indicators show active collaborators within each document.
- **Block-Based Editing System**: A structured editing experience based on the BlockNote engine, allowing for intuitive document organization.
- **Efficient Sharing**: Simple invite mechanisms to streamline collaboration workflows.
- **Optimized UI**: A clean, responsive interface constructed with Mantine UI and Tailwind CSS.
- **Native Markdown Support**: Full support for markdown syntax within a high-performance editor wrapper.

## Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **UI Architecture:** Mantine UI / Tailwind CSS
- **Editor Core:** BlockNote

### Backend
- **Data Engine:** Convex
- **Authentication:** Convex Auth
- **Persistence:** Convex Vector Database & Real-time storage

---

## Getting Started

Follow the instructions below to set up a local development environment.

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ercode254/FluxNote.git
   cd FluxNote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize Convex**
   ```bash
   npx convex dev
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *The application will be accessible at http://localhost:5173*

---

## Project Structure

```text
├── app/          # Next.js compatibility layer
├── convex/       # Backend functions and schema
├── src/          # React components and logic
│   ├── lib/      # Utility libraries
│   ├── App.tsx   # Application entry point
│   └── Editor.tsx # Primary editor component
├── public/       # Static assets and documentation images
└── tailwind.config.js # Global style definitions
```

## Contributing

Contributions are welcome. Please follow the standard fork-and-pull-request workflow.

1. Fork the Project
2. Create a Feature Branch (`git checkout -b feature/improvement`)
3. Commit Changes (`git commit -m 'Add improvement'`)
4. Push to the Branch (`git push origin feature/improvement`)
5. Open a Pull Request

## License

Distributed under the MIT License.

---

<p align="center">
  Developed by <a href="https://github.com/Ercode254">Ercode254</a>
</p>
