export interface ApiClient<T> {
  fetchAll(params?: Record<string, string | number>): Promise<T[]>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: number, entity: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: number): Promise<void>;
}

const PROXY_PREFIX = '/_proxy';

export function createApiClient<T>(basePath: string, entityName: string): ApiClient<T> {
  const proxyPath = `${PROXY_PREFIX}${basePath}`;
  return {
    async fetchAll(params?: Record<string, string | number>): Promise<T[]> {
      let url = proxyPath;
      if (params) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          searchParams.set(key, String(value));
        }
        url = `${proxyPath}?${searchParams.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${entityName}s: ${res.status}`);
      return res.json();
    },

    async create(entity: Omit<T, "id">): Promise<T> {
      const res = await fetch(proxyPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entity),
      });
      if (!res.ok) throw new Error(`Failed to create ${entityName}: ${res.status}`);
      return res.json();
    },

    async update(id: number, entity: Partial<Omit<T, "id">>): Promise<T> {
      const res = await fetch(`${proxyPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entity),
      });
      if (!res.ok) throw new Error(`Failed to update ${entityName}: ${res.status}`);
      return res.json();
    },

    async delete(id: number): Promise<void> {
      const res = await fetch(`${proxyPath}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete ${entityName}: ${res.status}`);
    },
  };
}
