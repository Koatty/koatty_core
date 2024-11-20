/*
 * @Description: component interface
 * @Usage: 
 * @Author: richen
 * @Date: 2023-12-09 21:56:32
 * @LastEditTime: 2024-11-12 13:39:45
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */

import { IAspect, IOC } from "koatty_container";
import { Helper } from "koatty_lib";
import { DefaultLogger as logger } from "koatty_logger";
import "reflect-metadata";
import { KoattyApplication } from "./IApplication";
import { KoattyContext, KoattyNext } from "./IContext";

// used to store router 
export const CONTROLLER_ROUTER = "CONTROLLER_ROUTER";
/**
 * Interface for Controller
 */
export interface IController {
  readonly app: KoattyApplication;
  readonly ctx: KoattyContext;
}

/**
 * @description: koatty middleware function
 * @param {KoattyContext} ctx
 * @param {KoattyNext} next
 * @return {*}
 */
export type KoattyMiddleware = (ctx: KoattyContext, next: KoattyNext) => Promise<any>;

/**
 * Interface for Middleware class
 */
export interface IMiddleware {
  run: (options: any, app: KoattyApplication) => KoattyMiddleware;
}

/**
 * Interface for Service class
 */
export interface IService {
  readonly app: KoattyApplication;
  // init(...arg: any[]): void;
}

/**
 * Interface for Plugin class
 */
export interface IPlugin {
  run: (options: object, app: KoattyApplication) => Promise<any>;
}

/**
 * Indicates that an decorated class is a "component".
 *
 * @export
 * @param {string} [identifier] component name
 * @returns {ClassDecorator}
 */
export function Component(identifier?: string): ClassDecorator {
  return (target: Function) => {
    identifier = identifier || IOC.getIdentifier(target);
    IOC.saveClass("COMPONENT", target, identifier);
  };
}

/**
 * Indicates that an decorated class is a "controller".
 *
 * @export
 * @param {string} [path] controller router path
 * @param {object} [options] controller router options, the feature is not implemented yet (lll￢ω￢)
 * @returns {ClassDecorator}
 */
export function Controller(path = "", options?: object): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  options ? logger.Debug("controller router options, the feature is not implemented yet (lll￢ω￢)") : "";
  return (target: Function) => {
    const identifier = IOC.getIdentifier(target);
    IOC.saveClass("CONTROLLER", target, identifier);
    IOC.savePropertyData(CONTROLLER_ROUTER, path, target, identifier);
  };
}

/**
 * Indicates that an decorated class is a "middleware".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Middleware(identifier?: string): ClassDecorator {
  return (target: Function) => {
    identifier = identifier || IOC.getIdentifier(target);
    IOC.saveClass("MIDDLEWARE", target, identifier);
  };
}

/**
 * Indicates that an decorated class is a "service".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Service(identifier?: string): ClassDecorator {
  return (target: Function) => {
    identifier = identifier || IOC.getIdentifier(target);
    IOC.saveClass("SERVICE", target, identifier);
  };
}

/**
 * Indicates that an decorated class is a "plugin".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Plugin(identifier?: string): ClassDecorator {
  return (target: any) => {
    identifier = identifier || IOC.getIdentifier(target);
    // 
    if (!identifier.endsWith("Plugin")) {
      throw Error("Plugin class name must be 'Plugin' suffix.");
    }
    IOC.saveClass("COMPONENT", target, `${identifier}`);
  };
}

/**
 * check is implements Middleware Interface
 * @param cls 
 * @returns 
 */
export function implementsMiddlewareInterface(cls: any): cls is IMiddleware {
  return 'run' in cls && Helper.isFunction(cls.run);
}

/**
 * check is implements Controller Interface
 * @param cls 
 * @returns 
 */
export function implementsControllerInterface(cls: any): cls is IController {
  return 'app' in cls && 'ctx' in cls;
}

/**
 * check is implements Service Interface
 * @param cls 
 * @returns 
 */
export function implementsServiceInterface(cls: any): cls is IService {
  return 'app' in cls;
}

/**
 * check is implements Plugin Interface
 * @param cls 
 * @returns 
 */
export function implementsPluginInterface(cls: any): cls is IPlugin {
  return 'run' in cls && Helper.isFunction(cls.run);
}

/**
 * check is implements Aspect Interface
 * @param cls 
 * @returns 
 */
export function implementsAspectInterface(cls: any): cls is IAspect {
  return 'app' in cls && 'run' in cls && Helper.isFunction(cls.run);
}