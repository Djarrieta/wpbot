import type { Item, User, Inventory } from "@wpbot/shared";

type WithId<T> = T & { id: number };

const API_URL = process.env.API_URL || "http://localhost:4000";

const items = [
  { name: "Laptop", description: "High-performance laptop", price: 999.99 },
  { name: "Headphones", description: "Wireless noise-cancelling headphones", price: 149.99 },
];

const users = [
  { name: "John Doe", email: "john@example.com", phone: "+1234567890" },
  { name: "Jane Smith", email: "jane@example.com", phone: "+0987654321" },
];

async function post<T>(path: string, data: object): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to POST ${path}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function seed() {
  console.log("Seeding items...");
  const createdItems: WithId<Item>[] = [];
  for (const item of items) {
    const created = await post<WithId<Item>>("/items", item);
    console.log(`  Created item: ${created.name} (id: ${created.id})`);
    createdItems.push(created);
  }

  console.log("Seeding users...");
  for (const user of users) {
    const created = await post<WithId<User>>("/users", user);
    console.log(`  Created user: ${created.name} (id: ${created.id})`);
  }

  console.log("Seeding inventory...");
  const inventoryEntries = [
    { item_id: createdItems[0]!.id, quantity: 50, location: "Warehouse A" },
    { item_id: createdItems[1]!.id, quantity: 100, location: "Warehouse B" },
  ];
  for (const inv of inventoryEntries) {
    const created = await post<WithId<Inventory>>("/inventory", inv);
    console.log(`  Created inventory: item_id=${created.item_id}, qty=${created.quantity} (id: ${created.id})`);
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
