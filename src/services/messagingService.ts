export interface IncomingMessage {
  from: string;
  text: string;
}

export interface VerificationResult {
  valid: boolean;
  challenge?: string;
}

export abstract class MessagingService {
  abstract sendMessage(to: string, text: string): Promise<any>;
  abstract parseIncomingMessage(body: any): IncomingMessage | null;

  // Optional: Override for platforms that need webhook verification (e.g., WhatsApp)
  verifyWebhook(req: Request): VerificationResult | null {
    return null; // No verification needed by default
  }
}
