import pg from "pg";

const connectionString = process.env.PG_CONNECTION_STRING || "postgresql://wpbot:wpbot@localhost:4003/wpbot";

const groups = ["Apple", "Samsung", "Xiaomi", "Motorola", "Huawei"];

const subgroupsByGroup: Record<string, string[]> = {
  Apple: ["iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 15", "iPhone 15 Pro Max", "iPhone 14", "iPhone 13"],
  Samsung: ["Galaxy S25 Ultra", "Galaxy S25", "Galaxy S24 Ultra", "Galaxy S24", "Galaxy A55", "Galaxy A35", "Galaxy A15"],
  Xiaomi: ["Poco X6 Pro", "Redmi Note 13 Pro", "Redmi Note 14 Pro", "Poco X7 Pro"],
  Motorola: ["Moto G84", "Moto G54"],
  Huawei: ["Nova 12i"],
};

// All subgroup names for variants that need every device
const allSubgroups = Object.entries(subgroupsByGroup).flatMap(([group, subs]) =>
  subs.map((sub) => ({ group, sub }))
);

const productTypes = [
  { name: "Funda 3D", description: "Carcasa con tecnología lenticular 3D que genera efectos de profundidad y movimiento", image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "Skin Texturizado", description: "Vinilo adhesivo premium con texturas táctiles de alta gama (fibra de carbono, cuero, madera)", image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "Funda Impresa", description: "Funda rígida con impresión personalizada en alta resolución", image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "Skin Impreso", description: "Vinilo adhesivo con impresión personalizada de alta resolución en cualquier diseño", image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "Funda Transparente", description: "Funda de silicona flexible TPU ultraligera de 2mm que permite lucir el diseño del celular", image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400" },
];

const products = [
  // Skins Texturizados (requires_device: false → 1 item each with no subgroup)
  { name: "Skin Fibra de Carbono", description: "Skin texturizado premium con acabado fibra de carbono 3M", typeName: "Skin Texturizado", price: 25000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 50 },
  { name: "Skin Cuero Negro", description: "Skin texturizado acabado cuero premium Oracal", typeName: "Skin Texturizado", price: 28000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 40 },
  { name: "Skin Madera Natural", description: "Skin texturizado efecto madera natural", typeName: "Skin Texturizado", price: 22000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 60 },
  // Skins Impresos
  { name: "Skin impreso Personalizado", description: "Skin impreso alta resolución", typeName: "Skin Impreso", price: 18000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: false, stock: 100 },
  // Fundas Transparentes (requires_device: true → one item per subgroup)
  { name: "Funda Transparente TPU", description: "Funda transparente de silicona flexible (TPU) ultraligera de 2mm", typeName: "Funda Transparente", price: 20000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: true,
    variants: allSubgroups.map(({ group, sub }) => ({ group, sub, stock: 50 })),
  },
  // Fundas 3D
  { name: "Funda 3D Personalizada", description: "Carcasa 3D lenticular con diseño personalizado del cliente", typeName: "Funda 3D", price: 40000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: true,
    variants: allSubgroups.map(({ group, sub }) => {
      // Vary stock by brand
      const stock = group === "Samsung" && sub.includes("A") ? 25 :
                    group === "Huawei" ? 15 : 20;
      return { group, sub, stock };
    }),
  },
  // Fundas Impresas
  { name: "Funda Impresa Personalizada", description: "Funda con impresión personalizada en alta resolución sobre carcasa rígida", typeName: "Funda Impresa", price: 35000, image_url: "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400", requires_device: true,
    variants: allSubgroups.map(({ group, sub }) => ({ group, sub, stock: 30 })),
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
- Busca el producto en la tabla "products" por nombre y/o tipo para identificarlo internamente.
- NO muestres el precio aún en este paso. El precio SOLO se confirma en el PASO 3 junto con la disponibilidad, DESPUÉS de verificar stock en "items".
- Si el producto requiere modelo de celular, pasa DIRECTAMENTE al PASO 3 para preguntarlo. No confirmes ni muestres precio antes de conocer el modelo y verificar stock.`,
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
    content: `PASO 3 — MODELO DE CELULAR Y CONFIRMACIÓN DE DISPONIBILIDAD + PRECIO:
- Si el producto requiere especificar modelo de celular, pregúntale la marca y modelo/referencia de su celular.
- Verifica disponibilidad buscando en la tabla "items" haciendo JOIN con subgroups y groups: SELECT i.id, i.stock FROM items i JOIN subgroups sg ON sg.id = i.subgroup_id JOIN groups g ON g.id = sg.group_id WHERE i.product_id = <product_id> AND g.name = '<marca>' AND sg.name ILIKE '%<modelo>%' AND i.stock > 0.
- Si NO hay stock o no existe la variante para ese celular, infórmale amablemente que no está disponible para ese modelo y sugiere alternativas (otros modelos disponibles del mismo producto, u otros productos similares).
- Si el producto NO requiere modelo de celular, verifica stock directamente en "items" por product_id.
- SOLO DESPUÉS de verificar disponibilidad en "items", confirma al cliente el precio (obtenido de products.price) junto con la disponibilidad en UNA SOLA respuesta. Ejemplo: "Tenemos disponible la Funda Transparente TPU para tu Samsung Galaxy S24. El precio es $20,000 COP."
- REGLA ESTRICTA: NUNCA muestres el precio de un producto antes de haber verificado su disponibilidad en "items". El precio y la disponibilidad SIEMPRE se comunican juntos, nunca por separado.
- NUNCA le digas al cliente cuántas unidades hay en stock — solo confirma disponibilidad o no disponibilidad.`,
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
- Si el cliente YA proporcionó su nombre durante esta conversación (en cualquier mensaje anterior), úsalo directamente SIN pedir confirmación. El cliente acaba de decirlo, no tiene sentido preguntarle de nuevo.
- Si el nombre viene de datos previos (tabla "users" o "collected_info" de órdenes anteriores) y el cliente NO lo ha mencionado en esta conversación, confírmalo brevemente: "¿El pedido va a nombre de X?"
- Solo pregunta el nombre si no lo conoces por ninguna fuente (ni conversación, ni tabla users, ni collected_info).`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_8",
    content: `PASO 5 — DESTINO DE ENVÍO (ciudad + dirección):
- Pregúntale al cliente a dónde le enviamos el pedido (ciudad y dirección) en UNA SOLA pregunta natural Ejemplo: "¿A dónde te lo enviamos? Necesito la ciudad y la dirección de entrega."
- NO hagas dos preguntas separadas (primero ciudad, luego dirección). Pide ambos datos juntos.
- Si el cliente proporciona solo la ciudad sin dirección, pídele la dirección. Si proporciona solo la dirección sin ciudad, pídele la ciudad. Pero siempre intenta obtener ambos en una sola interacción.
- Acepta formatos de dirección colombiana comunes: abreviaturas como cl, cra, cr, tv, dg, av, etc. son válidas (ej: "cl 25 no 43-435", "cra 80 #12-34", "tv 3 bis #10-20"). No rechaces una dirección solo porque usa abreviaturas o no incluye barrio.
- El barrio es opcional pero útil. Si el usuario no lo proporciona, NO lo exijas — la dirección vial (calle/carrera + número) es suficiente.
- OBLIGATORIO: Una vez tengas la ciudad, SIEMPRE ejecuta una consulta SQL a la tabla "shipping" para obtener el costo de envío y días estimados: SELECT shipping_cost_cop, delivery_estimated_days FROM shipping WHERE LOWER(city) = LOWER('<ciudad>'). NUNCA inventes ni estimes el costo de envío — SIEMPRE debe salir del resultado de esta consulta.
- Si la ciudad no está en la tabla "shipping" (la consulta no devuelve resultados), responde EXACTAMENTE: "Dame un momento por favor, valido con el área de logística el costo de envío a [ciudad]." (reemplazando [ciudad] por la ciudad que indicó el cliente). NO continúes con los siguientes pasos. La conversación queda pausada hasta que un operador valide el costo de envío.
- IMPORTANTE: No improvises ni intentes cotizar tú mismo. Solo las ciudades que están en la tabla "shipping" tienen costo/tiempo definido. Para el resto, se requiere validación manual del equipo de logística.
- Recuerda: envío GRATIS en compras superiores a $60,000 COP.
- NO avances al método de pago sin tener al menos la dirección vial (calle/carrera + número).`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_9",
    content: `PASO 6 — TELÉFONO DE CONTACTO:
- Pregúntale un número de teléfono de contacto para la entrega.
- Si ya lo conoces por la tabla "users" (campo phone) o por "collected_info" de órdenes anteriores, confírmalo: "¿Tu número de contacto sigue siendo X?" y solo pídelo si no hay teléfono registrado.
- Se guardará en "collected_info" de la orden junto con el nombre del cliente.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_10",
    content: `PASO 7 — MÉTODO DE PAGO:
- Presenta las opciones: Contraentrega, Wompi (tarjeta/Nequi/PSE/Bancolombia), o Transferencia directa (Nequi/Daviplata).
- Consulta el contexto "logistica_pagos" si necesitas detalles de cada método.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_11",
    content: `PASO 8 — RESUMEN Y CONFIRMACIÓN:
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
    topic: "flujo_creacion_orden_12",
    content: `PASO 9 — CREACIÓN DE LA ORDEN:
- Solo después de que el cliente confirme, crea la orden en la base de datos siguiendo los pasos técnicos del prompt (crear orden, luego insertar order_items).
- Para productos con requires_device = true: incluye device_reference con la marca y modelo del celular (obtenido de groups.name + subgroups.name via items.subgroup_id).
- Para productos con requires_device = false: device_reference queda vacío.
- Para items personalizados, incluye image_sent = true si el cliente ya envió la imagen. Si no la ha enviado, recuérdale antes de crear la orden.
- Confirma al cliente que su pedido fue creado exitosamente con el número de orden.
- IMPORTANTE: NUNCA crees la orden sin tener nombre, teléfono, ciudad, dirección y método de pago.`,
    always_inject: true,
  },
  {
    topic: "flujo_creacion_orden_13",
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
      CREATE TABLE IF NOT EXISTS product_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        product_type_id INTEGER NOT NULL DEFAULT 0,
        price DOUBLE PRECISION NOT NULL DEFAULT 0,
        image_url TEXT NOT NULL DEFAULT '',
        requires_device BOOLEAN NOT NULL DEFAULT false
      );
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        subgroup_id INTEGER NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS subgroups (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'client',
        shipping_city_id INTEGER DEFAULT NULL,
        shipping_address TEXT NOT NULL DEFAULT ''
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
    await client.query("TRUNCATE product_types, products, items, groups, subgroups, users, orders, order_items, chat_history, context, shipping RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE user_identities RESTART IDENTITY CASCADE");

    // Seed product types
    console.log("Seeding product types...");
    const productTypeIdMap = new Map<string, number>();
    for (const pt of productTypes) {
      const res = await client.query("INSERT INTO product_types (name, description, image_url) VALUES ($1, $2, $3) RETURNING id", [pt.name, pt.description, pt.image_url]);
      productTypeIdMap.set(pt.name, res.rows[0].id);
      console.log(`  Created product type: ${pt.name} (id: ${res.rows[0].id})`);
    }

    // Seed groups and subgroups first (items reference subgroup_id)
    console.log("Seeding groups & subgroups...");
    const groupIdMap = new Map<string, number>();
    for (const name of groups) {
      const res = await client.query("INSERT INTO groups (name) VALUES ($1) RETURNING id", [name]);
      groupIdMap.set(name, res.rows[0].id);
      console.log(`  Created group: ${name} (id: ${res.rows[0].id})`);
    }
    const subgroupIdMap = new Map<string, number>(); // key: "Group Sub"
    for (const [groupName, subs] of Object.entries(subgroupsByGroup)) {
      const groupId = groupIdMap.get(groupName)!;
      for (const sub of subs) {
        const res = await client.query("INSERT INTO subgroups (group_id, name) VALUES ($1, $2) RETURNING id", [groupId, sub]);
        subgroupIdMap.set(`${groupName}|${sub}`, res.rows[0].id);
      }
      console.log(`  Created ${subs.length} subgroups for ${groupName}`);
    }

    console.log("Seeding products & items...");
    for (const product of products) {
      const { variants, stock, typeName, ...productData } = product as typeof product & { variants?: { group: string; sub: string; stock: number }[]; stock?: number };
      const productTypeId = productTypeIdMap.get(typeName) ?? 0;
      const pRes = await client.query(
        "INSERT INTO products (name, description, product_type_id, price, image_url, requires_device) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [productData.name, productData.description, productTypeId, productData.price, productData.image_url, productData.requires_device]
      );
      const productId = pRes.rows[0].id;
      console.log(`  Created product: ${productData.name} (id: ${productId})`);

      if (variants && variants.length > 0) {
        for (const v of variants) {
          const subgroupId = subgroupIdMap.get(`${v.group}|${v.sub}`) ?? 0;
          await client.query(
            "INSERT INTO items (product_id, subgroup_id, stock) VALUES ($1, $2, $3)",
            [productId, subgroupId, v.stock]
          );
        }
        console.log(`    Created ${variants.length} item variants`);
      } else {
        // Non-device product: single item with no subgroup
        await client.query(
          "INSERT INTO items (product_id, subgroup_id, stock) VALUES ($1, $2, $3)",
          [productId, 0, stock ?? 0]
        );
        console.log(`    Created 1 item (generic)`);
      }
    }

    console.log("Seeding users...");
    for (const user of users) {
      const res = await client.query(
        "INSERT INTO users (id, name, email, phone, role, shipping_city_id, shipping_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [user.id, user.name, user.email, user.phone, user.role, null, '']
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
