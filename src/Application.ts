/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import Koa from "koa";
import { Helper } from "koatty_lib";
import { DefaultLogger as Logger } from "koatty_logger";
import { isPrevent } from "koatty_exception";
import { CreateContext } from "./Context";
import { KoattyMetadata } from "./Metadata";
import { KoattyContext } from "./IContext";
import { Application, Container } from "koatty_container";
import {
    InitOptions,
    KoattyRouter, KoattyServer
} from "./IApplication";

/**
 * Application 
 * @export
 * @class Koatty
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Koatty extends Koa implements Application {
    public env: string;
    public version: string;
    public options: InitOptions;
    public container: Container;
    public server: KoattyServer;
    public router: KoattyRouter;

    public appPath: string;
    public rootPath: string;
    public thinkPath: string;
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
        thinkPath: '',
    }) {
        super();
        this.options = options ?? {};
        this.env = process.env.KOATTY_ENV || process.env.NODE_ENV;
        const { appDebug, appPath,
            rootPath, thinkPath } = this.options;
        this.appDebug = appDebug;
        this.appPath = appPath;
        this.rootPath = rootPath;
        this.thinkPath = thinkPath;
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
    setMetaData(key: string, value: any): any {
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
    getMetaData(key: string): any {
        // private
        if (key.startsWith("_")) {
            return Reflect.get(this, key);
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
            const caches = this.getMetaData('_configs') ?? {};
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
        return CreateContext(this, this.context, req, res, protocol);
    }

    /**
     * listening and start server
     *
     * @param {Function} server KoattyServer
     * @param {Function} [listeningListener] () => void
     * @returns {void}  void
     * @memberof Koatty
     */
    public listen(server: any, listeningListener?: any): any {
        return server.Start(listeningListener);
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