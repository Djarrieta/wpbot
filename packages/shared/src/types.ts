export type Item = {
  id?: number;
  name: string;
  description: string;
  type: 'skin texturizado' | 'skin impreso' | 'funda 3d';
  brand?: string;
  reference?: string;
  price: number;
  stock: number;
  image_url: string;
};

export type User = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

export type UserIdentity = {
  id?: number;
  user_id: number;
  provider: string;
  provider_id: string;
  created_at: string;
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
  date: string;
  status?: string;
  shipping_city?: string;
  shipping_address?: string;
  payment_method?: string;
  collected_info?: Record<string, string>;
};

export type OrderItem = {
  id?: number;
  order_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  device_reference?: string;
};

export type Context = {
  id?: number;
  topic: string;
  content: string;
  always_inject: boolean;
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
