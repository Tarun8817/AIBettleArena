# 🖥️ AI Battle Arena - Frontend

This is the React client application for the **AI Battle Arena**. It is built on top of **React 19** and **Vite** and configured with **Tailwind CSS v4** to present a gorgeous, highly interactive futuristic dark interface.

For full setup instructions, architecture breakdown, and backend configurations, please check the main [Root README.md](../README.md).

---

## 🎨 Design System & Aesthetics

*   **Dark Glassmorphism**: Utilizes tailored HSL colors, frosted glass surfaces (`backdrop-filter: blur(16px)`), and thin semi-transparent borders for high-end polish.
*   **Vibrant Gradients**: Accent lines and brand logos showcase custom gradients ranging from deep purples and electric blues to warm sunset amber tones.
*   **Micro-interactions**: Incorporates hover scaling, smooth active transitions, copy confirmation prompts, and scrolling utilities.
*   **Heartbeat Monitor**: Integrates an active polling system that pings the Express server every 10 seconds to display a live green/red connection status indicator.

---

## ⚡ Development Scripts

From the `Frontend` directory, you can run:

### `npm run dev`
Launches the local Vite development server (usually at `http://localhost:5173`).

### `npm run build`
Compiles the React codebase into optimized static assets in the `/dist` directory for production deployment.

### `npm run preview`
Locally hosts the built production assets in a lightweight web server for verification.

### `npm run lint`
Runs ESLint rule validation across all files to enforce standard clean code practices.
