export class HealthController {
  handle(_req: Request): Response {
    return new Response("WhatsApp Echo Bot is running!", { status: 200 });
  }
}
