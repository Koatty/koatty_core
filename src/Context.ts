/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2021-07-13 10:25:16
 */
import Koa from "koa";
import { Context } from "koatty_container";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_trace";

/**
 * AppContext
 */
type AppContext = Koa.Context & Context;

/**
 * Koatty Context.
 *
 * @export
 * @interface KoattyContext
 * @extends {Koa.Context}
 */
export interface KoattyContext extends AppContext {
    /**
     * state
     *
     * @type {Koa.DefaultState}
     * @memberof KoattyContext
     */
    state: any;
    /**
     * Request body parser
     *
     * @memberof KoattyContext
     */
    bodyParser: () => Promise<Object>;

    /**
     * QueryString parser
     *
     * @memberof KoattyContext
     */
    queryParser: () => Object;
    /**
     * Replace ctx.throw
     *
     * @type {(status: number, message?: string)}
     * @type {(message: string, code?: number, status?: HttpStatusCode)}
     * @memberof Context
     */
    throw(status: number, message?: string): never;
    throw(message: string, code?: number, status?: any): never;
    /**
    * context metadata
    *
    * @memberof Context
    */
    getMetaData: (key: string) => unknown;
    setMetaData: (key: string, value: unknown) => Map<string, unknown>;
}
/**
 * KoattyNext
 */
export type KoattyNext = Koa.Next;

/**
 * Create KoattyContext
 *
 * @param {Koa.Context} ctx
 * @returns {*}  {KoattyContext}
 */
export function CreateContext(ctx: Koa.Context): KoattyContext {
    const context = Object.create(ctx);
    context.throw = function (statusOrMessage: HttpStatusCode | string,
        codeOrMessage: string | number = 1, status?: HttpStatusCode): never {
        if (typeof statusOrMessage !== "string") {
            if (HttpStatusCodeMap.has(statusOrMessage)) {
                status = statusOrMessage;
                statusOrMessage = HttpStatusCodeMap.get(statusOrMessage);
            }
        }
        if (typeof codeOrMessage === "string") {
            statusOrMessage = codeOrMessage;
            codeOrMessage = 1;
        }
        throw new Exception(<string>statusOrMessage, codeOrMessage, status);
    };
    Reflect.defineProperty(context, '_caches', {
        value: {},
        writable: true,
        configurable: false,
        enumerable: false,
    });
    context.getMetaData = function (key: string) {
        return context._caches[key];
    };
    context.setMetaData = function (key: string, value: any) {
        context._caches[key] = value;
    };
    return context;
}