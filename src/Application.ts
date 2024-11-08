/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import { AsyncLocalStorage } from "async_hooks";
import { ServerResponse } from "http";
import Koa from "koa";
import koaCompose from "koa-compose";
import { Helper } from "koatty_lib";
import { DefaultLogger as Logger } from "koatty_logger";
import onFinished from "on-finished";
import {
  AppEvent,
  InitOptions,
  KoattyApplication,
  KoattyProtocol,
  KoattyRouter, KoattyServer
} from "./IApplication";
import { KoattyContext, RequestType, ResponseType } from "./IContext";
import { KoattyMetadata } from "./Metadata";
import { asyncEvent, isPrevent, parseExp } from "./Utils";

/**
 * Koatty Application 
 * @export
 * @class Koatty
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Koatty extends Koa implements KoattyApplication {
  // runtime env mode
  public env: string = "development";
  // app name
  public name: string;
  // app version
  public version: string;
  // app options
  public options: InitOptions;
  public server: KoattyServer;
  public router: KoattyRouter;
  // env var
  public appPath: string;
  public rootPath: string;
  // koatty framework path
  public koattyPath: string;
  public logsPath: string;
  public appDebug: boolean;

  public context: KoattyContext = {} as any;
  private metadata: KoattyMetadata;
  private ctxStorage: AsyncLocalStorage<unknown>;

  /**
   * Creates an instance of Koatty.
   * @param {InitOptions} options
   * @memberof Koatty
   */
  protected constructor(options: InitOptions = {
    appDebug: true,
    appPath: '',
    rootPath: '',
    koattyPath: '',
  }) {
    super();
    this.options = options ?? {};
    this.name = options.name;
    this.version = options.version;
    this.env = process.env.KOATTY_ENV || process.env.NODE_ENV;
    const { appDebug, appPath, rootPath, koattyPath } = this.options;
    this.appDebug = appDebug;
    this.appPath = appPath;
    this.rootPath = rootPath;
    this.koattyPath = koattyPath;
    this.metadata = new KoattyMetadata();
    this.ctxStorage = new AsyncLocalStorage();
    // constructor
    this.init();
    // catch error
    this.captureError();
  }

  /**
   * app custom init, must be defined options
   */
  public init(): void { }

  /**
   * Set application metadata
   *
   * @param {string} key
   * @param {*} value
   * @memberof Koatty
   */
  setMetaData(key: string, value: any) {
    // private
    if (key.startsWith("_")) {
      Helper.define(this, key, value);
      return;
    }
    this.metadata.set(key, value);
  }

  /**
   * Get application metadata by key
   *
   * @param {string} key
   * @memberof Koatty
   */
  getMetaData(key: string): any[] {
    // private
    if (key.startsWith("_")) {
      const data = Reflect.get(this, key);
      if (Helper.isTrueEmpty(data)) {
        return [];
      }
      return [data];
    }
    return this.metadata.get(key);
  }

  /**
   * Use the given koa middleware `fn`.
   * support generator func
   * @param {Function} fn
   * @returns {any}
   * @memberof Koatty
   */
  public use(fn: Function): any {
    if (!Helper.isFunction) {
      Logger.Error('The paramter is not a function.');
      return;
    }
    return super.use(<any>fn);
  }

  /**
   * Use the given Express middleware `fn`.
   *
   * @param {function} fn
   * @returns {any}
   * @memberof Koatty
   */
  public useExp(fn: Function): any {
    if (!Helper.isFunction) {
      Logger.Error('The paramter is not a function.');
      return;
    }
    fn = parseExp(fn);
    return this.use(fn);
  }

  /**
   * Read app configuration
   *
   * @param {any} name
   * @param {string} [type="config"]
   * @memberof Koatty
   */
  public config(name: string, type = 'config') {
    try {
      const caches = this.getMetaData('_configs')[0] || {};
      if (!caches[type]) caches[type] = {};
      if (name === undefined) return caches[type];
      if (Helper.isString(name)) {
        return name.indexOf('.') === -1 ? caches[type][name] : caches[type][name.split('.')[0]]?.[name.split('.')[1]];
      }
      return caches[type][name];
    } catch (err) {
      Logger.Error(err);
      return null;
    }
  }

  /**
   * Create Context for every request 
   *
   * @param {*} req
   * @param {*} res
   * @param {KoattyProtocol} [protocol]
   * @returns {KoattyContext}  {*}
   * @memberof Koatty
   */
  public createContext(req: any, res: any, protocol: KoattyProtocol = KoattyProtocol.HTTP): any {
    const resp = ['ws', 'wss', 'grpc'].includes(protocol) ? new ServerResponse(req) : res;
    // create context
    const context = super.createContext(req, resp);
    return context;
    // Helper.define(context, "app", this);
    // return createKoattyContext(context, protocol, req, res);
  }

  /**
   * listening and start server
   *
   * @param {Function} [listenCallback] (app: Koatty) => void
   * @returns {*}  any
   * @memberof Koatty
   */
  public listen(listenCallback?: any): any {
    // super.listen()
    const callback = () => {
      // Emit app started event
      Logger.Log('Koatty', '', 'Emit App Start ...');
      asyncEvent(this, AppEvent.appStart);
      listenCallback(this);
    };
    return (<KoattyServer>this.server).Start(callback);
  }

  /**
   * return a request handler callback
   * for http/gRPC/ws server.
   *
   * @param {KoattyProtocol} [protocol] 
   * @param {(ctx: KoattyContext) => Promise<any>} [reqHandler]
   * @returns {*}  
   * @memberof Koatty
   */
  callback(protocol = KoattyProtocol.HTTP, reqHandler?: (ctx: KoattyContext) => Promise<any>) {
    // super.callback()
    if (reqHandler) {
      this.middleware.push(reqHandler);
    }
    const fn = koaCompose(this.middleware);
    if (!this.listenerCount('error')) this.on('error', this.onerror);

    return (req: RequestType, res: ResponseType) => {
      const context = this.createContext(req, res, protocol);
      if (!this.ctxStorage) {
        return this.handleRequest(context, fn);
      }
      return this.ctxStorage.run(context, async () => {
        return await this.handleRequest(context, fn);
      });
    }
  }

  /**
   * Handle request in callback.
   *
   * @private
   * @param {KoattyContext} ctx
   * @param {(ctx: KoattyContext) => Promise<any>} fnMiddleware
   * @returns {*}  
   * @memberof Koatty
   */
  private async handleRequest(
    ctx: KoattyContext,
    fnMiddleware: (ctx: KoattyContext) => Promise<any>,
  ) {
    const res = ctx.res;
    res.statusCode = 404;
    onFinished(ctx.res, (err: Error) => ctx.onerror(err));
    const handleResponse = (ctx: any) => {
      console.log(ctx.body);
    };
    return fnMiddleware(ctx).then(handleResponse).catch((err: Error) => ctx.onerror(err));
    // return fnMiddleware(ctx);
  }

  /**
   * registration exception handling
   *
   * @memberof Koatty
   */
  private captureError(): void {
    // koa error
    this.removeAllListeners('error');
    this.on('error', (err: Error) => {
      if (!isPrevent(err)) Logger.Error(err);
    });
    // warning
    process.removeAllListeners('warning');
    process.on('warning', Logger.Warn);
    // promise reject error
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', (reason: Error) => {
      if (!isPrevent(reason)) Logger.Error(reason);
    });
    // uncaught exception
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', (err) => {
      if (err.message.includes('EADDRINUSE')) {
        Logger.Error(Helper.toString(err));
        process.exit(-1);
      }
      if (!isPrevent(err)) Logger.Error(err);
    });
  }
}

// const properties = ["constructor", "init"];
// export const Koatty = new Proxy(Application, {
//     set(target, key, value, receiver) {
//         if (Reflect.get(target, key, receiver) === undefined) {
//             return Reflect.set(target, key, value, receiver);
//         } else if (key === "init") {
//             return Reflect.set(target, key, value, receiver);
//         } else {
//             throw Error("Cannot redefine getter-only property");
//         }
//     },
//     deleteProperty(target, key) {
//         throw Error("Cannot delete getter-only property");
//     },
//     construct(target, args, newTarget) {
//         Reflect.ownKeys(target.prototype).map((n) => {
//             if (newTarget.prototype.hasOwnProperty(n) && !properties.includes(Helper.toString(n))) {
//                 throw Error(`Cannot override the final method '${Helper.toString(n)}'`);
//             }
//         });
//         return Reflect.construct(target, args, newTarget);
//     }
// });
