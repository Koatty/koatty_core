/*
 * @Description: component interface
 * @Usage: 
 * @Author: richen
 * @Date: 2023-12-09 21:56:32
 * @LastEditTime: 2024-11-06 17:56:48
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */

import {
  IAspect, IController, IMiddleware, IOCContainer,
  IService
} from "koatty_container";
import { Helper } from "koatty_lib";
import "reflect-metadata";
import { KoattyApplication } from "./IApplication";


/**
 * Indicates that an decorated class is a "plugin".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Plugin(identifier?: string): ClassDecorator {
  return (target: any) => {
    identifier = identifier || IOCContainer.getIdentifier(target);
    // 
    if (!identifier.endsWith("Plugin")) {
      throw Error("Plugin class name must be 'Plugin' suffix.");
    }
    IOCContainer.saveClass("COMPONENT", target, `${identifier}`);
  };
}

/**
 * Interface for Plugin
 */
export interface IPlugin {
  run: (options: object, app: KoattyApplication) => Promise<any>;
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