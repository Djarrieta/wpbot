import type { User, WithId } from '@wpbot/shared';
import { createApiClient } from '../../lib/createApiClient';

export const api = createApiClient<WithId<User>>("/users", "user");
