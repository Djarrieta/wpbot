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

const contextData: { topic: string; content: string; always_inject: boolean }[] = [
  // Contextos que siempre se inyectan en el prompt
  {
    topic: "mensaje_bienvenida",
    content: "Hola! Bienvenido a 3DCase, la marca #1 🥇 en Colombia de fundas para celular en 3D, aquí lo proteges y le das todo tu estilo 😎 ¿Cuéntame por favor como te llamas y como te podemos ayudar?",
    always_inject: true,
  },
  {
    topic: "acerca_de_la_empresa",
    content: "Somos una empresa colombiana dedicada a la fabricación y comercialización de fundas y stickers para celular. Página web: https://3dcase.com.co/",
    always_inject: true,
  },
  {
    topic: "enfoque_comercial",
    content: "Eres un asistente de ventas por WhatsApp, especializado en la comercialización de skins y cases 3D personalizados para celulares.",
    always_inject: true,
  },
  // Contextos consultables por el agente cuando lo necesite
  {
    topic: "logistica_envios",
    content: "Se hacen envíos nacionales. El cliente también puede recoger en la oficina: Av. Galán, Diagonal 50 B #44-29, Rionegro, Antioquia. El tiempo de entrega es de 24 horas hábiles.",
    always_inject: false,
  },
  {
    topic: "logistica_pagos",
    content: "Métodos de pago disponibles: Wompi (plataforma de Bancolombia), transferencias por Nequi (cuenta 3001234567), Daviplata (cuenta 3009876543), y tarjetas de crédito/débito (Visa, Mastercard, American Express). Para pagos con Wompi, el cliente recibirá un link de pago seguro. Nequi y Daviplata: enviar comprobante al WhatsApp.",
    always_inject: false,
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
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0
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
        content TEXT NOT NULL,
        always_inject BOOLEAN NOT NULL DEFAULT false
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
    await client.query("TRUNCATE items, users, inventory, orders, order_items, chat_history, context, shipping RESTART IDENTITY CASCADE");

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
        "INSERT INTO context (topic, content, always_inject) VALUES ($1, $2, $3) RETURNING id",
        [ctx.topic, ctx.content, ctx.always_inject]
      );
      console.log(`  Created context: ${ctx.topic} (always_inject: ${ctx.always_inject}, id: ${res.rows[0].id})`);
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
