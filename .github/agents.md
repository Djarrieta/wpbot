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

When creating a new module (e.g., `users`, `products`, `orders`), follow these steps. Replace `{module}` with your entity name (singular for types, plural for files/routes).

## 1. API package (`packages/api`)

### 1.1 SQLite Service — `src/services/{modules}SQLite.ts`

- Define the entity type (e.g., `export type User = { id?: number; name: string; ... }`)
- Create a class extending `Repository<T>` from `src/core/repository.ts`
- Implement all abstract methods: `initializeTable`, `create`, `getAll`, `getById`, `update`, `delete`, `close`, `text`
- Use `DB_PATH` from `src/constants.ts` for the database path

### 1.2 Controller — `src/controllers/{modules}Controller.ts`

- Create a class implementing `CrudController` from `src/core/types.ts`
- Inject `Repository<T>` via constructor
- Implement: `getAll`, `getById`, `create`, `update`, `delete`
- Add input validation in `create` for required fields

### 1.3 Router — `src/router.ts`

- Import the new service and controller
- Instantiate both (service first, then controller with service injected)
- Add a new entry to the `resources` array: `{ basePath: "/{modules}", controller: instance }`

## 2. Web package (`packages/web`)

### 2.1 Type — `src/types.ts`

- Add the frontend entity type (with `id: number` required, matching the API type)

### 2.2 API Client — `src/api/{modules}.ts`

- Export CRUD functions: `fetch{Modules}`, `create{Module}`, `update{Module}`, `delete{Module}`
- Use `const BASE = "/{modules}"` as the base URL

### 2.3 Form Component — `src/components/{Module}Form.tsx`

- Create a form with fields matching the entity
- Accept props: `initial?`, `onSubmit`, `onCancel`, `loading?`
- Use the shared `Button` component

### 2.4 Page — `src/pages/{Modules}Page.tsx`

- Full CRUD page using `Table`, `Button`, `Modal`, and the form component
- Handle states: loading, error, saving
- Include create/edit/delete modals

### 2.5 App Routes — `src/App.tsx`

- Import the new page component
- Add a `<Route path="/{modules}" element={<{Modules}Page />} />` inside the Layout route

### 2.6 Sidebar Navigation — `src/components/Layout.tsx`

- Add an entry to the `navItems` array: `{ to: "/{modules}", label: "{Modules}", icon: "🔷" }`

### 2.7 Vite Proxy — `vite.config.ts`

- Add a proxy entry for `/{modules}` pointing to the API server (`http://localhost:4000`)

## File Checklist

| #   | File                                                  | Action |
| --- | ----------------------------------------------------- | ------ |
| 1   | `packages/api/src/services/{modules}SQLite.ts`        | Create |
| 2   | `packages/api/src/controllers/{modules}Controller.ts` | Create |
| 3   | `packages/api/src/router.ts`                          | Modify |
| 4   | `packages/web/src/types.ts`                           | Modify |
| 5   | `packages/web/src/api/{modules}.ts`                   | Create |
| 6   | `packages/web/src/components/{Module}Form.tsx`        | Create |
| 7   | `packages/web/src/pages/{Modules}Page.tsx`            | Create |
| 8   | `packages/web/src/App.tsx`                            | Modify |
| 9   | `packages/web/src/components/Layout.tsx`              | Modify |
| 10  | `packages/web/vite.config.ts`                         | Modify |
