/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2021-11-19 15:59:38
 */
import Koa from "koa";
import { WebSocket } from "ws";
import * as Helper from "koatty_lib";
import { Context } from "koatty_container";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
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

    status: HttpStatusCode;
    metadata: KoattyMetadata;
    /**
     * gRPC ServerCallImpl
     *
     * @type {IRpcServerCallImpl}
     * @memberof KoattyContext
     */
    call?: IRpcServerCall<any, any>;

    /**
     * gRPC ServerCallback
     *
     * @type {IRpcServerCallback<any>}
     * @memberof KoattyContext
     */
    rpcCallback?: IRpcServerCallback<any>;

    /**
     * websocket instance
     *
     * @type {*}
     * @memberof KoattyContext
     */
    websocket?: WebSocket; // ws.WebSocket

    /**
     * send metadata to http request header. 
     * then gRPC request to send metadata
     *
     * @memberof KoattyContext
     */
    sendMetadata?: (data: KoattyMetadata) => void;

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
    // throw
    Helper.define(context, "throw", function (statusOrMessage: HttpStatusCode | string,
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
    });

    // metadata
    Helper.define(context, "metadata", new KoattyMetadata());
    // getMetaData
    Helper.define(context, "getMetaData", function (key: string) {
        const value = context.metadata.get(key);
        if (value.length === 1) {
            return value[0];
        }
        return value;
    });

    // setMetaData
    Helper.define(context, "setMetaData", function (key: string, value: any) {
        context.metadata.set(key, value);
    });

    // sendMetadata
    Helper.define(context, "sendMetadata", function (data: KoattyMetadata) {
        context.set(data.toJSON());
    });

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
export function CreateGrpcContext(ctx: Koa.Context, call: IRpcServerUnaryCall<any, any>): KoattyContext {
    const context = initBaseContext(ctx);
    // context.call = call;
    Helper.define(context, "call", call);
    // metadata
    Helper.define(context, "metadata", KoattyMetadata.from(call.metadata.toJSON()));

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
    Helper.define(context, "sendMetadata", function (data: KoattyMetadata) {
        context.call.sendMetadata(data);
    });

    return context;
}

/**
 * Create KoattyWsContext
 *
 * @export
 * @param {KoattyContext} ctx
 * @param {Buffer | ArrayBuffer | Buffer[]} data
 * @returns {*}  {KoattyContext}
 */
export function CreateWsContext(ctx: Koa.Context, data: Buffer | ArrayBuffer | Buffer[]): KoattyContext {
    const context = initBaseContext(ctx);

    context.setMetaData("_body", data.toString());

    return context;
}