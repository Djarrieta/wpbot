export abstract class MessagingService {
  abstract sendMessage(to: string, text: string): Promise<any>;
}
