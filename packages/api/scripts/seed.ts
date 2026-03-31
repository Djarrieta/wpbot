import pg from "pg";

const connectionString = process.env.PG_CONNECTION_STRING || "postgresql://wpbot:wpbot@localhost:4003/wpbot";

const products = [
  // Skins Texturizados (requires_device: false → 1 item each with no brand/reference)
  { name: "Skin Fibra de Carbono", description: "Skin texturizado premium con acabado fibra de carbono 3M", type: "skin texturizado", price: 25000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 50 },
  { name: "Skin Cuero Negro", description: "Skin texturizado acabado cuero premium Oracal", type: "skin texturizado", price: 28000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 40 },
  { name: "Skin Madera Natural", description: "Skin texturizado efecto madera natural", type: "skin texturizado", price: 22000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 60 },
  // Skins Impresos
  { name: "Skin impreso Personalizado", description: "Skin impreso alta resolución", type: "skin impreso", price: 18000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 100 },
  // Fundas Transparentes (requires_device: true → N items, one per model)
  { name: "Funda Transparente TPU", description: "Funda transparente de silicona flexible (TPU) ultraligera de 2mm", type: "funda transparente", price: 20000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: true,
    variants: [
      { brand: "Xiaomi", reference: "Poco X6 Pro", stock: 50 },
      { brand: "Xiaomi", reference: "Redmi Note 13 Pro", stock: 50 },
      { brand: "Xiaomi", reference: "Redmi Note 14 Pro", stock: 50 },
      { brand: "Xiaomi", reference: "Poco X7 Pro", stock: 50 },
      { brand: "Apple", reference: "iPhone 16", stock: 50 },
      { brand: "Apple", reference: "iPhone 16 Pro", stock: 50 },
      { brand: "Apple", reference: "iPhone 16 Pro Max", stock: 50 },
      { brand: "Apple", reference: "iPhone 15", stock: 50 },
      { brand: "Apple", reference: "iPhone 15 Pro Max", stock: 50 },
      { brand: "Apple", reference: "iPhone 14", stock: 50 },
      { brand: "Apple", reference: "iPhone 13", stock: 50 },
      { brand: "Samsung", reference: "Galaxy S25 Ultra", stock: 50 },
      { brand: "Samsung", reference: "Galaxy S25", stock: 50 },
      { brand: "Samsung", reference: "Galaxy S24 Ultra", stock: 50 },
      { brand: "Samsung", reference: "Galaxy S24", stock: 50 },
      { brand: "Samsung", reference: "Galaxy A55", stock: 50 },
      { brand: "Samsung", reference: "Galaxy A35", stock: 50 },
      { brand: "Samsung", reference: "Galaxy A15", stock: 50 },
      { brand: "Motorola", reference: "Moto G84", stock: 50 },
      { brand: "Motorola", reference: "Moto G54", stock: 50 },
      { brand: "Huawei", reference: "Nova 12i", stock: 50 },
    ],
  },
  // Fundas 3D
  { name: "Funda 3D Personalizada", description: "Carcasa 3D lenticular con diseño personalizado del cliente", type: "funda 3d", price: 40000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: true,
    variants: [
      { brand: "Xiaomi", reference: "Poco X6 Pro", stock: 15 },
      { brand: "Xiaomi", reference: "Redmi Note 13 Pro", stock: 20 },
      { brand: "Xiaomi", reference: "Redmi Note 14 Pro", stock: 20 },
      { brand: "Xiaomi", reference: "Poco X7 Pro", stock: 15 },
      { brand: "Apple", reference: "iPhone 16", stock: 20 },
      { brand: "Apple", reference: "iPhone 16 Pro", stock: 20 },
      { brand: "Apple", reference: "iPhone 16 Pro Max", stock: 15 },
      { brand: "Apple", reference: "iPhone 15", stock: 25 },
      { brand: "Apple", reference: "iPhone 15 Pro Max", stock: 15 },
      { brand: "Apple", reference: "iPhone 14", stock: 20 },
      { brand: "Apple", reference: "iPhone 13", stock: 20 },
      { brand: "Samsung", reference: "Galaxy S25 Ultra", stock: 20 },
      { brand: "Samsung", reference: "Galaxy S25", stock: 20 },
      { brand: "Samsung", reference: "Galaxy S24 Ultra", stock: 15 },
      { brand: "Samsung", reference: "Galaxy S24", stock: 20 },
      { brand: "Samsung", reference: "Galaxy A55", stock: 25 },
      { brand: "Samsung", reference: "Galaxy A35", stock: 25 },
      { brand: "Samsung", reference: "Galaxy A15", stock: 30 },
      { brand: "Motorola", reference: "Moto G84", stock: 20 },
      { brand: "Motorola", reference: "Moto G54", stock: 20 },
      { brand: "Huawei", reference: "Nova 12i", stock: 15 },
    ],
  },
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
    topic: "acerca_de_la_empresa_1",
    content: "3DCase es una empresa colombiana a la vanguardia de la innovación digital y protección de hardware para dispositivos móviles. Nos especializamos en soluciones de personalización de alto nivel a través de https://3dcase.com.co/.",
    always_inject: true,
  },
  {
    topic: "acerca_de_la_empresa_2",
    content: "Utilizamos materiales de ingeniería, como polímeros flexibles y vinilos de precisión, para garantizar un ajuste perfecto.",
    always_inject: true,
  },
  {
    topic: "acerca_de_la_empresa_3",
    content: "Nos destacamos por dos líneas principales: 1) Skins Adhesivos de vinilo premium que protegen sin añadir volumen y 2) Carcasas 3D con tecnología lenticular que generan efectos de profundidad y movimiento.",
    always_inject: true,
  },
  {
    topic: "acerca_de_la_empresa_4",
    content: "Nuestra misión es fusionar diseño artístico y funcionalidad técnica.",
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
    content: "Los Skins Texturizados Premium están fabricados con materiales de alta gama (marcas como 3M y Oracal). Estos no solo decoran, sino que aportan una experiencia táctil superior y mejoran el agarre. Están disponibles en acabados sofisticados como Fibra de Carbono, Cuero Negro y Madera Natural, dándole al dispositivo un aspecto sobrio y profesional.",
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

  // Flujo de pedidos (una entrada por paso para edición cómoda en la UI)
  {
    topic: "flujo_creacion_orden_1",
    content: `FLUJO DE RECOLECCIÓN DE INFORMACIÓN PARA CREAR UNA ORDEN NUEVA:

Este flujo define los pasos que debes seguir cuando un cliente quiere hacer un pedido. Sé natural y conversacional, adapta el orden según lo que el cliente ya haya proporcionado (NO repitas preguntas sobre información que ya dio).

PASO 1 — BIENVENIDA Y DETECCIÓN DE INTENCIÓN:
- Si el cliente ya dijo qué quiere (ej: "quiero un skin de fibra de carbono"), NO le preguntes de nuevo qué quiere. Continúa con la información faltante.
- Si el cliente solo saluda, dale la bienvenida y pregúntale en qué le puedes ayudar.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_2",
    content: `PASO 1.5 — PRE-LLENADO DE DATOS CONOCIDOS:
- ANTES de empezar a pedir datos personales al cliente, consulta la tabla "users" (campos name, phone WHERE id del usuario actual) y el campo "collected_info" de la orden más reciente del usuario (SELECT collected_info FROM orders WHERE user_id = <user_id> ORDER BY date DESC LIMIT 1).
- Si encuentras datos previos (nombre, teléfono, dirección, ciudad), tenlos en cuenta para no volver a pedirlos. Cuando llegues al paso correspondiente, confírmalos: "Tengo registrado tu nombre como X y tu teléfono como Y, ¿son correctos para esta orden?"
- Si el usuario confirma, úsalos sin volver a preguntar. Si corrige alguno, usa el dato corregido.
- Si el usuario ya proporcionó datos durante la conversación (ej: "soy Juan, mi cel es 300..."), úsalos directamente sin preguntar ni confirmar.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_3",
    content: `PASO 2 — PRODUCTO DESEADO:
- Identifica qué tipo de producto quiere: skin texturizado, skin impreso, funda transparente, funda 3D, etc.
- Si el diseño es personalizado, pídele que envíe la imagen o describa el diseño.
- Si el producto es personalizado (el nombre contiene 'Personalizado/a'), el cliente DEBERÁ enviar una imagen con su diseño. Infórmale que necesita enviar la imagen. NO valides el contenido de la imagen.
- Para skins: busca por tipo y nombre/diseño (NO por brand/reference, ya que son productos genéricos).
- Para fundas transparentes y fundas 3D: busca por tipo, brand y reference (son específicas por modelo).`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_4",
    content: `PASO 2.5 — IMAGEN PERSONALIZADA (solo productos personalizados):
- Si el producto seleccionado es personalizado (nombre contiene 'personaliz', case-insensitive), pídele al cliente que envíe la imagen que quiere usar para su diseño.
- Cuando el cliente envíe una imagen (el sistema te indicará con un mensaje "[imagen recibida]"), confirma la recepción y registra que la imagen fue recibida.
- NO analices ni valides el contenido de la imagen. Solo necesitas saber que fue enviada.
- Si el cliente envía texto en vez de imagen, recuérdale amablemente que necesitas la imagen como archivo adjunto.
- Puedes continuar con los demás pasos mientras esperas la imagen, pero NO crees la orden sin que la imagen haya sido enviada para items personalizados.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_5",
    content: `PASO 3 — MODELO DE CELULAR:
- Pregúntale la marca y modelo/referencia de su celular.
- Para SKINS: el celular indicado se guardará en el campo "device_reference" de order_items al crear la orden. No es necesario verificar disponibilidad por modelo en items.
- Para FUNDAS TRANSPARENTES: consulta la tabla "items" filtrando por tipo, marca y referencia para verificar disponibilidad (igual que fundas 3D).
- Para FUNDAS 3D: consulta la tabla "items" filtrando por tipo, marca y referencia para verificar disponibilidad.
- Si NO hay stock o no existe el producto para ese celular (aplica a fundas transparentes y fundas 3D), infórmale amablemente que no está disponible y sugiere alternativas. NUNCA le digas al cliente cuántas unidades hay en stock — solo confirma disponibilidad o no disponibilidad.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_6",
    content: `PASO 4 — CANTIDAD:
- NUNCA preguntes la cantidad. Asume siempre 1 unidad por defecto.
- Solo cambia la cantidad si el usuario explícitamente menciona otra (ej: "quiero 3", "necesito 2 fundas").`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_7",
    content: `PASO 4.5 — NOMBRE DEL CLIENTE:
- Pregúntale el nombre completo para registrar en el pedido.
- Si ya lo conoces por la tabla "users", el historial de conversación o por "collected_info" de órdenes anteriores, confírmalo: "¿El pedido va a nombre de X?" y solo pídelo si el cliente no tiene nombre registrado en ninguna fuente.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_8",
    content: `PASO 5 — CIUDAD DE ENTREGA:
- Pregúntale a qué ciudad le enviamos el pedido.
- Consulta la tabla "shipping" para obtener el costo de envío y días estimados.
- Si la ciudad no está en la tabla "shipping", responde EXACTAMENTE: "Dame un momento por favor, valido con el área de logística el costo de envío a [ciudad]." (reemplazando [ciudad] por la ciudad que indicó el cliente). NO continúes con los siguientes pasos. NO preguntes la dirección. La conversación queda pausada hasta que un operador valide el costo de envío.
- IMPORTANTE: No improvises ni intentes cotizar tú mismo. Solo las ciudades que están en la tabla "shipping" tienen costo/tiempo definido. Para el resto, se requiere validación manual del equipo de logística.
- Recuerda: envío GRATIS en compras superiores a $60,000 COP.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_9",
    content: `PASO 6 — DIRECCIÓN EXACTA DE ENVÍO:
- DESPUÉS de confirmar la ciudad y mostrar el costo/tiempo de envío, pregúntale la dirección exacta de entrega dentro de esa ciudad.
- Acepta formatos de dirección colombiana comunes: abreviaturas como cl, cra, cr, tv, dg, av, etc. son válidas (ej: "cl 25 no 43-435", "cra 80 #12-34", "tv 3 bis #10-20"). No rechaces una dirección solo porque usa abreviaturas o no incluye barrio.
- El barrio es opcional pero útil. Si el usuario no lo proporciona, NO lo exijas — la dirección vial (calle/carrera + número) es suficiente.
- Esta dirección se guardará en el campo "shipping_address" de la tabla "orders".
- NO avances al método de pago sin tener al menos la dirección vial (calle/carrera + número).`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_10",
    content: `PASO 7 — TELÉFONO DE CONTACTO:
- Pregúntale un número de teléfono de contacto para la entrega.
- Si ya lo conoces por la tabla "users" (campo phone) o por "collected_info" de órdenes anteriores, confírmalo: "¿Tu número de contacto sigue siendo X?" y solo pídelo si no hay teléfono registrado.
- Se guardará en "collected_info" de la orden junto con el nombre del cliente.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_11",
    content: `PASO 8 — MÉTODO DE PAGO:
- Presenta las opciones: Contraentrega, Wompi (tarjeta/Nequi/PSE/Bancolombia), o Transferencia directa (Nequi/Daviplata).
- Consulta el contexto "logistica_pagos" si necesitas detalles de cada método.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_12",
    content: `PASO 9 — RESUMEN Y CONFIRMACIÓN:
- Presenta un resumen claro con:
  • Producto(s) y cantidad
  • Precio unitario y subtotal
  • Ciudad de entrega
  • Dirección de envío
  • Costo de envío (o "GRATIS" si aplica)
  • Total a pagar
  • Método de pago elegido
- Pide confirmación explícita al cliente antes de crear la orden.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_13",
    content: `PASO 10 — CREACIÓN DE LA ORDEN:
- Solo después de que el cliente confirme, crea la orden en la base de datos:
  1. INSERT en "orders" con status='pending', shipping_city con la ciudad, shipping_address con la dirección exacta, payment_method con el método de pago, y collected_info con el JSON incluyendo nombre y teléfono del cliente (ej: '{"nombre": "Juan Pérez", "telefono": "3001234567"}').
  2. INSERT en "order_items" con los productos correspondientes. Si el item es un skin, incluye device_reference con la marca y modelo del celular del cliente. Si es funda transparente o funda 3D, deja device_reference vacío.
  3. Para items personalizados, incluye image_sent = true en el INSERT de order_items si el cliente ya envió la imagen. Si no la ha enviado, recuérdale antes de crear la orden.
- Confirma al cliente que su pedido fue creado exitosamente con el número de orden.
- IMPORTANTE: NUNCA crees la orden sin tener nombre, teléfono, ciudad, dirección y método de pago.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_14",
    content: `NOTAS IMPORTANTES:
- NO pidas toda la información de golpe. Ve paso a paso, de forma conversacional.
- Si el cliente proporciona varios datos a la vez, aprovéchalos y salta los pasos ya cubiertos.
- Si en cualquier momento el cliente cambia de opinión o quiere modificar algo, ajusta sin problema.
- Siempre verifica el stock ANTES de presentar el resumen.
- NUNCA incluyas cantidades de stock en tus respuestas al cliente. El inventario es información interna del negocio.`,
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
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'skin texturizado',
        price DOUBLE PRECISION NOT NULL DEFAULT 0,
        image_url TEXT NOT NULL DEFAULT '',
        requires_device BOOLEAN NOT NULL DEFAULT false
      );
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        brand TEXT NOT NULL DEFAULT '',
        reference TEXT NOT NULL DEFAULT '',
        stock INTEGER NOT NULL DEFAULT 0
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
        payment_method TEXT NOT NULL DEFAULT '',
        collected_info JSONB NOT NULL DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL DEFAULT '',
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        device_reference TEXT NOT NULL DEFAULT '',
        image_sent BOOLEAN NOT NULL DEFAULT false
      );
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        message TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        timestamp TEXT NOT NULL,
        requires_human BOOLEAN NOT NULL DEFAULT false
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
    await client.query("TRUNCATE products, items, users, orders, order_items, chat_history, context, shipping RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE user_identities RESTART IDENTITY CASCADE");

    console.log("Seeding products & items...");
    for (const product of products) {
      const { variants, stock, ...productData } = product as typeof product & { variants?: { brand: string; reference: string; stock: number }[]; stock?: number };
      const pRes = await client.query(
        "INSERT INTO products (name, description, type, price, image_url, requires_device) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [productData.name, productData.description, productData.type, productData.price, productData.image_url, productData.requires_device]
      );
      const productId = pRes.rows[0].id;
      console.log(`  Created product: ${productData.name} (id: ${productId})`);

      if (variants && variants.length > 0) {
        for (const v of variants) {
          await client.query(
            "INSERT INTO items (product_id, brand, reference, stock) VALUES ($1, $2, $3, $4)",
            [productId, v.brand, v.reference, v.stock]
          );
        }
        console.log(`    Created ${variants.length} item variants`);
      } else {
        // Non-device product: single item with no brand/reference
        await client.query(
          "INSERT INTO items (product_id, brand, reference, stock) VALUES ($1, $2, $3, $4)",
          [productId, "", "", stock ?? 0]
        );
        console.log(`    Created 1 item (generic)`);
      }
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
