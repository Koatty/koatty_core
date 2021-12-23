/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2021-12-23 10:38:41
 */
import Koa from "koa";
import { WebSocket } from "ws";
import { Helper } from "koatty_lib";
import { KoattyMetadata } from "./Metadata";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { IRpcServerCallback, IRpcServerUnaryCall, KoattyContext } from "./IContext";

// DefaultContext
type DefaultContext = Koa.BaseContext & Koa.DefaultContext;


/**
 * initialize Base Context
 *
 * @param {Koatty} app
 * @param {DefaultContext} ctx
 * @returns {*}  {KoattyContext}
 */
function initBaseContext(ctx: DefaultContext): KoattyContext {
    const context = Object.create(ctx);
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
 *  Create KoattyContext
 *
 * @export
 * @param {DefaultContext} ctx
 * @param {*} req
 * @param {*} res
 * @returns {*}  {KoattyContext}
 */
export function CreateContext(ctx: DefaultContext, req: any, res: any): KoattyContext {
    return initBaseContext(ctx);
}

/**
 * Create Koatty gRPC Context
 *
 *
 * @param {DefaultContext} ctx
 * @param {IRpcServerUnaryCall<any, any>} call
 * @param {IRpcServerCallback<any>} rpcCallback
 * @returns {*}  {KoattyContext}
 */
export function CreateGrpcContext(ctx: DefaultContext, call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>): KoattyContext {
    const context = initBaseContext(ctx);
    context.status = 200;
    // 
    Helper.define(context, "rpc", {
        call,
        callback
    });
    // metadata
    context.metadata = KoattyMetadata.from(call.metadata.toJSON());

    if (call) {
        let handler: any = {};
        if (Object.hasOwnProperty.call(call, "handler")) {
            handler = Reflect.get(call, "handler") || {};
        } else if (Object.hasOwnProperty.call(call, "call")) {
            const called = Reflect.get(call, "call") || {};
            handler = called.handler || {};
        }
        const cmd = handler.path || '';
        // originalPath
        context.setMetaData("originalPath", cmd);
        // payload
        context.setMetaData("_body", call.request || {});
        // sendMetadata
        context.sendMetadata = function (data: KoattyMetadata) {
            call.sendMetadata(data);
        };
    }

    return context;
}


/**
 * Create Koatty Websocket Context
 *
 * @param {DefaultContext} ctx
 * @param {(Buffer | ArrayBuffer | Buffer[])} data
 * @param {WebSocket} socket
 * @returns {*}  {KoattyContext}
 */
export function CreateWsContext(ctx: DefaultContext, data: Buffer | ArrayBuffer | Buffer[], socket: WebSocket): KoattyContext {
    const context = initBaseContext(ctx);
    context.status = 200;
    Helper.define(context, "websocket", socket);
    context.setMetaData("_body", data.toString());

    return context;
}