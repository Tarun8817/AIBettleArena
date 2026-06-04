import {
    StateGraph,
    StateSchema,
    START,
    END,
    type GraphNode,
} from "@langchain/langgraph";

import { HumanMessage } from "@langchain/core/messages";
import { createAgent, providerStrategy } from "langchain";
import z from "zod";

import {
    geminiModel,
    mistralAIModel,
    cohereModel,
} from "./model.ai.js";

/**
 * State Schema
 */
const state = new StateSchema({
    problem: z.string().default(""),

    solution_1: z.string().default(""),
    solution_2: z.string().default(""),

    judge: z.object({
        solution_1_score: z.number().default(0),
        solution_2_score: z.number().default(0),

        solution_1_reasoning: z.string().default(""),
        solution_2_reasoning: z.string().default(""),
    }),
});

/**
 * Solution Node
 */
const solutionNode: GraphNode<typeof state> = async (state) => {
    const [mistralResponse, cohereResponse] = await Promise.all([
        mistralAIModel.invoke(state.problem),
        cohereModel.invoke(state.problem),
    ]);

    const unwrapResponse = (response: unknown): string => {
        if (typeof response === "string") return response;
        if (response && typeof (response as any).text === "string") return (response as any).text;
        if (response && typeof (response as any).content === "string") return (response as any).content;
        return JSON.stringify(response);
    };

    return {
        solution_1: unwrapResponse(mistralResponse),
        solution_2: unwrapResponse(cohereResponse),
    };
};

/**
 * Judge Node
 */
const judgeNode: GraphNode<typeof state> = async (state) => {
    const { problem, solution_1, solution_2 } = state;

    const JudgeSchema = z.object({
        solution_1_score: z.number().min(0).max(10),
        solution_2_score: z.number().min(0).max(10),

        solution_1_reasoning: z.string(),
        solution_2_reasoning: z.string(),
    });

    const judge = createAgent({
        model: geminiModel,

        responseFormat: providerStrategy(JudgeSchema),

        systemPrompt: `
You are an expert AI judge.

Compare the two solutions.

Evaluate based on:
- correctness
- completeness
- clarity
- usefulness

Give each solution a score out of 10 and explain your reasoning.

Return only structured output.
`,
    });

    const judgeResponse = await judge.invoke({
        messages: [
            new HumanMessage(`
Problem:
${problem}

Solution 1:
${solution_1}

Solution 2:
${solution_2}

Evaluate both solutions.
`),
        ],
    });

    const result = judgeResponse.structuredResponse;

    if (!result) {
        throw new Error("Judge did not return structured output.");
    }

    return {
        judge: result,
    };
};

/**
 * Graph
 */
const graph = new StateGraph(state)
    .addNode("generateSolutions", solutionNode)
    .addNode("judgeSolutions", judgeNode)
    .addEdge(START, "generateSolutions")
    .addEdge("generateSolutions", "judgeSolutions")
    .addEdge("judgeSolutions", END);

/**
 * Compile Graph
 */
const app = graph.compile();

/**
 * Exported Function
 */
export default async function runGraph(problem: string) {
    const result = await app.invoke({
        problem,
    });

    return result;
}

