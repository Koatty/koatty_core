/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import { ServerUnaryCall } from "@grpc/grpc-js";
import { IncomingMessage } from "http";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { Helper } from "koatty_lib";
import {
  IRpcServerCall, IRpcServerCallback, IWebSocket,
  KoaContext, KoattyContext, RequestType,
  ResponseType
} from './IContext';
import { KoattyMetadata } from "./Metadata";


/**
 * Create Koatty context instance based on protocol type.
 * 
 * @param {KoaContext} ctx - Koa context object
 * @param {string} protocol - Protocol type ('http'|'https'|'ws'|'wss'|'grpc')
 * @param {any} req - Request object
 * @param {any} res - Response object
 * @returns {KoattyContext} Returns appropriate context instance based on protocol
 */
export function createKoattyContext(ctx: KoaContext, protocol: string,
  req: any, res: any): KoattyContext {
  const context = initBaseContext(ctx, protocol);
  if (context.protocol === "ws" || context.protocol === "wss") {
    return createWsContext(context, req, res);
  }
  if (context.protocol === "grpc") {
    return createGrpcContext(context, req, res);
  }
  return createHttpContext(context);
}

/**
 * Create HTTP context with metadata functionality.
 * 
 * @param {KoattyContext} context The Koatty context object
 * @returns {KoattyContext} The enhanced context with metadata methods
 * 
 * @description
 * Defines metadata-related methods on the context:
 * - metadata: Stores KoattyMetadata instance
 * - getMetaData: Retrieves metadata value by key
 * - setMetaData: Sets metadata value for key
 * - sendMetadata: Sends metadata as response headers
 */
function createHttpContext(context: KoattyContext) {
  // metadata
  Helper.define(context, "metadata", new KoattyMetadata());
  // getMetaData
  Helper.define(context, "getMetaData", (key: string) => context.metadata.get(key));
  // setMetaData
  Helper.define(context, "setMetaData", (key: string, value: any) => context.metadata.set(key, value));
  // sendMetadata
  Helper.define(context, "sendMetadata", (data?: KoattyMetadata) => context.set((data ||
    context.metadata).getMap()));

  return context;
}

/**
 * Create a gRPC context by extending KoattyContext with gRPC-specific properties and methods.
 * 
 * @param context - The base KoattyContext instance
 * @param call - The gRPC server call object containing request and metadata
 * @param callback - The gRPC server callback function
 * @returns The enhanced KoattyContext with gRPC capabilities
 * 
 * @internal
 */
function createGrpcContext(context: KoattyContext, call: IRpcServerCall<RequestType, ResponseType>,
  callback: IRpcServerCallback<any>): KoattyContext {
  context.status = 200;

  if (call) {
    Helper.define(context, "rpc", { call, callback });
    // metadata
    Helper.define(context, "metadata", KoattyMetadata.from(call.metadata.toJSON()));
    // getMetaData
    Helper.define(context, "getMetaData", (key: string) => context.metadata.get(key));
    // setMetaData
    Helper.define(context, "setMetaData", (key: string, value: any) => context.metadata.set(key, value));

    const handler = Reflect.get(call, "handler") || Reflect.get(Reflect.get(call, "call"), "handler") || {};
    // originalPath
    context.setMetaData("originalPath", handler.path || '');
    // payload
    context.setMetaData("_body", (<ServerUnaryCall<any, any>>call).request || {});
    // sendMetadata
    Helper.define(context, "sendMetadata", (data: KoattyMetadata) => {
      const m = data.getMap();
      const metadata = call.metadata.clone();
      Object.keys(m).forEach(k => metadata.add(k, m[k]));
      call.sendMetadata(metadata);
    });
  }

  return context;
}

/**
 * Create WebSocket context from HTTP context.
 * 
 * @param {KoattyContext} context The original context object
 * @param {IncomingMessage & { data: Buffer | ArrayBuffer | Buffer[] }} req WebSocket request object
 * @param {IWebSocket} socket WebSocket connection instance
 * @returns {KoattyContext} Enhanced context with WebSocket support
 */
function createWsContext(context: KoattyContext, req: IncomingMessage & {
  data: Buffer | ArrayBuffer | Buffer[];
}, socket: IWebSocket): KoattyContext {
  context = createHttpContext(context);
  context.status = 200;
  Helper.define(context, "websocket", socket);
  context.setMetaData("_body", (req.data ?? "").toString());
  return context;
}

/**
 * Initialize base context by extending KoaContext with additional properties and methods.
 * 
 * @param {KoaContext} ctx - The original Koa context object to extend from.
 * @param {string} protocol - The protocol to be defined in the context.
 * @returns {KoattyContext} The extended context object with additional properties and methods.
 */
function initBaseContext(ctx: KoaContext, protocol: string): KoattyContext {
  const context: KoattyContext = Object.create(ctx);
  Helper.define(context, "protocol", protocol);
  /**
   * Throws an exception with the specified status code and message.
   *
   * @param {HttpStatusCode | string} statusOrMessage - The status code or message of the exception.
   * @param {string | number} codeOrMessage - The error code or message of the exception.
   * @param {HttpStatusCode} status - The HTTP status code of the exception.
   * @throws {Exception} - Always throws an exception with the specified status and message.
   */
  Helper.define(context, "throw", function (statusOrMessage: HttpStatusCode | string,
    codeOrMessage: string | number = 1, status?: HttpStatusCode): never {
    if (typeof statusOrMessage !== "string") {
      const httpStatus = HttpStatusCodeMap.get(statusOrMessage);
      if (httpStatus) {
        status = statusOrMessage;
        statusOrMessage = httpStatus;
      }
    }
    if (typeof codeOrMessage === "string") {
      statusOrMessage = codeOrMessage;
      codeOrMessage = 1;
    }
    throw new Exception(<string>statusOrMessage, codeOrMessage, status);
  });

  return context;
}