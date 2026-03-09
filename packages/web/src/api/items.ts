import type { Item } from "../types";
import { createApiClient } from "./createApiClient";

export const itemsApi = createApiClient<Item>("/items", "item");
