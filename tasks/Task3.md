# Tarea 3: Gestión de subgrupos anidada en Grupos (modales tipo Pedidos)

**Problema:** Actualmente, Grupos y Subgrupos son páginas independientes. En Pedidos ya existe un patrón donde cada fila tiene un botón "Artículos" que abre un modal con CRUD completo de `order_items` anidado. Para unificar la UX, Grupos debería seguir ese mismo patrón para gestionar sus Subgrupos.

**Referencia:** `packages/web/src/modules/orders/Page.tsx` — patrón de modales anidados con `extraActions`, estado local, y modales de listar/agregar/editar/eliminar dentro del `children` de `CrudPage`.

**Cambios en `packages/web/src/modules/groups/Page.tsx`:**

1. **Botón "Subgrupos" por fila:** Agregar prop `extraActions` a `CrudPage` con un botón "Subgrupos" que abra un modal de detalle para el grupo seleccionado.

2. **Modal de lista de subgrupos:** Al hacer clic, abrir un modal `Grupo #{id} - Subgrupos` que:
   - Muestre los subgrupos filtrados por `group_id` usando `subgroupsApi.fetchAll({ group_id })`.
   - Incluya una tabla con columnas: ID, Nombre.
   - Tenga un botón "+ Agregar Subgrupo" que abra el modal de creación.
   - Cada fila tenga botones "Editar" y "Eliminar".

3. **Modal de agregar subgrupo:** Abrir `SubgroupForm` para crear un subgrupo nuevo, pre-inyectando `group_id` del grupo seleccionado (el campo `group_id` no debe ser editable en este contexto).

4. **Modal de editar subgrupo:** Abrir `SubgroupForm` con los datos del subgrupo seleccionado, manteniendo `group_id` fijo.

5. **Modal de eliminar subgrupo:** Confirmación y eliminación vía `subgroupsApi.delete(id)`, recargando la lista después.

6. **Estado local:** Gestionar con `useState` el grupo en vista, lista de subgrupos, subgrupo editando/eliminando, loading y errores — mismo patrón que `OrdersPage`.

**Nota:** La página independiente de Subgrupos (`packages/web/src/modules/subgroups/Page.tsx`) se mantiene tal cual, ya que puede ser útil para ver todos los subgrupos globalmente.
