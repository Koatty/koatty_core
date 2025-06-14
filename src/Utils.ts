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
export async function asyncEvent(event: EventEmitter, eventName: string): Promise<void> {
  const listeners = event.listeners(eventName);
  for (const func of listeners) {
    if (Helper.isFunction(func)) await func();
  }
  event.removeAllListeners(eventName);
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
