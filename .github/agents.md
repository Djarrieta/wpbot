# Commit Message Convention

When creating commit messages, always prefix with the package scope followed by a slash. Use the package directory name from `packages/`:

- `api/` — for changes in `packages/api/`
- `web/` — for changes in `packages/web/`
- `telegram/` — for changes in `packages/telegram/`
- `whatsapp/` — for changes in `packages/whatsapp/`

If a commit spans multiple packages, list them comma-separated (e.g., `api/, web/`).

For root-level changes (e.g., root `package.json`, CI config), use `root/`.

### Examples

```
web/ add dashboard stats component
api/ fix item creation endpoint
telegram/ update bot command handler
api/, web/ sync item types
root/ update dependencies
```

---

# Adding a New CRUD Module

The project uses generic abstractions to minimize boilerplate. When creating a new module (e.g., `products`, `orders`), replace `{Module}` with the singular name and `{modules}` with the plural.

## Shared Abstractions

These generic files power all modules — do NOT duplicate their logic:

- **`packages/shared/src/types.ts`** — Single source of truth for entity types. Also exports `WithId<T>` utility (makes `id` required for API responses).
- **`packages/api/src/core/sqliteRepository.ts`** — `SQLiteRepository<T>`: generic SQLite CRUD. Takes a table name and column definitions.
- **`packages/api/src/core/crudController.ts`** — `GenericCrudController<T>`: generic REST controller. Takes a repository, entity name, and required fields.
- **`packages/api/src/core/repository.ts`** — `Repository<T>` abstract base class and `BaseEntity` interface.
- **`packages/web/src/lib/createApiClient.ts`** — `createApiClient<T>(basePath, name)`: generic fetch wrapper returning `{ fetchAll, create, update, delete }`.
- **`packages/web/src/components/GenericForm.tsx`** — `GenericForm<T>`: data-driven form from a `FormField[]` config.
- **`packages/web/src/components/CrudPage.tsx`** — `CrudPage<T>`: full CRUD page (table + create/edit/delete modals) from config.

## Steps to Add a New Module

### 1. Shared — Add entity type (`packages/shared/src/types.ts`)

Add the type to the shared package (single source of truth for both API and web):

```ts
export type Product = {
  id?: number;
  name: string;
  sku: string;
  price: number;
};
```

Also export it from `packages/shared/src/index.ts`:

```ts
export type { Item, User, Product, WithId } from "./types";
```

### 2. API — Create module folder (`src/modules/{modules}/`)

Create three files inside `packages/api/src/modules/{modules}/`:

**`service.ts`** — Import type from shared + repository factory:

```ts
import { SQLiteRepository } from "../../core/sqliteRepository";
import type { Product } from "@wpbot/shared";

export type { Product };

export function createProductsRepository() {
  return new SQLiteRepository<Product>("products", [
    { name: "name", type: "TEXT", constraints: "NOT NULL" },
    { name: "sku", type: "TEXT", constraints: "NOT NULL DEFAULT ''" },
    { name: "price", type: "REAL", constraints: "NOT NULL DEFAULT 0" },
  ]);
}
```

**`controller.ts`** — CRUD controller (add custom methods in the subclass if needed):

```ts
import { GenericCrudController } from "../../core/crudController";
import type { Repository } from "../../core/repository";
import type { Product } from "./service";

export class ProductsController extends GenericCrudController<Product> {
  constructor(service: Repository<Product>) {
    super(service, "Product", ["name", "sku", "price"]);
  }
}
```

**`index.ts`** — Module entry point exporting a `ResourceRoute`:

```ts
import type { ResourceRoute } from "../../core/types";
import { createProductsRepository } from "./service";
import { ProductsController } from "./controller";

const service = createProductsRepository();
const controller = new ProductsController(service);

export { service, controller };
export type { Product } from "./service";
export { ProductsController } from "./controller";

export default {
  basePath: "/products",
  controller,
} satisfies ResourceRoute;
```

### 3. API — Register in module registry (`src/modules/index.ts`)

Add one import and one array entry:

```ts
import products from "./products";

export const modules: ResourceRoute[] = [
  items,
  users,
  products, // ← add here
];
```

### 4. Web — Create module folder (`src/modules/{modules}/`)

Create four files inside `packages/web/src/modules/{modules}/`:

**`api.ts`** — API client:

```ts
import type { Product, WithId } from "@wpbot/shared";
import { createApiClient } from "../../lib/createApiClient";

export const api = createApiClient<WithId<Product>>("/products", "product");
```

**`Form.tsx`** — Form component:

```tsx
import type { Product, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

const fields: FormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Product name",
    required: true,
  },
  {
    name: "sku",
    label: "SKU",
    type: "text",
    placeholder: "ABC-123",
    required: true,
  },
  {
    name: "price",
    label: "Price",
    type: "number",
    placeholder: "0.00",
    min: "0",
    step: "0.01",
    required: true,
  },
];

interface ProductFormProps {
  initial?: WithId<Product>;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm(props: ProductFormProps) {
  return <GenericForm<WithId<Product>> fields={fields} {...props} />;
}
```

**`Page.tsx`** — Page component:

```tsx
import type { Product, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { ProductForm } from "./Form";
import { api } from "./api";

export function ProductsPage() {
  return (
    <CrudPage<WithId<Product>>
      entityName="Product"
      entityNamePlural="Products"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "sku", header: "SKU" },
        {
          key: "price",
          header: "Price",
          render: (v) => `$${Number(v).toFixed(2)}`,
        },
      ]}
      FormComponent={ProductForm}
    />
  );
}
```

**`index.ts`** — Module entry point (exports route + nav config):

```ts
import type { ModuleConfig } from "../types";
import { ProductsPage } from "./Page";

export default {
  basePath: "/products",
  label: "Products",
  icon: "🏷️",
  Page: ProductsPage,
} satisfies ModuleConfig;
```

### 5. Web — Register in module registry (`src/modules/index.ts`)

Add one import and one array entry (routes and nav are generated automatically):

```ts
import products from "./products";

export const modules: ModuleConfig[] = [
  items,
  users,
  products, // ← add here
];
```

### 6. Web — Vite proxy (`vite.config.ts`)

```ts
'/products': { target: 'http://localhost:4000', changeOrigin: true },
```

> **Note:** `App.tsx` and `Layout.tsx` use the modules registry dynamically — no changes needed there.

## File Checklist

| #   | File                                               | Action             |
| --- | -------------------------------------------------- | ------------------ |
| 1   | `packages/shared/src/types.ts`                     | Modify (1 type)    |
| 2   | `packages/shared/src/index.ts`                     | Modify (1 export)  |
| 3   | `packages/api/src/modules/{modules}/service.ts`    | Create (~10 lines) |
| 4   | `packages/api/src/modules/{modules}/controller.ts` | Create (~8 lines)  |
| 5   | `packages/api/src/modules/{modules}/index.ts`      | Create (~15 lines) |
| 6   | `packages/api/src/modules/index.ts`                | Modify (1 line)    |
| 7   | `packages/web/src/modules/{modules}/api.ts`        | Create (~4 lines)  |
| 8   | `packages/web/src/modules/{modules}/Form.tsx`      | Create (~15 lines) |
| 9   | `packages/web/src/modules/{modules}/Page.tsx`      | Create (~20 lines) |
| 10  | `packages/web/src/modules/{modules}/index.ts`      | Create (~8 lines)  |
| 11  | `packages/web/src/modules/index.ts`                | Modify (1 line)    |
| 12  | `packages/web/vite.config.ts`                      | Modify (1 line)    |
