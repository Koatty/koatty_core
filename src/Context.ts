/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2021-12-18 22:59:13
 */
import Koa from "koa";
import { WebSocket } from "ws";
import { Helper } from "koatty_lib";
import { ServerResponse } from "http";
import { Koatty } from "./Application";
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
 * @param {Koa.BaseRequest} req
 * @param {ServerResponse} res
 * @returns {*}  {KoattyContext}
 */
function initBaseContext(app: Koatty, ctx: DefaultContext, req: Koa.BaseRequest, res: ServerResponse): KoattyContext {
    const context = Object.create(ctx);
    const request = context.request = Object.create(req);
    const response = context.response = Object.create(res);

    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};

    // delete app.context
    app.context = null;
    context.app = request.app = response.app = app;

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
 * @param {Koatty} app
 * @param {DefaultContext} ctx
 * @param {*} req
 * @param {*} res
 * @param {string} [protocol]
 * @returns {*}  {KoattyContext}
 */
export function CreateContext(app: Koatty, ctx: DefaultContext, req: any, res: any, protocol?: string): KoattyContext {
    let context, resp;
    switch (protocol) {
        case "ws":
        case "wss":
            resp = new ServerResponse(req);
            context = initBaseContext(app, ctx, req, resp);
            return createWsContext(context, res, res);
        case "grpc":
            resp = new ServerResponse(req);
            context = initBaseContext(app, ctx, req, resp);
            return createGrpcContext(context, res, res);
        default:
            return initBaseContext(app, ctx, req, res);
    }
}

/**
 * Create Koatty gRPC Context
 *
 *
 * @param {KoattyContext} ctx
 * @param {IRpcServerUnaryCall<any, any>} call
 * @param {IRpcServerCallback<any>} rpcCallback
 * @returns {*}  {KoattyContext}
 */
function createGrpcContext(ctx: KoattyContext, call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>): KoattyContext {
    // 
    Helper.define(ctx, "rpc", {
        call,
        callback
    });
    // metadata
    ctx.metadata = KoattyMetadata.from(call.metadata.toJSON());

    if (ctx.rpc.call) {
        let handler: any = {};
        if (Object.hasOwnProperty.call(ctx.rpc.call, "handler")) {
            handler = Reflect.get(ctx.rpc.call, "handler") || {};
        } else if (Object.hasOwnProperty.call(ctx.rpc.call, "call")) {
            const call = Reflect.get(ctx.rpc.call, "call") || {};
            handler = call.handler || {};
        }
        const cmd = handler.path || '';
        // originalPath
        ctx.setMetaData("originalPath", cmd);
    }
    ctx.setMetaData("_body", call.request);

    // sendMetadata
    ctx.sendMetadata = function (data: KoattyMetadata) {
        ctx.rpc.call.sendMetadata(data);
    };

    return ctx;
}


/**
 * Create Koatty Websocket Context
 *
 * @param {KoattyContext} ctx
 * @param {WebSocket} socket
 * @param {(Buffer | ArrayBuffer | Buffer[])} data
 * @returns {*}  {KoattyContext}
 */
function createWsContext(ctx: KoattyContext, socket: WebSocket, data: Buffer | ArrayBuffer | Buffer[]): KoattyContext {
    Helper.define(ctx, "websocket", socket);
    ctx.setMetaData("_body", data.toString());

    return ctx;
}