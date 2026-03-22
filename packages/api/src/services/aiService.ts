import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getPool } from "../core/dbPool";
import { ResponseGenerator } from "../core/responseGenerator";

export class AIService extends ResponseGenerator {
  private model: ReturnType<ReturnType<typeof createOpenAI>>;
  private maxSteps: number;

  constructor(
    apiKey: string,
    modelName: string,
    maxSteps: number = 8,
    baseURL?: string
  ) {
    super();
    const provider = createOpenAI({
      apiKey,
      baseURL,
    });
    this.model = provider(modelName);
    this.maxSteps = maxSteps;
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!prompt?.trim()) throw new Error("Prompt empty");

    const pool = getPool("assistant");

    const result = await generateText({
      model: this.model,
      prompt,
      tools: {
        query: tool({
          description:
            "Execute a SQL query against the database. Use for SELECT, INSERT, UPDATE, DELETE operations based on your permissions.",
          parameters: z.object({
            sql: z.string().describe("The SQL query to execute"),
            params: z
              .array(z.any())
              .optional()
              .describe("Optional parameterized values for the query"),
          }),
          execute: async ({ sql, params }) => {
            try {
              const res = await pool.query(sql, params);
              return {
                success: true,
                rowCount: res.rowCount,
                rows: res.rows,
              };
            } catch (error) {
              const err = error as Error;
              return {
                success: false,
                error: err.message,
              };
            }
          },
        }),
      },
      maxSteps: this.maxSteps,
    });

    return result.text;
  }
}
