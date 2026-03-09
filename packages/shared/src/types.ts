export type Item = {
  id?: number;
  name: string;
  description: string;
  price: number;
};

export type User = {
  id?: number;
  name: string;
  email: string;
  phone: string;
};

/** Utility: make `id` required (for entities returned from the API) */
export type WithId<T extends { id?: number }> = T & { id: number };
