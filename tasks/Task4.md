# Tarea 4: Flujo completo de creación de orden desde la tienda web

**Problema:** Actualmente el checkout en `StorePage` solo pide ciudad y dirección de envío. No valida que el usuario tenga nombre y teléfono completos, ni permite seleccionar método de pago. La orden se crea con `payment_method: ''` y sin garantizar datos de contacto mínimos.

**Objetivo:** Garantizar que al momento de confirmar un pedido, toda la información necesaria esté presente — tanto la del usuario (nombre, teléfono) como la de la orden (dirección de envío, ciudad, método de pago). El flujo debe verificar y solicitar datos faltantes antes de permitir la confirmación.

---

## Análisis del modelo actual

**Datos del usuario** (`users` table):

- `name` (TEXT, nullable) — puede estar vacío si se creó vía OAuth sin nombre
- `phone` (TEXT, nullable) — generalmente vacío para usuarios web
- `email` (TEXT, nullable) — generalmente presente vía Google OAuth

**Datos de la orden** (`orders` table):

- `shipping_city` (TEXT) — ya se pide en checkout
- `shipping_address` (TEXT) — ya se pide en checkout
- `payment_method` (TEXT) — existe en el schema pero se guarda como `''`
- `collected_info` (JSONB) — campo flexible para metadata adicional

**Conclusión:** El nombre y teléfono son datos del **usuario** (se persisten en `users` y se reutilizan en futuras órdenes). La dirección de envío, ciudad y método de pago son datos de la **orden** (pueden cambiar por pedido).

---

## Cambios

### 1. API: Endpoint para actualizar perfil del usuario autenticado

**Archivo:** `packages/api/src/router.ts`

Nuevo endpoint `PUT /api/store/profile` (autenticado):

- Recibe `{ name, phone }` en el body.
- Valida que ambos campos sean strings no vacíos.
- Actualiza el usuario con `usersService.update(userId, { name, phone })`.
- Retorna el usuario actualizado.

Este endpoint permite que un cliente actualice su propio perfil sin ser admin.

### 2. API: Endpoint para obtener perfil del usuario autenticado

**Archivo:** `packages/api/src/router.ts`

Nuevo endpoint `GET /api/store/profile` (autenticado):

- Retorna los datos del usuario autenticado: `{ id, name, email, phone }`.
- Se usa para verificar si el perfil está completo antes del checkout.

### 3. API: Agregar `payment_method` al crear orden

**Archivo:** `packages/api/src/router.ts`

Modificar el handler de `POST /api/store/order`:

- Aceptar `payment_method` en el body (obligatorio).
- Validar que sea uno de los valores permitidos: `'contraentrega'`, `'transferencia'`.
- Guardar en la orden en lugar de `''`.

### 4. Web: Flujo de checkout con verificación de perfil

**Archivo:** `packages/web/src/pages/StorePage.tsx`

Modificar el flujo cuando el usuario hace clic en "Continuar con el pedido" (botón del carrito):

**Paso 1 — Verificar autenticación:**

- Ya existe: si no hay `user`, redirige a `/login`. Esto se hace al agregar al carrito, pero también validar al hacer checkout por si la sesión expiró.

**Paso 2 — Verificar perfil completo:**

- Llamar a `GET /api/store/profile` para obtener los datos actuales del usuario.
- Si falta `name` o `phone`, abrir un **modal de completar perfil** antes del checkout.
- El modal muestra campos para nombre y teléfono (pre-llenados si ya tienen valor).
- Al guardar, llama a `PUT /api/store/profile` y continúa al checkout.
- Si el perfil ya está completo, saltar directamente al checkout.

**Paso 3 — Checkout (modal existente, ampliado):**

- Agregar selector de método de pago con opciones: "Contraentrega", "Transferencia bancaria".
- Mantener los campos existentes: ciudad de envío, dirección de envío.
- Enviar `payment_method` junto con el resto del body a `POST /api/store/order`.

### 5. Web: Componente `ProfileModal`

**Archivo:** `packages/web/src/pages/StorePage.tsx` (componente interno, mismo archivo)

Nuevo componente `ProfileModal`:

- Campos: Nombre (text input, requerido), Teléfono (tel input, requerido).
- Pre-llena con datos existentes del usuario.
- Botón "Guardar y continuar" que llama a `PUT /api/store/profile`.
- Al éxito, cierra el modal y abre el `CheckoutModal`.
- Estilo consistente con los modales existentes en la página.

---

## Flujo completo resumido

```
Usuario navega la tienda
  → Agrega productos al carrito (si no está logueado → redirige a /login)
  → Abre carrito → "Continuar con el pedido"
  → Fetch GET /api/store/profile
  → ¿Falta nombre o teléfono?
      SÍ → Abrir ProfileModal → usuario llena datos → PUT /api/store/profile → continuar
      NO → continuar
  → Abrir CheckoutModal (con campo de método de pago agregado)
  → Usuario selecciona ciudad, escribe dirección, elige método de pago
  → "Confirmar pedido" → POST /api/store/order (con payment_method)
  → Orden creada → modal de éxito
```

---

## Notas

- Los métodos de pago se definen como constantes para facilitar su extensión futura. Por ahora: `contraentrega`, `transferencia`.
- No se requiere cambio de schema en la base de datos: `payment_method` ya existe en `orders` y `name`/`phone` ya existen en `users`.
- El `collected_info` JSONB queda disponible para futuras extensiones (ej: datos de transferencia, comprobante, etc.) pero no se usa en esta tarea.
