export type Handler = (req: Request) => Response | Promise<Response>;

export interface Route {
  method: string;
  pathname: string;
  handler: Handler;
}
