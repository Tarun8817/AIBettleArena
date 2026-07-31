import express from "express"
import runGraph from "./ai/graph.ai.js"
const app = express()

// Enable JSON body parsing
app.use(express.json())

// Request Logging Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app.get('/', (req, res) => {
    res.json({ status: "ok" });
});

app.post('/api/solve', async (req, res) => {
    try {
        const { problem } = req.body;
        if (!problem) {
            res.status(400).json({ error: "Problem description is required" });
            return;
        }
        const result = await runGraph(problem);
        res.json(result);
    } catch (error: any) {
        console.error("Error in runGraph:", error);
        res.status(500).json({ error: error.message || "An error occurred while processing the request" });
    }
});

export default app;