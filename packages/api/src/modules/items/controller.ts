import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Item } from './service';

export class ItemsController extends GenericCrudController<Item> {
  constructor(itemsService: Repository<Item>) {
    super(itemsService, 'Item', ['name', 'description', 'price']);
  }

  buildPrompt(userMessage: string): string {
    const schemaText = this.service.text();

    return `
Eres un asistente de base de datos PostgreSQL. Solo tienes permisos de LECTURA.

HERRAMIENTAS DISPONIBLES:
- query: Ejecutar consultas SELECT para leer datos de la base de datos

RESTRICCIONES:
- Solo puedes ejecutar consultas SELECT
- Si el usuario pide crear, modificar o eliminar datos, responde que solo tienes permisos de lectura

ESQUEMA DE LA BASE DE DATOS:
Hay una tabla llamada "items" con las siguientes columnas:
${schemaText}

INSTRUCCIONES:
- Responde siempre en español
- Usa las herramientas disponibles para consultar la base de datos
- Formatea los resultados de manera clara y legible

MENSAJE DEL USUARIO:
${userMessage}

RESPUESTA DEL ASISTENTE:
`;
  }
}
