export type Item = {
  id?: number;
  name: string;
  description: string;
  price: number;
};

export type User = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
};

export type Inventory = {
  id?: number;
  item_id: number;
  quantity: number;
  location: string;
};

export type ChatHistory = {
  id?: number;
  user_id: number;
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
};

export type Order = {
  id?: number;
  user_id: number;
  item_id: number;
  quantity: number;
  date: string;
};

export type Context = {
  id?: number;
  topic: string;
  content: string;
};

/** Utility: make `id` required (for entities returned from the API) */
export type WithId<T extends { id?: number }> = T & { id: number };

export type Shipping = {
  id?: number;
  city: string;
  department: string;
  shipping_cost_cop: number;
  delivery_estimated_days: number;
};
