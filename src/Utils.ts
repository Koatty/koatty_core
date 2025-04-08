/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2024-11-06 23:01:21
 * @LastEditTime: 2024-11-10 23:04:57
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */

import EventEmitter from "events";
import { Helper } from "koatty_lib";
import { KoattyContext } from "./IContext";
import { KoattyApplication } from "./IApplication";


/**
 * Convert express middleware for koa
 *
 * @param {function} fn
 * @returns
 * @memberof Koatty
 */
export function parseExp(fn: Function) {
  return function (ctx: KoattyContext, next: Function) {
    if (fn.length < 3) {
      fn(ctx.req, ctx.res);
      return next();
    }
    return new Promise((resolve, reject) => {
      fn(ctx.req, ctx.res, (err: Error) => {
        if (err) return reject(err);
        resolve(next());
      });
    });
  };
}
/**
 * Execute event as async
 * 
 * @param {EventEmitter} event
 * @param {string} eventName
 * @return {*}
 */
export async function asyncEvent(event: EventEmitter, eventName: string) {
  const listeners = event.listeners(eventName);
  for (const func of listeners) {
    if (Helper.isFunction(func)) await func();
  }
  return event.removeAllListeners(eventName);
}

/**
 * Check is prevent error
 *
 * @param {Error} err
 * @returns {boolean}
 */
export function isPrevent(err: Error): boolean {
  return Helper.isError(err) && err.message === "PREVENT_NEXT_PROCESS";
}
/**
 * Bind event to the process
 *
 * @param {EventEmitter} event
 * @param {string} originEventName
 * @param {string} [targetEventName]
 */
export function bindProcessEvent(event: EventEmitter, originEventName: string, targetEventName = "beforeExit") {
  event.listeners(originEventName).forEach(func => {
    if (Helper.isFunction(func)) {
      process.addListener(<any>targetEventName, func);
    }
  });
  event.removeAllListeners(originEventName);
}

/**
 * Get system configuration from application.
 * 
 * @param {KoattyApplication} app - The Koatty application instance
 * @param {string} [type='server'] - Configuration type, either 'server' or 'trace'
 * @returns {object} The merged configuration object
 * 
 * When type is 'server', returns server configuration with defaults:
 * - hostname: from env.IP or '127.0.0.1'
 * - port: from env.PORT/APP_PORT or 3000
 * - protocol: 'http'
 * - ext: SSL and WebSocket options
 * 
 * When type is 'trace', returns trace configuration with defaults:
 * - RequestIdHeaderName: trace header name
 * - RequestIdName: trace ID field name
 * - Timeout: request timeout in ms
 * - Encoding: character encoding
 * - OpenTrace: trace switch
 * - AsyncHooks: async hooks switch
 */
export function getSysConfig(app: KoattyApplication, type = 'server') {
  const sysConf = app.config('', 'system') || { trace: {}, server: {} };
  if (type === 'server') {
    const defaultServerConf = {
      hostname: process.env.IP || '127.0.0.1',
      port: process.env.PORT || process.env.APP_PORT || 3000,
      ext: {
        key: "",
        cert: "",
        protoFile: "",
        server: <any>null, // used by websocket
      },
    }
    return { ...defaultServerConf, ...sysConf.server };
  } else {
    const timeout = (app.config('http_timeout') || 10) * 1000;
    const encoding = app.config('encoding') || 'utf-8';
    const openTrace = app.config("open_trace") || false;
    const asyncHooks = app.config("async_hooks") || false;
    const defaultTraceConf = {
      RequestIdHeaderName: app.config('trace_header') || 'X-Request-Id',
      RequestIdName: app.config('trace_id') || "requestId",
      Timeout: timeout,
      Encoding: encoding,
      OpenTrace: openTrace,
      AsyncHooks: asyncHooks,
    }
    return { ...defaultTraceConf, ...sysConf.trace };
  }
}