import pg from "pg";

const connectionString = process.env.PG_CONNECTION_STRING || "postgresql://wpbot:wpbot@localhost:4003/wpbot";

const items = [
  // Skins Texturizados
  { name: "Skin Fibra de Carbono", description: "Skin texturizado premium con acabado fibra de carbono 3M", type: "skin texturizado", brand: "Samsung", reference: "Galaxy S24 Ultra", price: 25000, stock: 50, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Skin Cuero Negro", description: "Skin texturizado acabado cuero premium Oracal", type: "skin texturizado", brand: "Apple", reference: "iPhone 15 Pro Max", price: 28000, stock: 40, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Skin Madera Natural", description: "Skin texturizado efecto madera natural", type: "skin texturizado", brand: "Xiaomi", reference: "Redmi Note 13 Pro", price: 22000, stock: 60, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  // Skins Impresos
  { name: "Skin Anime Dragon Ball", description: "Skin impreso alta resolución diseño Dragon Ball Z", type: "skin impreso", brand: "Samsung", reference: "Galaxy A55", price: 18000, stock: 100, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Skin Arte Abstracto", description: "Skin impreso con diseño de arte abstracto vibrante", type: "skin impreso", brand: "Apple", reference: "iPhone 14", price: 18000, stock: 80, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Skin Personalizado", description: "Skin impreso con foto o diseño personalizado del cliente", type: "skin impreso", brand: "Motorola", reference: "Moto G54", price: 20000, stock: 200, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Skin Deportivo Fútbol", description: "Skin impreso con diseños de equipos de fútbol", type: "skin impreso", brand: "Samsung", reference: "Galaxy S23 FE", price: 18000, stock: 90, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  // Fundas 3D
  { name: "Funda 3D Anime Naruto", description: "Carcasa 3D lenticular con efecto de movimiento Naruto", type: "funda 3d", brand: "Apple", reference: "iPhone 15", price: 35000, stock: 30, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Funda 3D Paisaje", description: "Carcasa 3D lenticular con efecto de profundidad paisaje", type: "funda 3d", brand: "Samsung", reference: "Galaxy S24", price: 35000, stock: 25, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
  { name: "Funda 3D Personalizada", description: "Carcasa 3D lenticular con diseño personalizado del cliente", type: "funda 3d", brand: "Xiaomi", reference: "Poco X6 Pro", price: 40000, stock: 15, image_url: "https://images.unsplash.com/photo-1609692814857-4093e3a1b0e0?w=400" },
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

  // Flujo de pedidos
  {
    topic: "flujo_creacion_orden",
    content: `FLUJO DE RECOLECCIÓN DE INFORMACIÓN PARA CREAR UNA ORDEN NUEVA:

Este flujo define los pasos que debes seguir cuando un cliente quiere hacer un pedido. Sé natural y conversacional, adapta el orden según lo que el cliente ya haya proporcionado (NO repitas preguntas sobre información que ya dio).

PASO 1 — BIENVENIDA Y DETECCIÓN DE INTENCIÓN:
- Si el cliente ya dijo qué quiere (ej: "quiero un skin de fibra de carbono"), NO le preguntes de nuevo qué quiere. Continúa con la información faltante.
- Si el cliente solo saluda, dale la bienvenida y pregúntale en qué le puedes ayudar.

PASO 2 — PRODUCTO DESEADO:
- Identifica qué tipo de producto quiere: skin texturizado, skin impreso, funda 3D, etc.
- Si el diseño es personalizado, pídele que envíe la imagen o describa el diseño.

PASO 3 — MODELO DE CELULAR:
- Pregúntale la marca y modelo/referencia de su celular.
- Consulta la tabla "items" filtrando por tipo, marca y referencia para verificar disponibilidad.
- Si NO hay stock o no existe el producto para ese celular, infórmale amablemente y sugiere alternativas disponibles.

PASO 4 — CANTIDAD:
- Pregúntale cuántas unidades desea. Si no lo menciona, asume 1 unidad.

PASO 5 — CIUDAD DE ENTREGA:
- Pregúntale a qué ciudad le enviamos el pedido.
- Consulta la tabla "shipping" para obtener el costo de envío y días estimados.
- Si la ciudad no está en la tabla, informa que el envío es posible pero el costo y tiempo deben cotizarse aparte.
- Recuerda: envío GRATIS en compras superiores a $60,000 COP.

PASO 6 — MÉTODO DE PAGO:
- Presenta las opciones: Contraentrega, Wompi (tarjeta/Nequi/PSE/Bancolombia), o Transferencia directa (Nequi/Daviplata).
- Consulta el contexto "logistica_pagos" si necesitas detalles de cada método.

PASO 7 — RESUMEN Y CONFIRMACIÓN:
- Presenta un resumen claro con:
  • Producto(s) y cantidad
  • Precio unitario y subtotal
  • Ciudad de entrega
  • Costo de envío (o "GRATIS" si aplica)
  • Total a pagar
  • Método de pago elegido
- Pide confirmación explícita al cliente antes de crear la orden.

PASO 8 — CREACIÓN DE LA ORDEN:
- Solo después de que el cliente confirme, crea la orden en la base de datos:
  1. INSERT en "orders" con status='pending'
  2. INSERT en "order_items" con los productos correspondientes
- Confirma al cliente que su pedido fue creado exitosamente con el número de orden.

NOTAS IMPORTANTES:
- NO pidas toda la información de golpe. Ve paso a paso, de forma conversacional.
- Si el cliente proporciona varios datos a la vez, aprovéchalos y salta los pasos ya cubiertos.
- Si en cualquier momento el cliente cambia de opinión o quiere modificar algo, ajusta sin problema.
- Siempre verifica el stock ANTES de presentar el resumen.`,
    always_inject: true,
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
        type TEXT NOT NULL DEFAULT 'skin impreso',
        brand TEXT NOT NULL DEFAULT '',
        reference TEXT NOT NULL DEFAULT '',
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
        status TEXT NOT NULL DEFAULT 'pending',
        shipping_city TEXT NOT NULL DEFAULT '',
        shipping_address TEXT NOT NULL DEFAULT '',
        payment_method TEXT NOT NULL DEFAULT ''
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
        "INSERT INTO items (name, description, type, brand, reference, price, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [item.name, item.description, item.type, item.brand, item.reference, item.price, item.stock, item.image_url]
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
