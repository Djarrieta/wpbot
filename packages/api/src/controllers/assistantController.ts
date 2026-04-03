import { ResponseGenerator } from "../core/responseGenerator";
import type { GenericCrudController } from "../core/crudController";
import type { BaseEntity } from "../core/repository";
import type { ChatHistoryRepository } from "../modules/chathistory/service";
import type { UsersRepository } from "../modules/users/service";
import type { Context } from "@wpbot/shared";
import { HUMAN_ESCALATION_MESSAGE, LOGISTICS_ESCALATION_PATTERN } from "../constants";

export class AssistantController {
  private readonly responseGenerator: ResponseGenerator;
  private readonly controllers: GenericCrudController<BaseEntity>[];
  private readonly promptTemplate: string;
  private readonly chatHistoryService: ChatHistoryRepository;
  private readonly usersService: UsersRepository;
  private readonly queryableTopicsFetcher: () => Promise<string[]>;
  private readonly alwaysInjectContextsFetcher: () => Promise<Context[]>;

  constructor(
    responseGenerator: ResponseGenerator,
    controllers: GenericCrudController<BaseEntity>[],
    promptTemplate: string,
    chatHistoryService: ChatHistoryRepository,
    usersService: UsersRepository,
    queryableTopicsFetcher: () => Promise<string[]>,
    alwaysInjectContextsFetcher: () => Promise<Context[]>,
  ) {
    this.responseGenerator = responseGenerator;
    this.controllers = controllers;
    this.promptTemplate = promptTemplate;
    this.chatHistoryService = chatHistoryService;
    this.usersService = usersService;
    this.queryableTopicsFetcher = queryableTopicsFetcher;
    this.alwaysInjectContextsFetcher = alwaysInjectContextsFetcher;
  }

  private async buildPrompt(userMessage: string, userId: number): Promise<string> {
    const schema = this.controllers
      .map((c) => `- ${c.schemaText()}`)
      .join('\n');

    const summary = await this.chatHistoryService.getLatestSummary(userId);
    let conversationHistory: string;

    if (summary) {
      const recentMessages = await this.chatHistoryService.getMessagesSinceSummary(userId);
      const recentHistory = recentMessages
        .map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.message}`)
        .join('\n');
      conversationHistory = `RESUMEN DE CONVERSACIÓN ANTERIOR:\n${summary.message}\n\nCONVERSACIÓN RECIENTE:\n${recentHistory || 'No hay mensajes recientes.'}`;
    } else {
      const history = await this.chatHistoryService.getByUserId(userId);
      conversationHistory = history.length > 0
        ? history.map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.message}`).join('\n')
        : 'No hay conversación previa.';
    }

    const userInfo = await this.usersService.getById(userId);

    const queryableTopics = await this.queryableTopicsFetcher();
    const contextTopicList = queryableTopics.length > 0 ? queryableTopics.join(', ') : 'Ninguno disponible';

    const alwaysInjectContexts = await this.alwaysInjectContextsFetcher();
    const injectedContext = alwaysInjectContexts.length > 0
      ? alwaysInjectContexts.map((c) => `[${c.topic}]: ${c.content}`).join('\n')
      : 'Sin contexto adicional.';

    return this.promptTemplate
      .replaceAll('{{userId}}', userId.toString())
      .replace('{{userInfo}}', JSON.stringify(userInfo))
      .replace('{{schema}}', schema)
      .replace('{{contextTopicList}}', contextTopicList)
      .replace('{{injectedContext}}', injectedContext)
      .replace('{{conversationHistory}}', conversationHistory)
      .replace('{{userMessage}}', userMessage);
  }

  async handle(req: Request): Promise<Response> {
    let userId: number | undefined;

    try {
      const body = await req.json() as {
        message?: string;
        provider?: string;
        providerId?: string;
        userId?: number;
        name?: string;
        email?: string;
      };

      if (!body.message?.trim()) {
        return Response.json(
          { error: "message is required" },
          { status: 400 }
        );
      }

      if (!body.provider && !body.userId && !body.email) {
        return Response.json(
          { error: "provider+providerId, userId, or email is required" },
          { status: 400 }
        );
      }

      // Resolve user: prefer provider-based, fall back to email lookup
      if (body.provider && body.providerId) {
        const user = await this.usersService.resolveByIdentity(
          body.provider,
          body.providerId,
          { name: body.name, email: body.email },
        );
        userId = user.id!;
      } else if (body.email) {
        const user = await this.usersService.getOrCreateByEmail(body.email, body.name);
        userId = user.id!;
      } else {
        return Response.json(
          { error: "provider+providerId or email is required" },
          { status: 400 }
        );
      }

      // Check if conversation is blocked (requires human intervention)
      const blocked = await this.chatHistoryService.isConversationBlocked(userId);

      if (blocked) {
        // Save the user message so it's not lost
        await this.chatHistoryService.addMessage(userId, body.message, 'user');
        return Response.json({ response: "", blocked: true });
      }

      const prompt = await this.buildPrompt(body.message, userId);

      // Save user message to history
      await this.chatHistoryService.addMessage(userId, body.message, 'user');

      const response = await this.responseGenerator.generateResponse(prompt);

      // Save assistant response to history
      const assistantMessage = await this.chatHistoryService.addMessage(userId, response, 'assistant');

      // If the AI response contains an escalation message, mark as requires_human
      if (response.includes(HUMAN_ESCALATION_MESSAGE) || response.includes(LOGISTICS_ESCALATION_PATTERN)) {
        await this.chatHistoryService.markRequiresHuman(assistantMessage.id!);
      }

      // Fire-and-forget: generate summary if needed
      if (await this.chatHistoryService.shouldSummarize(userId)) {
        this.generateSummary(userId).catch((err) =>
          console.error("Summary generation failed:", err),
        );
      }

      return Response.json({ response });
    } catch (error) {
      console.error("Error processing assistant request:", error);

      // Save the escalation message if we know the user
      if (userId) {
        try {
          await this.chatHistoryService.addMessage(userId, HUMAN_ESCALATION_MESSAGE, 'assistant', true);
        } catch (innerError) {
          console.error("Failed to save escalation message:", innerError);
        }
      }

      return Response.json({ response: HUMAN_ESCALATION_MESSAGE });
    }
  }

  private async generateSummary(userId: number): Promise<void> {
    const messages = await this.chatHistoryService.getMessagesSinceSummary(userId);
    if (messages.length === 0) return;

    const conversation = messages
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.message}`)
      .join('\n');

    const summaryPrompt = `Resume la siguiente conversación entre un usuario y un asistente de ventas. Mantén los datos clave: productos mencionados, preferencias del usuario, órdenes creadas, información personal proporcionada (nombre, dirección, teléfono), y cualquier compromiso o pendiente. El resumen debe ser conciso pero completo para que un asistente pueda continuar la conversación sin perder contexto.\n\nCONVERSACIÓN:\n${conversation}\n\nRESUMEN:`;

    const summaryText = await this.responseGenerator.generateResponse(summaryPrompt);
    await this.chatHistoryService.saveSummary(userId, summaryText);
  }
}
