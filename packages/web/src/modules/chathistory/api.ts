import type { ChatHistory, WithId } from '@wpbot/shared';
import { createApiClient } from '@/lib/createApiClient';

export const api = createApiClient<WithId<ChatHistory>>("/chathistory", "chathistory");
