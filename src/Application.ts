/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import EventEmitter from "events";
import { ServerResponse } from "http";
import Koa from "koa";
import koaCompose from "koa-compose";
import { isPrevent } from "koatty_exception";
import { Helper } from "koatty_lib";
import { DefaultLogger as Logger } from "koatty_logger";
import onFinished from "on-finished";
import { createKoattyContext } from "./Context";
import {
  AppEvent,
  InitOptions,
  KoattyApplication,
  KoattyRouter, KoattyServer
} from "./IApplication";
import { KoattyContext } from "./IContext";
import { KoattyMetadata } from "./Metadata";

/**
 * Application 
 * @export
 * @class Koatty
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Koatty extends Koa implements KoattyApplication {
  // runtime env mode
  public env: string;
  // app name
  public name: string;
  // app version
  public version: string;
  // app options
  public options: InitOptions;
  public server: KoattyServer | KoattyServer[];
  public router: KoattyRouter;
  // env var
  public appPath: string;
  public rootPath: string;
  // koatty framework path
  public koattyPath: string;
  public logsPath: string;
  public appDebug: boolean;

  public context: KoattyContext;
  private metadata: KoattyMetadata;

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
   * @param {string} [protocol]
   * @returns {KoattyContext}  {*}
   * @memberof Koatty
   */
  public createContext(req: any, res: any, protocol?: string): KoattyContext {
    const resp = ['ws', 'wss', 'grpc'].includes(protocol ?? 'http') ? new ServerResponse(req) : res;
    // create context
    const context = super.createContext(req, resp);
    Helper.define(context, "app", this);
    return createKoattyContext(context, protocol, req, res);
  }

  /**
   * listening and start server
   *
   * @param {Function} [listenCallback] (app: Koatty) => void
   * @returns {*}  any
   * @memberof Koatty
   */
  public listen(listenCallback?: any): any {
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
  callback(protocol = "http", reqHandler?: (ctx: KoattyContext) => Promise<any>) {
    if (reqHandler) {
      this.middleware.push(reqHandler);
    }
    const fn = koaCompose(this.middleware);
    return (req: unknown, res: unknown) => {
      const context = this.createContext(req, res, protocol);
      return this.handleRequest(context, fn);
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
    return fnMiddleware(ctx);
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


/**
 * Convert express middleware for koa
 *
 * @param {function} fn
 * @returns
 * @memberof Koatty
 */
function parseExp(fn: Function) {
  return function (ctx: KoattyContext, next: Function) {
    if (fn.length < 3) {
      fn(ctx.req, ctx.res);
      return next();
    }
    return new Promise((resolve, reject) => {
      fn(ctx.req, ctx.res, (err: Error) => {
        if (err) return reject(err);
        resolve(next());
      });
    });
  };
}
/**
 * Execute event as async
 * 
 * @param {EventEmitter} event
 * @param {string} eventName
 * @return {*}
 */
async function asyncEvent(event: EventEmitter, eventName: string) {
  const listeners = event.listeners(eventName);
  for (const func of listeners) {
    if (Helper.isFunction(func)) await func();
  }
  return event.removeAllListeners(eventName);
}