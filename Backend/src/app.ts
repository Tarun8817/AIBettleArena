import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import runGraph from "./ai/graph.ai.js"
import { Battle } from "./models/battle.model.js"

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

// GET /api/battles - Fetch all battle sessions
app.get('/api/battles', async (req, res) => {
    try {
        const battles = await Battle.find().sort({ updatedAt: -1 });
        res.json(battles);
    } catch (error: any) {
        console.error("Error fetching battles:", error);
        res.status(500).json({ error: error.message || "Failed to fetch battles" });
    }
});

// POST /api/battles - Create an empty battle session
app.post('/api/battles', async (req, res) => {
    try {
        const battle = new Battle({
            title: "New Code Battle",
            messages: []
        });
        await battle.save();
        res.status(201).json(battle);
    } catch (error: any) {
        console.error("Error creating battle:", error);
        res.status(500).json({ error: error.message || "Failed to create battle" });
    }
});

// DELETE /api/battles/:id - Delete a battle session
app.delete('/api/battles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Battle.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting battle:", error);
        res.status(500).json({ error: error.message || "Failed to delete battle" });
    }
});

app.post('/api/solve', async (req, res) => {
    try {
        const { problem, battleId } = req.body;
        if (!problem) {
            res.status(400).json({ error: "Problem description is required" });
            return;
        }

        console.log(`[BATTLE] Solving: "${problem}"`);
        const result = await runGraph(problem);

        let battleDoc = null;
        if (battleId) {
            try {
                battleDoc = await Battle.findById(battleId);
            } catch (err) {
                console.warn(`Battle with id ${battleId} not found, creating a new session.`);
            }
        }

        const messageData = {
            problem,
            solution_1: result.solution_1 || 'No solution generated.',
            solution_2: result.solution_2 || 'No solution generated.',
            judge: result.judge || null
        };

        if (battleDoc) {
            battleDoc.messages.push(messageData);
            if (battleDoc.title === 'New Code Battle') {
                battleDoc.title = problem.length > 40 ? problem.substring(0, 37) + '...' : problem;
            }
            await battleDoc.save();
        } else {
            battleDoc = new Battle({
                title: problem.length > 40 ? problem.substring(0, 37) + '...' : problem,
                messages: [messageData]
            });
            await battleDoc.save();
        }

        res.json({
            ...result,
            battle: battleDoc
        });
    } catch (error: any) {
        console.error("Error in runGraph:", error);
        res.status(500).json({ error: error.message || "An error occurred while processing the request" });
    }
});

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve directory path to Backend public/dist files
const distPath = path.resolve(__dirname, "../public/dist")

// Serve static assets from Frontend dist folder
app.use(express.static(distPath))

// Support client-side single page routing (SPA) fallback to index.html
app.get('(.*)', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'))
})

export default app;