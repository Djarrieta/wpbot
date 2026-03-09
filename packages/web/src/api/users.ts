import type { User } from "../types";
import { createApiClient } from "./createApiClient";

export const usersApi = createApiClient<User>("/users", "user");
