import pg from "pg";

const connectionString = process.env.PG_CONNECTION_STRING || "postgresql://wpbot:wpbot@localhost:4003/wpbot";

const items = [
  { name: "Laptop", description: "High-performance laptop", price: 999.99 },
  { name: "Headphones", description: "Wireless noise-cancelling headphones", price: 149.99 },
];

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "+1234567890" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+0987654321" },
];

const contextData: { topic: string; content: string }[] = [
  {
    topic: "logistica",
    content:
      "Información detallada sobre logística: procesos de envío, tiempos de entrega, proveedores de transporte, rutas de distribución, gestión de almacenes y control de inventario.",
  },
];

const shipping = [
  { city: "Bogota", department: "Cundinamarca", shipping_cost_cop: 10000, delivery_estimated_days: 1 },
  { city: "Medellin", department: "Antioquia", shipping_cost_cop: 12000, delivery_estimated_days: 2 },
  { city: "Cali", department: "Valle del Cauca", shipping_cost_cop: 13000, delivery_estimated_days: 2 },
];

async function seed() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    // Create tables matching the API's PgRepository schema exactly
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price DOUBLE PRECISION NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        location TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        date TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        message TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        timestamp TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS context (
        id SERIAL PRIMARY KEY,
        topic TEXT NOT NULL,
        content TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS shipping (
        id SERIAL PRIMARY KEY,
        city TEXT NOT NULL,
        department TEXT NOT NULL,
        shipping_cost_cop REAL NOT NULL DEFAULT 0,
        delivery_estimated_days INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Clear existing data
    await client.query("TRUNCATE items, users, inventory, orders, chat_history, context, shipping RESTART IDENTITY CASCADE");

    console.log("Seeding items...");
    const createdItems: { id: number }[] = [];
    for (const item of items) {
      const res = await client.query(
        "INSERT INTO items (name, description, price) VALUES ($1, $2, $3) RETURNING id",
        [item.name, item.description, item.price]
      );
      createdItems.push(res.rows[0]);
      console.log(`  Created item: ${item.name} (id: ${res.rows[0].id})`);
    }

    console.log("Seeding users...");
    for (const user of users) {
      const res = await client.query(
        "INSERT INTO users (id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id",
        [user.id, user.name, user.email, user.phone]
      );
      console.log(`  Created user: ${user.name} (id: ${res.rows[0].id})`);
    }

    console.log("Seeding inventory...");
    const inventoryEntries = [
      { item_id: createdItems[0]!.id, quantity: 50, location: "Warehouse A" },
      { item_id: createdItems[1]!.id, quantity: 100, location: "Warehouse B" },
    ];
    for (const inv of inventoryEntries) {
      const res = await client.query(
        "INSERT INTO inventory (item_id, quantity, location) VALUES ($1, $2, $3) RETURNING id",
        [inv.item_id, inv.quantity, inv.location]
      );
      console.log(`  Created inventory: item_id=${inv.item_id}, qty=${inv.quantity} (id: ${res.rows[0].id})`);
    }

    console.log("Seeding context...");
    for (const ctx of contextData) {
      const res = await client.query(
        "INSERT INTO context (topic, content) VALUES ($1, $2) RETURNING id",
        [ctx.topic, ctx.content]
      );
      console.log(`  Created context: ${ctx.topic} (id: ${res.rows[0].id})`);
    }

    console.log("Seeding shipping...");
    for (const sc of shipping) {
      const res = await client.query(
        "INSERT INTO shipping (city, department, shipping_cost_cop, delivery_estimated_days) VALUES ($1, $2, $3, $4) RETURNING id",
        [sc.city, sc.department, sc.shipping_cost_cop, sc.delivery_estimated_days]
      );
      console.log(`  Created shipping: ${sc.city} (id: ${res.rows[0].id})`);
    }

    console.log("Seed complete!");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
