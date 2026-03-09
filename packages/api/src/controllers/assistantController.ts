import { ResponseGenerator } from "../core/responseGenerator";
import type { GenericCrudController } from "../core/crudController";
import type { BaseEntity } from "../core/repository";

export class AssistantController {
  private readonly responseGenerator: ResponseGenerator;
  private readonly controllers: GenericCrudController<BaseEntity>[];

  constructor(
    responseGenerator: ResponseGenerator,
    controllers: GenericCrudController<BaseEntity>[]
  ) {
    this.responseGenerator = responseGenerator;
    this.controllers = controllers;
  }

  private buildPrompt(userMessage: string): string {
    const schema = this.controllers
      .map((c) => `- ${c.schemaText()}`)
      .join('\n');

    return `
Eres un asistente de base de datos PostgreSQL. Tienes acceso completo a la base de datos.

HERRAMIENTAS DISPONIBLES:
- query: Ejecutar consultas SQL en la base de datos

ESQUEMA DE LA BASE DE DATOS:
${schema}

INSTRUCCIONES:
- Responde siempre en español
- Usa las herramientas disponibles para consultar la base de datos
- Formatea los resultados de manera clara y legible

MENSAJE DEL USUARIO:
${userMessage}

RESPUESTA DEL ASISTENTE:
`;
  }

  async handle(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { message?: string };

      if (!body.message?.trim()) {
        return Response.json(
          { error: "message is required" },
          { status: 400 }
        );
      }

      const prompt = this.buildPrompt(body.message);

      const response = await this.responseGenerator.generateResponse(prompt);

      return Response.json({ response });
    } catch (error) {
      console.error("Error processing assistant request:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
