/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import { AsyncLocalStorage } from "async_hooks";
import { IncomingMessage, ServerResponse } from "http";
import Koa from "koa";
import koaCompose from "koa-compose";
import { Helper } from "koatty_lib";
import { DefaultLogger as Logger } from "koatty_logger";
import { Trace } from "koatty_trace";
import onFinished from "on-finished";
import { createKoattyContext } from "./Context";
import {
  AppEvent,
  InitOptions,
  KoattyApplication,
  KoattyRouter, KoattyServer
} from "./IApplication";
import { KoattyContext, RequestType, ResponseType } from "./IContext";
import { KoattyMetadata } from "./Metadata";
import { asyncEvent, bindProcessEvent, isPrevent, parseExp } from "./Utils";

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
    return this.use(parseExp(fn));
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
      caches[type] = caches[type] || {};
      if (name === undefined) return caches[type];

      if (Helper.isString(name)) {
        const keys = name.split('.');
        return keys.length === 1 ? caches[type][name] : caches[type][keys[0]]?.[keys[1]];
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
  public createContext(req: RequestType, res: ResponseType, protocol = "http"): any {
    const resp = ['ws', 'wss', 'grpc'].includes(protocol) ?
      new ServerResponse(<IncomingMessage>req) : res;
    // create context
    const context = super.createContext(req as IncomingMessage, resp as ServerResponse);
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
    const callbackFuncAndEmit = () => {
      Logger.Log('Koatty', '', 'Emit App Start ...');
      asyncEvent(this, AppEvent.appStart);
      listenCallback?.(this);
    };
    const startServer = (s: KoattyServer, isLast: boolean) => {
      s.Start(isLast ? callbackFuncAndEmit : () => Logger.Log('Koatty', '', `Server ${s.options.protocol} Started.`));
    };
    if (Array.isArray(this.server)) {
      this.server.forEach((s, i) => { startServer(s, i === (<KoattyServer[]>this.server).length - 1) });
    } else {
      this.server.Start(callbackFuncAndEmit);
    }
    // binding event "appStop"
    Logger.Log('Koatty', '', 'Bind App Stop event ...');
    bindProcessEvent(this, 'appStop');
    return null;
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
    // inject response processed and opentrace
    this.middleware.unshift(this.handleResponse());
    // req handler from router 
    if (reqHandler) {
      this.middleware.push(reqHandler);
    }
    const fn = koaCompose(this.middleware);
    if (!this.listenerCount('error')) this.on('error', this.onerror);

    return (req: RequestType, res: ResponseType) => {
      const ctx: any = this.createContext(req, res, protocol);
      if (!this.ctxStorage) {
        return this.handleRequest(ctx, fn);
      }
      return this.ctxStorage.run(ctx, async () => {
        return this.handleRequest(ctx, fn);
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
  ): Promise<any> {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = (err: Error) => ctx.onerror(err);
    // const handleResponse = () => respond(ctx);
    onFinished(res, onerror);
    return fnMiddleware(ctx).catch(onerror);
    // return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }
  /**
   * @description: handle Response & opentrace
   * @return {*}
   */
  private handleResponse() {
    const timeout = (this.config('http_timeout') || 10) * 1000;
    const encoding = this.config('encoding') || 'utf-8';
    const openTrace = this.config("open_trace") || false;
    const asyncHooks = this.config("async_hooks") || false;

    const options = {
      RequestIdHeaderName: this.config('trace_header') || 'X-Request-Id',
      RequestIdName: this.config('trace_id') || "requestId",
      Timeout: timeout,
      Encoding: encoding,
      OpenTrace: openTrace,
      AsyncHooks: asyncHooks,
    }
    // used trace middleware
    return Trace(options, <any>this);
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
