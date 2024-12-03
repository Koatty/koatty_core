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
 * Create KoattyContext
 * @param ctx  koa context
 * @param protocol server protocol
 * @param req  request 
 * @param res  response
 * @returns 
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
 * @description: create http context
 * @param {KoattyContext} context
 * @return {KoattyContext} context
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
 * Create Koatty gRPC Context
 *
 *
 * @param {KoattyContext} ctx
 * @param {IRpcServerUnaryCall<any, any>} call
 * @param {IRpcServerCallback<any>} rpcCallback
 * @returns {*}  {KoattyContext}
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
 * Create Koatty Websocket Context
 *
 * @param {KoattyContext} ctx
 * @param {IncomingMessage} req
 * @param {WebSocket} socket
 * @returns {*}  {KoattyContext}
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
 * Initializes the base context for the application.
 *
 * @param {KoaContext} ctx - The Koa context object.
 * @param {string} protocol - The protocol of the request (e.g., 'http', 'https').
 * @returns {KoattyContext} - The initialized Koatty context object.
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