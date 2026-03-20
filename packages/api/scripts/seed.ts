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
    `);

    // Clear existing data
    await client.query("TRUNCATE items, users, inventory, orders, chat_history RESTART IDENTITY CASCADE");

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

    console.log("Seed complete!");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
