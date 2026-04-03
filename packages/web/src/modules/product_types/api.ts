import type { ProductType, WithId } from "@wpbot/shared";
import { createApiClient } from "@/lib/createApiClient";

export const api = createApiClient<WithId<ProductType>>("/product_types", "product_type");
