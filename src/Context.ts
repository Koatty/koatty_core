/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2021-11-23 11:45:38
 */
import Koa from "koa";
import * as Helper from "koatty_lib";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { KoattyMetadata } from "./Metadata";
import { IRpcServerUnaryCall, KoattyContext } from "./IContext";
import { KoattyLogger } from "./IApplication";


/**
 * initialize Context
 *
 * @param {Koa.Context} ctx
 * @param {KoattyLogger} logger
 * @returns {*}  {KoattyContext}
 */
function initBaseContext(ctx: Koa.Context, logger: KoattyLogger): KoattyContext {
    const context: KoattyContext = Object.create(ctx);
    // throw
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
    // logger
    context.logger = logger;

    // metadata
    context.metadata = new KoattyMetadata();
    // getMetaData
    context.getMetaData = function (key: string) {
        const value = context.metadata.get(key);
        if (value.length === 1) {
            return value[0];
        }
        return value;
    };

    // setMetaData
    context.setMetaData = function (key: string, value: any) {
        context.metadata.set(key, value);
    };

    // sendMetadata
    context.sendMetadata = function (data: KoattyMetadata) {
        context.set(data.toJSON());
    };

    return context;
}

/**
 * Create KoattyContext
 *
 * @param {Koa.Context} ctx
 * @param {KoattyLogger} logger
 * @returns {*}  {KoattyContext}
 */
export function CreateContext(ctx: Koa.Context, logger: KoattyLogger): KoattyContext {
    return initBaseContext(ctx, logger);
}

/**
 * Create KoattyGrpcContext
 *
 * @export
 * @param {IRpcServerCall<any, any>} call
 * @param {IRpcServerCallback<any>} [callback]
 * @param {KoattyLogger} logger
 * @returns {*}  {KoattyGrpcContext}
 */
export function CreateGrpcContext(ctx: Koa.Context, call: IRpcServerUnaryCall<any, any>, logger: KoattyLogger): KoattyContext {
    const context = initBaseContext(ctx, logger);
    // context.call = call;
    Helper.define(context, "call", call);
    // metadata
    context.metadata = KoattyMetadata.from(call.metadata.toJSON());

    if (context.call) {
        let handler: any = {};
        if (Object.hasOwnProperty.call(context.call, "handler")) {
            handler = Reflect.get(context.call, "handler") || {};
        } else if (Object.hasOwnProperty.call(context.call, "call")) {
            const call = Reflect.get(context.call, "call") || {};
            handler = call.handler || {};
        }
        const cmd = handler.path || '';
        // originalPath
        context.setMetaData("originalPath", cmd);
    }
    context.setMetaData("_body", call.request);

    // sendMetadata
    context.sendMetadata = function (data: KoattyMetadata) {
        context.call.sendMetadata(data);
    };

    return context;
}

/**
 * Create KoattyWsContext
 *
 * @export
 * @param {KoattyContext} ctx
 * @param {Buffer | ArrayBuffer | Buffer[]} data
 * @param {KoattyLogger} logger
 * @returns {*}  {KoattyContext}
 */
export function CreateWsContext(ctx: Koa.Context, data: Buffer | ArrayBuffer | Buffer[], logger: KoattyLogger): KoattyContext {
    const context = initBaseContext(ctx, logger);

    context.setMetaData("_body", data.toString());

    return context;
}