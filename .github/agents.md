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

- **`packages/api/src/core/sqliteRepository.ts`** — `SQLiteRepository<T>`: generic SQLite CRUD. Takes a table name and column definitions.
- **`packages/api/src/core/crudController.ts`** — `GenericCrudController<T>`: generic REST controller. Takes a repository, entity name, and required fields.
- **`packages/api/src/core/repository.ts`** — `Repository<T>` abstract base class and `BaseEntity` interface.
- **`packages/web/src/api/createApiClient.ts`** — `createApiClient<T>(basePath, name)`: generic fetch wrapper returning `{ fetchAll, create, update, delete }`.
- **`packages/web/src/components/GenericForm.tsx`** — `GenericForm<T>`: data-driven form from a `FormField[]` config.
- **`packages/web/src/components/CrudPage.tsx`** — `CrudPage<T>`: full CRUD page (table + create/edit/delete modals) from config.

## Steps to Add a New Module

### 1. API — Define entity type + repository factory (`src/services/{modules}SQLite.ts`)

```ts
import { SQLiteRepository } from "../core/sqliteRepository";

export type Product = { id?: number; name: string; sku: string; price: number };

export function createProductsRepository() {
  return new SQLiteRepository<Product>("products", [
    { name: "name", type: "TEXT", constraints: "NOT NULL" },
    { name: "sku", type: "TEXT", constraints: "NOT NULL DEFAULT ''" },
    { name: "price", type: "REAL", constraints: "NOT NULL DEFAULT 0" },
  ]);
}
```

### 2. API — Controller (`src/controllers/{modules}Controller.ts`)

For simple CRUD with no extra methods:

```ts
import { GenericCrudController } from "../core/crudController";
import type { Repository } from "../core/repository";
import type { Product } from "../services/productsSQLite";

export class ProductsController extends GenericCrudController<Product> {
  constructor(service: Repository<Product>) {
    super(service, "Product", ["name", "sku", "price"]);
  }
}
```

To add custom methods, add them in the subclass (see `ItemsController.buildPrompt()` for an example).

### 3. API — Register in router (`src/router.ts`)

```ts
import { ProductsController } from "./controllers/productsController";
import { createProductsRepository } from "./services/productsSQLite";

const productsService = createProductsRepository();
const products = new ProductsController(productsService);

// Add to resources array:
{ basePath: "/products", controller: products },
```

### 4. Web — Add type (`src/types.ts`)

```ts
export type Product = { id: number; name: string; sku: string; price: number };
```

### 5. Web — API client (`src/api/{modules}.ts`)

```ts
import type { Product } from "../types";
import { createApiClient } from "./createApiClient";

export const productsApi = createApiClient<Product>("/products", "product");
```

### 6. Web — Form component (`src/components/{Module}Form.tsx`)

```tsx
import type { Product } from "../types";
import { GenericForm, type FormField } from "./GenericForm";

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
  initial?: Product;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm(props: ProductFormProps) {
  return <GenericForm<Product> fields={fields} {...props} />;
}
```

### 7. Web — Page (`src/pages/{Modules}Page.tsx`)

```tsx
import type { Product } from "../types";
import { productsApi } from "../api/products";
import { CrudPage } from "../components/CrudPage";
import { ProductForm } from "../components/ProductForm";

export function ProductsPage() {
  return (
    <CrudPage<Product>
      entityName="Product"
      entityNamePlural="Products"
      api={productsApi}
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

### 8. Web — Routes & Navigation

**`src/App.tsx`** — add route:

```tsx
<Route path="/products" element={<ProductsPage />} />
```

**`src/components/Layout.tsx`** — add nav item:

```ts
{ to: "/products", label: "Products", icon: "🏷️" },
```

### 9. Web — Vite proxy (`vite.config.ts`)

```ts
'/products': { target: 'http://localhost:4000', changeOrigin: true },
```

## File Checklist

| #   | File                                                  | Action             |
| --- | ----------------------------------------------------- | ------------------ |
| 1   | `packages/api/src/services/{modules}SQLite.ts`        | Create (~15 lines) |
| 2   | `packages/api/src/controllers/{modules}Controller.ts` | Create (~8 lines)  |
| 3   | `packages/api/src/router.ts`                          | Modify (3 lines)   |
| 4   | `packages/web/src/types.ts`                           | Modify (1 type)    |
| 5   | `packages/web/src/api/{modules}.ts`                   | Create (~4 lines)  |
| 6   | `packages/web/src/components/{Module}Form.tsx`        | Create (~15 lines) |
| 7   | `packages/web/src/pages/{Modules}Page.tsx`            | Create (~20 lines) |
| 8   | `packages/web/src/App.tsx`                            | Modify (1 line)    |
| 9   | `packages/web/src/components/Layout.tsx`              | Modify (1 line)    |
| 10  | `packages/web/vite.config.ts`                         | Modify (1 line)    |
