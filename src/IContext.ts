/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-11-23 11:40:15
 * @LastEditTime: 2022-02-11 14:24:13
 */
import Koa from "koa";
import { WebSocket } from "ws";
import { Context } from "koatty_container";
import { ServerDuplexStream, ServerReadableStream, ServerUnaryCall, ServerWritableStream } from "@grpc/grpc-js";
import { sendUnaryData, ServerUnaryCallImpl } from "@grpc/grpc-js/build/src/server-call";
import { HttpStatusCode } from "koatty_exception";
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

    /**
     * status
     *
     * @type {number}
     * @memberof KoattyContext
     */
    status: number;

    /**
     * metadata
     *
     * @type {KoattyMetadata}
     * @memberof KoattyContext
     */
    metadata: KoattyMetadata;

    /**
     * protocol
     *
     * @type {string}
     * @memberof KoattyContext
     */
    protocol: string;

    /**
     * gRPC ServerImpl
     *
     * @type {{
     *         call: IRpcServerCall<any, any>;
     *         callback?: IRpcServerCallback<any>;
     *     }}
     * @memberof KoattyContext
     */
    rpc?: {
        call: IRpcServerCall<any, any>;
        callback?: IRpcServerCallback<any>;
    }

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