/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import Koa from "koa";
import EventEmitter from "events";
import { Helper } from "koatty_lib";
import koaCompose from "koa-compose";
import onFinished from "on-finished";
import { DefaultLogger as Logger } from "koatty_logger";
import { isPrevent } from "koatty_exception";
import { CreateContext } from "./Context";
import { KoattyMetadata } from "./Metadata";
import { KoattyContext } from "./IContext";
import { Application } from "koatty_container";
import {
  AppEvent,
  InitOptions,
  KoattyRouter, KoattyServer
} from "./IApplication";
import { ServerResponse } from "http";

/**
 * Application 
 * @export
 * @class Koatty
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Koatty extends Koa implements Application {
  // runtime env mode
  public env: string;
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
  public koattyPath: string;
  public logsPath: string;
  public appDebug: boolean;

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
      const data = this.getMetaData('_configs') || [];
      const caches = data[0] || {};
      // tslint:disable-next-line: no-unused-expression
      caches[type] ?? (caches[type] = {});
      if (name === undefined) {
        return caches[type];
      }
      if (Helper.isString(name)) {
        // name不含. 一级
        if (name.indexOf('.') === -1) {
          return caches[type][name];
        }  // name包含. 二级
        const keys = name.split('.');
        const value = caches[type][keys[0]] ?? {};
        return value[keys[1]];
      }
      return caches[type][name];
    } catch (err) {
      Logger.Error(err);
      return null;
    }
  }

  /**
   * Create Context
   *
   * @param {*} req
   * @param {*} res
   * @param {string} [protocol]
   * @returns {KoattyContext}  {*}
   * @memberof Koatty
   */
  public createContext(req: any, res: any, protocol?: string): KoattyContext {
    let resp;
    // protocol
    protocol = protocol ?? 'http';

    if (['ws', 'wss', 'grpc'].includes(protocol)) {
      resp = new ServerResponse(req);
    } else {
      resp = res;
    }
    // create context
    const context = super.createContext(req, resp);

    Helper.define(context, "protocol", protocol);
    return CreateContext(context, req, res);
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
      // 
      listenCallback(this);
    };
    return this.server.Start(callback);
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
    const onerror = (err: Error) => ctx.onerror(err);
    onFinished(res, onerror);
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
      if (!isPrevent(err)) {
        Logger.Error(err);
      }
      return;
    });
    // warning
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
      Logger.Warn(warning);
      return;
    });

    // promise reject error
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', (reason: Error) => {
      if (!isPrevent(reason)) {
        Logger.Error(reason);
      }
      return;
    });
    // uncaught exception
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', (err) => {
      if (err.message.indexOf('EADDRINUSE') > -1) {
        Logger.Error(Helper.toString(err));
        process.exit(-1);
      }
      if (!isPrevent(err)) {
        Logger.Error(err);
      }
      return;
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
        if (err) {
          reject(err);
        } else {
          resolve(next());
        }
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
  const ls: any[] = event.listeners(eventName);
  // eslint-disable-next-line no-restricted-syntax
  for await (const func of ls) {
    if (Helper.isFunction(func)) {
      func();
    }
  }
  return event.removeAllListeners(eventName);
}