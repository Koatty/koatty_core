/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { Helper } from "koatty_lib";
import { IRpcServerCallback, IRpcServerUnaryCall, IWebSocket, KoaContext, KoattyContext, WsRequest } from "./IContext";
import { KoattyMetadata } from "./Metadata";


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
  if (ctx.protocol === "ws" || ctx.protocol === "wss") {
    return createWsContext(context, req, res);
  }
  if (ctx.protocol === "grpc") {
    return createGrpcContext(context, req, res);
  }
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
function createGrpcContext(context: KoattyContext, call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>): KoattyContext {
  context.status = 200;
  Helper.define(context, "rpc", { call, callback });
  // metadata
  Helper.define(context, "metadata", KoattyMetadata.from(call.metadata.toJSON()));

  if (call) {
    const handler = Reflect.get(call, "handler") || Reflect.get(Reflect.get(call, "call"), "handler") || {};
    const cmd = handler.path || '';
    // originalPath
    context.setMetaData("originalPath", cmd);
    // payload
    context.setMetaData("_body", call.request || {});
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
  const context: KoattyContext = Object.create(ctx);
  // throw
  Helper.define(context, "throw", function (statusOrMessage: HttpStatusCode | string,
    codeOrMessage: string | number = 1, status?: HttpStatusCode): never {
    if (typeof statusOrMessage !== "string" && HttpStatusCodeMap.has(statusOrMessage)) {
      status = statusOrMessage;
      statusOrMessage = HttpStatusCodeMap.get(statusOrMessage);
    }
    if (typeof codeOrMessage === "string") {
      statusOrMessage = codeOrMessage;
      codeOrMessage = 1;
    }
    throw new Exception(<string>statusOrMessage, codeOrMessage, status);
  });

  // metadata
  Helper.define(context, "metadata", new KoattyMetadata(), true);
  // getMetaData
  Helper.define(context, "getMetaData", (key: string) => context.metadata.get(key));
  // setMetaData
  Helper.define(context, "setMetaData", (key: string, value: any) => context.metadata.set(key, value));
  // sendMetadata
  Helper.define(context, "sendMetadata", (data: KoattyMetadata) => context.set(data.toJSON()), true);

  return context;
}