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
  // Contextos que siempre se inyectan en el prompt para dar identidad base
  {
    topic: "mensaje_bienvenida",
    content: "¡Hola! Bienvenido a 3DCase, la marca #1 🥇 en Colombia de personalización y fundas para celular en 3D. Aquí protegemos tu equipo y le damos todo tu estilo 😎 ¿Cuéntame por favor cómo te llamas y en qué podemos ayudarte hoy?",
    always_inject: true,
  },
  {
    topic: "acerca_de_la_empresa",
    content: "3DCase es una empresa colombiana a la vanguardia de la innovación digital y protección de hardware para dispositivos móviles. Nos especializamos en soluciones de personalización de alto nivel a través de https://3dcase.com.co/. Utilizamos materiales de ingeniería, como polímeros flexibles y vinilos de precisión, para garantizar un ajuste perfecto. Nos destacamos por dos líneas principales: 1) Skins Adhesivos de vinilo premium que protegen sin añadir volumen y 2) Carcasas 3D con tecnología lenticular que generan efectos de profundidad y movimiento. Nuestra misión es fusionar diseño artístico y funcionalidad técnica.",
    always_inject: true,
  },

  // Contextos específicos de productos (se inyectan solo si el usuario pregunta por ellos)
  {
    topic: "productos_skins_general",
    content: "Los Skins Adhesivos son láminas de vinilo premium diseñadas para proteger el cuerpo del celular contra rayones, polvo y hongos sin alterar su peso ni grosor. Cuentan con tecnología anti-burbujas para una instalación sencilla y no dejan residuos al retirarlos. Son la opción ideal para quienes prefieren sentir el diseño original del equipo o para usar debajo de una funda transparente, brindando una doble capa de protección.",
    always_inject: false,
  },
  {
    topic: "productos_skins_impresos",
    content: "Nuestros Skins Impresos ofrecen personalización visual total. El cliente puede elegir entre cientos de diseños de nuestra galería (anime, deportes, arte, películas) o subir su propia fotografía para crear un diseño exclusivo. La impresión es de alta resolución con tintas resistentes al desgaste, asegurando que los colores y detalles se mantengan vibrantes con el uso diario.",
    always_inject: false,
  },
  {
    topic: "productos_skins_texturizados",
    content: "Los Skins Texturizados Premium están fabricados con materiales de alta gama (marcas como 3M y Oracal). Estos no solo decoran, sino que aportan una experiencia táctil superior y mejoran el agarre. Están disponibles en acabados sofisticados como Fibra de Carbono, Cuero, Panal de Abeja (Honey Comb), Madera y efectos Mate o Metálicos, dándole al dispositivo un aspecto sobrio y profesional.",
    always_inject: false,
  },
  {
    topic: "productos_fundas_y_carcasas",
    content: "Contamos con dos tipos de protección externa: 1) La Funda Transparente de silicona flexible (TPU) con solo 2 milímetros de grosor, diseñada para ser ultraligera y permitir lucir el diseño del celular o un skin. 2) La Carcasa 3D, nuestro producto insignia, que incorpora tecnología lenticular para crear efectos visuales de movimiento y profundidad, fabricada en materiales de ingeniería altamente resistentes a impactos y caídas.",
    always_inject: false,
  },

  {
    topic: "productos_carcasas_3d_efectos",
    content: "Nuestras Carcasas 3D utilizan tecnología lenticular de última generación. Al mover el celular, el diseño reacciona creando efectos de profundidad (3D real) o de movimiento (cambio entre dos imágenes diferentes). Es el producto ideal para quienes buscan un accesorio dinámico que no pasa desapercibido y que convierte cualquier diseño, desde anime hasta fotos familiares, en una pieza con vida propia.",
    always_inject: false,
  },
  {
    topic: "productos_carcasas_3d_resistencia",
    content: "Más allá del impacto visual, la Carcasa 3D está construida para una protección robusta. Combina una placa posterior rígida donde se procesa el efecto 3D con bordes de poliuretano termoplástico (TPU) de alta densidad. Esta estructura absorbe impactos en las esquinas y protege la pantalla mediante bordes ligeramente elevados, garantizando que el estilo no comprometa la seguridad del dispositivo ante caídas accidentales.",
    always_inject: false,
  },

  // Logística y Operaciones
  {
    topic: "logistica_envios",
    content: "Realizamos envíos a toda Colombia principalmente a través de Coordinadora. También es posible solicitar el envío por Inter Rapidísimo asumiendo el costo extra (previa cotización por WhatsApp). El tiempo de despacho es de 24 a 48 horas hábiles tras confirmar el pago. Los tiempos de entrega estimados son: 1) Medellín, Área Metropolitana y Oriente Cercano: 1 a 3 días hábiles. 2) Ciudades principales: 1 a 4 días hábiles. 3) Otros municipios y poblaciones especiales: sujeto a la logística de la transportadora. Ofrecemos ENVÍO TERRESTRE GRATUITO en compras superiores a $60,000 COP. También puedes recoger tu pedido sin costo en nuestra oficina en Rionegro, Antioquia: Av. Galán, Diagonal 50 B #44-29.",
    always_inject: false,
  },
  {
    topic: "logistica_pagos",
    content: "Ofrecemos múltiples métodos de pago seguros para tu comodidad: 1) Pago Contraentrega: paga en efectivo al recibir tu producto (disponible en gran parte del territorio nacional). 2) Wompi (Link de Pago): a través de esta plataforma de Bancolombia puedes pagar con Tarjetas de Crédito/Débito (Visa, Mastercard, Amex), Botón Bancolombia, Nequi y PSE. Es un proceso 100% seguro y encriptado. 3) Transferencia Directa: aceptamos Nequi (cuenta 3001234567) y Daviplata (cuenta 3009876543). Importante: Para transferencias directas, es obligatorio enviar el comprobante de pago a nuestro WhatsApp para validar el pedido e iniciar el proceso de producción/despacho.",
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
