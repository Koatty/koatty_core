/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-07-09 11:34:49
 * @LastEditTime: 2023-02-26 11:58:30
 */
import { Helper } from "koatty_lib";
import { KoattyMetadata } from "./Metadata";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { IRpcServerCallback, IRpcServerUnaryCall, IWebSocket, KoaContext, KoattyContext, WsRequest } from "./IContext";


/**
 *  Create KoattyContext
 *
 * @export
 * @param {KoaContext} ctx
 * @param {*} req
 * @param {*} res
 * @returns {*}  {KoattyContext}
 */
export function CreateContext(ctx: KoaContext, req: any, res: any): KoattyContext {
  const context = initBaseContext(ctx);
  switch (ctx.protocol) {
    case "ws":
    case "wss":
      return createWsContext(context, req, res);
    case "grpc":
      return createGrpcContext(context, req, res);
    default:
      return context;
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
function createGrpcContext(context: KoattyContext, call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>): KoattyContext {
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
      const m = data.getMap();
      const metadata = call.metadata.clone();
      for (const k in m) {
        if (Object.prototype.hasOwnProperty.call(m, k)) {
          metadata.add(k, m[k]);
        }
      }
      call.sendMetadata(metadata);
    };
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
function createWsContext(context: KoattyContext, req: WsRequest, socket: IWebSocket): KoattyContext {
  context.status = 200;
  Helper.define(context, "websocket", socket);
  context.setMetaData("_body", (req.data ?? "").toString());

  return context;
}

/**
 * initialize Base Context
 *
 * @param {Koatty} app
 * @param {KoaContext} ctx
 * @returns {*}  {KoattyContext}
 */
function initBaseContext(ctx: KoaContext): KoattyContext {
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
  context.getMetaData = function (key: string): any[] {
    return context.metadata.get(key);
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