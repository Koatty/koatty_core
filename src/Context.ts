/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2021-11-18 18:28:53
 */
import Koa from "koa";
import { Context } from "koatty_container";
import { Exception, GrpcStatusCode, GrpcStatusCodeMap, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { ServerDuplexStream, ServerReadableStream, ServerUnaryCall, ServerWritableStream } from "@grpc/grpc-js";
import { sendUnaryData, ServerUnaryCallImpl } from "@grpc/grpc-js/build/src/server-call";
import { KoattyMetadata } from "./Metadata";
// export
export type IRpcServerUnaryCall<RequestType, ResponseType> = ServerUnaryCall<RequestType, ResponseType>;
export type IRpcServerReadableStream<RequestType, ResponseType> = ServerReadableStream<RequestType, ResponseType>;
export type IRpcServerWriteableStream<RequestType, ResponseType> = ServerWritableStream<RequestType, ResponseType>;
export type IRpcServerDuplexStream<RequestType, ResponseType> = ServerDuplexStream<RequestType, ResponseType>

// redefine ServerCall
export type IRpcServerCall<RequestType, ResponseType> = IRpcServerUnaryCall<RequestType, ResponseType>
    | IRpcServerReadableStream<RequestType, ResponseType>
    | IRpcServerWriteableStream<RequestType, ResponseType>
    | IRpcServerDuplexStream<RequestType, ResponseType>;
// redefine ServerCallImpl
export type IRpcServerCallImpl<RequestType, ResponseType> = ServerUnaryCallImpl<RequestType, ResponseType>

// redefine ServerCallback
export type IRpcServerCallback<ResponseType> = sendUnaryData<ResponseType>

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

    status: HttpStatusCode | GrpcStatusCode;
    metadata: KoattyMetadata;
    /**
     * gRPC ServerCallImpl
     *
     * @type {IRpcServerCallImpl}
     * @memberof KoattyContext
     */
    call?: IRpcServerCall<any, any>;

    /**
     * websocket instance
     *
     * @type {*}
     * @memberof KoattyContext
     */
    websocket?: any; // ws.WebSocket
    /**
     * Request body parser
     *
     * @memberof KoattyContext
     */
    bodyParser?: () => Promise<Object>;

    /**
     * QueryString parser
     *
     * @memberof KoattyContext
     */
    queryParser?: () => Object;
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
    setMetaData: (key: string, value: any) => any;
}
/**
 * KoattyNext
 */
export type KoattyNext = Koa.Next;

function initBaseContext(ctx: Koa.Context): KoattyContext {
    const context: KoattyContext = Object.create(ctx);

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
    context.metadata = new KoattyMetadata();
    context.getMetaData = function (key: string) {
        const value = context.metadata.get(key);
        if (value.length === 1) {
            return value[0];
        }
        return value;
    };
    context.setMetaData = function (key: string, value: any) {
        context.metadata.set(key, value);
    };
    return context;
}

/**
 * Create KoattyContext
 *
 * @param {Koa.Context} ctx
 * @returns {*}  {KoattyContext}
 */
export function CreateContext(ctx: Koa.Context): KoattyContext {
    return initBaseContext(ctx);
}

/**
 * Create KoattyGrpcContext
 *
 * @export
 * @param {IRpcServerCall<any, any>} call
 * @param {IRpcServerCallback<any>} [callback]
 * @returns {*}  {KoattyGrpcContext}
 */
export function CreateGrpcContext(ctx: KoattyContext, call: IRpcServerUnaryCall<any, any>): KoattyContext {
    ctx.throw = function (statusOrMessage: GrpcStatusCode | string,
        codeOrMessage: string | number = 1, status?: GrpcStatusCode): never {
        if (typeof statusOrMessage !== "string") {
            if (GrpcStatusCodeMap.has(statusOrMessage)) {
                status = statusOrMessage;
                statusOrMessage = GrpcStatusCodeMap.get(statusOrMessage);
            }
        }
        if (typeof codeOrMessage === "string") {
            statusOrMessage = codeOrMessage;
            codeOrMessage = 2;
        }
        throw new Exception(<string>statusOrMessage, codeOrMessage, status);
    };
    ctx.call = call;
    ctx.metadata = KoattyMetadata.from(call.metadata.toJSON());

    if (ctx.call) {
        let handler: any = {};
        if (Object.hasOwnProperty.call(ctx.call, "handler")) {
            handler = Reflect.get(ctx.call, "handler") || {};
        } else if (Object.hasOwnProperty.call(ctx.call, "call")) {
            const call = Reflect.get(ctx.call, "call") || {};
            handler = call.handler || {};
        }
        const cmd = handler.path || '';
        // originalPath
        ctx.path = cmd;
        ctx.setMetaData("originalPath", cmd);
    }
    ctx.setMetaData("_body", call.request);

    return ctx;
}

/**
 * Create KoattyWsContext
 *
 * @export
 * @param {KoattyContext} ctx
 * @param {*} data
 * @returns {*}  {KoattyContext}
 */
export function CreateWsContext(ctx: KoattyContext, data: any): KoattyContext {
    ctx.setMetaData("_body", data);

    return ctx;
}