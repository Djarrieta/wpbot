import pg from "pg";

const connectionString = process.env.PG_CONNECTION_STRING || "postgresql://wpbot:wpbot@localhost:4003/wpbot";

const items = [
  { name: "Laptop", description: "High-performance laptop", price: 999.99, stock: 50, image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" },
  { name: "Headphones", description: "Wireless noise-cancelling headphones", price: 149.99, stock: 100, image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
  { name: "Smartphone", description: "Latest model smartphone with OLED display", price: 799.99, stock: 30, image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400" },
  { name: "Mechanical Keyboard", description: "RGB mechanical keyboard with Cherry MX switches", price: 129.99, stock: 75, image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400" },
  { name: "Monitor 4K", description: "27-inch 4K UHD monitor", price: 449.99, stock: 20, image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400" },
  { name: "Wireless Mouse", description: "Ergonomic wireless mouse", price: 59.99, stock: 150, image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400" },
  { name: "USB-C Hub", description: "7-in-1 USB-C hub with HDMI and SD card reader", price: 39.99, stock: 200, image_url: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400" },
  { name: "Webcam HD", description: "1080p webcam with built-in microphone", price: 79.99, stock: 0, image_url: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400" },
  { name: "Tablet", description: "10-inch tablet with stylus support", price: 349.99, stock: 40, image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400" },
  { name: "External SSD", description: "1TB portable SSD with USB 3.2", price: 89.99, stock: 60, image_url: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400" },
];

const users = [
  { id: 1, name: "Dario Arrieta", email: "darrieta@contractor.ea.com", phone: "+1234567890", role: "admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+0987654321", role: "client" },
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
    content: "Somos una empresa colombiana líder en personalización para dispositivos móviles a través de nuestra web https://3dcase.com.co/. Nos especializamos en dos soluciones únicas: 1) Skins Adhesivos de vinilo premium (anti-burbujas y sin residuos) que protegen contra rayones y hongos sin añadir volumen, permitiendo incluso el uso de fundas adicionales. 2) Carcazas 3D con tecnología lenticular que generan efectos de profundidad y movimiento al mover el equipo. Ambos productos permiten total personalización con fotos o diseños favoritos para llevar tu esencia a todas partes.",
    always_inject: true,
  },
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
        price DOUBLE PRECISION NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'client'
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email) WHERE email != '';
      CREATE TABLE IF NOT EXISTS user_identities (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(provider, provider_id)
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
    await client.query("TRUNCATE items, users, orders, order_items, chat_history, context, shipping RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE user_identities RESTART IDENTITY CASCADE");

    console.log("Seeding items...");
    const createdItems: { id: number }[] = [];
    for (const item of items) {
      const res = await client.query(
        "INSERT INTO items (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [item.name, item.description, item.price, item.stock, item.image_url]
      );
      createdItems.push(res.rows[0]);
      console.log(`  Created item: ${item.name} (id: ${res.rows[0].id})`);
    }

    console.log("Seeding users...");
    for (const user of users) {
      const res = await client.query(
        "INSERT INTO users (id, name, email, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [user.id, user.name, user.email, user.phone, user.role]
      );
      console.log(`  Created user: ${user.name} (id: ${res.rows[0].id}, role: ${user.role})`);
    }
    // Reset sequence to avoid conflicts when auto-generating IDs later
    await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");

    console.log("Seeding user identities...");
    const identities = [
      { user_id: 1, provider: "google", provider_id: "john@example.com" },
      { user_id: 2, provider: "google", provider_id: "jane@example.com" },
    ];
    for (const identity of identities) {
      await client.query(
        "INSERT INTO user_identities (user_id, provider, provider_id) VALUES ($1, $2, $3)",
        [identity.user_id, identity.provider, identity.provider_id]
      );
      console.log(`  Created identity: user_id=${identity.user_id}, provider=${identity.provider}`);
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
