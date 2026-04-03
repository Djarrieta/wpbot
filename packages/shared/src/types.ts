export type ProductType = {
  id?: number;
  name: string;
};

export type Product = {
  id?: number;
  name: string;
  description: string;
  product_type_id: number;
  price: number;
  image_url: string;
  requires_device: boolean;
};

export type Group = {
  id?: number;
  name: string;
};

export type Subgroup = {
  id?: number;
  group_id: number;
  name: string;
};

export type Item = {
  id?: number;
  product_id: number;
  subgroup_id: number;
  stock: number;
};

export type User = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  shipping_city_id?: number;
  shipping_address?: string;
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
  role: 'user' | 'assistant' | 'summary';
  timestamp: string;
  requires_human?: boolean;
};

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export type Order = {
  id?: number;
  user_id: number;
  date: string;
  status?: OrderStatus;
  shipping_city?: string;
  shipping_address?: string;
  payment_method?: string;
  collected_info?: Record<string, string>;
};

export type OrderItem = {
  id?: number;
  order_id: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  unit_price: number;
  device_reference?: string;
  image_sent?: boolean;
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
