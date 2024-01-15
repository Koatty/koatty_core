/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import Koa from "koa";
import { WebSocket } from "ws";
import { Context } from "koatty_container";
import {
  ServerDuplexStream, ServerReadableStream, ServerUnaryCall, ServerWritableStream,
  UntypedHandleCall
} from "@grpc/grpc-js";
import { sendUnaryData, ServerUnaryCallImpl } from "@grpc/grpc-js/build/src/server-call";
import { KoattyMetadata } from "./Metadata";
import { IncomingMessage } from "http";

// KoaContext
export type KoaContext = Koa.BaseContext & Koa.DefaultContext;
/**
 * KoattyNext
 */
export type KoattyNext = Koa.Next;
/**
 * WsRequest
 *
 * @class WsRequest
 * @extends {IncomingMessage}
 */
export class WsRequest extends IncomingMessage {
  data: Buffer | ArrayBuffer | Buffer[];
}

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
 * gRPC Implementation
 *
 * @export
 * @interface IRpcImplementation
 */
export interface IRpcImplementation {
  [methodName: string]: UntypedHandleCall;
}

// redefine WebSocket
export type IWebSocket = WebSocket;

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
   * status
   *
   * @type {number}
   * @memberof KoattyContext
   */
  status: number;

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
  websocket?: IWebSocket; // ws.WebSocket

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
  getMetaData: (key: string) => any[];
  setMetaData: (key: string, value: unknown) => void;

  /**
   * Get parsed query-string and path variable(koa ctx.query and ctx.params),
   * and set as an object.
   * @returns unknown
   */
  requestParam?: () => unknown;

  /**
   * Get parsed body(form variable and file object).
   * @returns Promise<unknown> ex: {post: {...}, file: {...}}
   */
  requestBody?: () => Promise<unknown>;
}
