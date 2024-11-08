/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import {
  ServerReadableStream, ServerUnaryCall, ServerWritableStream
} from "@grpc/grpc-js";
import {
  sendUnaryData, ServerReadableStreamImpl,
  ServerUnaryCallImpl
} from "@grpc/grpc-js/build/src/server-call";
import { IncomingMessage, OutgoingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import Koa from "koa";
import { WebSocket } from "ws";
import { KoattyMetadata } from "./Metadata";

// KoaContext
export type KoaContext = Koa.ParameterizedContext;
/**
 * KoattyNext
 */
export type KoattyNext = Koa.Next;

export type RequestType = IncomingMessage | Http2ServerRequest | IRpcServerCall<any, any> | {
  data: Buffer | ArrayBuffer | Buffer[];
};

export type ResponseType = ServerResponse | Http2ServerResponse | OutgoingMessage | IRpcServerCallback<any> | IWebSocket;

// redefine ServerCall
export type IRpcServerCall<ReqType, ResType> = ServerUnaryCall<ReqType, ResType>
  & ServerReadableStream<ReqType, ResType>
  & ServerWritableStream<ReqType, ResType>
  ;
// redefine ServerCallImpl
export type IRpcServerCallImpl<ReqType, ResType> = ServerUnaryCallImpl<ReqType, ResType>
  & ServerReadableStreamImpl<ReqType, ResType>;

// redefine ServerCallback
export type IRpcServerCallback<ResType> = sendUnaryData<ResType>;

// redefine WebSocket
export type IWebSocket = WebSocket;

/**
 * Koatty Context.
 *
 * @export
 * @interface KoattyContext
 * @extends {Koa.Context}
 */
export interface KoattyContext extends KoaContext {

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
   * WebSocket ServerImpl
   *
   * @type {*}
   * @memberof KoattyContext
   */
  websocket?: IWebSocket; // ws.WebSocket

  /**
  * context metadata operation
  * 
  * @memberof Context
  */
  readonly getMetaData: (key: string) => any[];
  readonly setMetaData: (key: string, value: unknown) => void;

  /**
   * send metadata to http request header. 
   * then gRPC request to send metadata
   *
   * @memberof KoattyContext
   */
  readonly sendMetadata?: (data: KoattyMetadata) => void;

  /**
   * Replace ctx.throw
   *
   * @type {(status: number, message?: string)}
   * @type {(message: string, code?: number, status?: HttpStatusCode)}
   * @memberof Context
   */
  throw(status: number): never;
  throw(status: number, message?: string): never;
  throw(message: string, code?: number | undefined, status?: number | undefined): never;

  /**
   * Get parsed query-string and path variable(koa ctx.query and ctx.params),
   * and set as an object.
   * @returns unknown
   */
  readonly requestParam?: () => unknown;

  /**
   * Get parsed body(form variable and file object).
   * @returns Promise<unknown> ex: {post: {...}, file: {...}}
   */
  readonly requestBody?: () => Promise<unknown>;
}
