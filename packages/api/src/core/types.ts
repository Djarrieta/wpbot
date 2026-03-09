import type { GenericCrudController } from './crudController';
import type { BaseEntity } from './repository';

export type Handler = (req: Request) => Response | Promise<Response>;
export type ParamHandler = (req: Request, id: number) => Response | Promise<Response>;

export interface Route {
  method: string;
  pathname: string;
  handler: Handler;
}

export interface CrudController {
  getAll: Handler;
  create: Handler;
  getById: ParamHandler;
  update: ParamHandler;
  delete: ParamHandler;
}

export interface ResourceRoute {
  basePath: string;
  controller: GenericCrudController<BaseEntity>;
}
