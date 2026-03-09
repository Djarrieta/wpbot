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
