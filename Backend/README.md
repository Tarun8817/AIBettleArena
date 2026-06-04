# ⚙️ AI Battle Arena - Backend

This is the Express backend server and LangGraph engine for the **AI Battle Arena**. It receives coding challenges, delegates generation to Mistral and Cohere in parallel, and coordinates Gemini's judgment as a structured output agent.

For full setup instructions, architecture breakdown, and environment variables, please refer to the main [Root README.md](../README.md).

---

## ⚡ Key Components

*   **`src/app.ts`**: The main Express application that sets up CORS, registers middlewares, and hosts the endpoints.
*   **`src/config/config.ts`**: Safely loads and typed-exports environment keys (`GOOGLE_API_KEY`, `MISTRAL_API_KEY`, `COHERE_API_KEY`).
*   **`src/ai/model.ai.ts`**: Configures Chat model adapters using LangChain integration packages (`@langchain/google`, `@langchain/mistralai`, `@langchain/cohere`).
*   **`src/ai/graph.ai.ts`**: Defines the state schema and compiles the LangGraph workflow structure. It leverages a structured evaluation schema powered by Zod.

---

## ⚡ Development Scripts

From the `Backend` directory, you can run:

### `npm run dev`
Launches the development server using `tsx watch` to monitor TS files for changes and automatically reload the API.

---

## 🛠️ API Routing

*   **`GET /`**: Healthy check route. Triggers a trial battle session for factorial.
*   **`POST /api/solve`**: Core endpoint. Expects `{ "problem": "string" }` in the request body. Runs the compiled LangGraph and returns the complete final state.
