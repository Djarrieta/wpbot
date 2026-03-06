import { Repository } from '../core/repository';
import type { CrudController } from '../core/types';
import type { Item } from '../services/itemsSQLite';
import type { ItemsSQLite } from '../services/itemsSQLite';

export class ItemsController implements CrudController {
  private itemsService: Repository<Item>;

  constructor(itemsService: Repository<Item>) {
    this.itemsService = itemsService;
  }

  /**
   * Build a system prompt with assistant capabilities and schema information
   */
  buildPrompt(userMessage: string): string {
    const schemaText = (this.itemsService as ItemsSQLite).text?.() ?? 
      '{id: number, name: string, quantity: number}';
    
    return `
Eres un asistente de base de datos SQLite. Tienes las siguientes capacidades:

HERRAMIENTAS DISPONIBLES:
- read_query: Ejecutar consultas SELECT para leer datos de la base de datos
- write_query: Ejecutar consultas INSERT, UPDATE, DELETE para modificar datos
- create_table: Crear nuevas tablas en la base de datos
- list_tables: Listar todas las tablas disponibles
- describe_table: Obtener el esquema de una tabla específica

ESQUEMA DE LA BASE DE DATOS:
Hay una tabla llamada "items" con las siguientes columnas:
${schemaText}

INSTRUCCIONES:
- Responde siempre en español
- Usa las herramientas disponibles para consultar o modificar la base de datos
- Formatea los resultados de manera clara y legible

MENSAJE DEL USUARIO:
${userMessage}

RESPUESTA DEL ASISTENTE:
`;
  }

  /**
   * GET /items - Get all items
   */
  async getAll(_req: Request): Promise<Response> {
    const items = this.itemsService.getAll();
    return Response.json(items);
  }

  /**
   * GET /items/:id - Get item by ID
   */
  async getById(req: Request, id: number): Promise<Response> {
    const item = this.itemsService.getById(id);
    if (!item) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }
    return Response.json(item);
  }

  /**
   * POST /items - Create new item
   */
  async create(req: Request): Promise<Response> {
    try {
      const body = await req.json() as Omit<Item, 'id'>;
      
      if (!body.name || body.quantity === undefined) {
        return Response.json(
          { error: 'name and quantity are required' },
          { status: 400 }
        );
      }

      const item = this.itemsService.create({
        name: body.name,
        quantity: body.quantity,
      });
      
      return Response.json(item, { status: 201 });
    } catch (error) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  /**
   * PUT /items/:id - Update item
   */
  async update(req: Request, id: number): Promise<Response> {
    try {
      const body = await req.json() as Partial<Omit<Item, 'id'>>;
      const item = this.itemsService.update(id, body);
      
      if (!item) {
        return Response.json({ error: 'Item not found' }, { status: 404 });
      }
      
      return Response.json(item);
    } catch (error) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  /**
   * DELETE /items/:id - Delete item
   */
  async delete(_req: Request, id: number): Promise<Response> {
    const deleted = this.itemsService.delete(id);
    
    if (!deleted) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return Response.json({ success: true });
  }
}
