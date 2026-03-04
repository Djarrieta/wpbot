export class HealthController {
  handle(_req: Request): Response {
    return new Response("Echo Bot is running!", { status: 200 });
  }
}
