/*
 * @Description: component interface
 * @Usage: 
 * @Author: richen
 * @Date: 2023-12-09 21:56:32
 * @LastEditTime: 2025-03-13 16:31:11
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */

import { IAspect, IOC } from "koatty_container";
import { Helper } from "koatty_lib";
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
 * koatty middleware function
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
 * Component decorator, used to mark a class as a component and register it to IOC container.
 * 
 * @param identifier Optional identifier for the component. If not provided, will use the class name.
 * @returns ClassDecorator function that registers the target class as a component.
 * 
 * @example
 * ```ts
 * @Component()
 * class UserDto {}
 * 
 * @Component('customName')
 * class OrderClass {}
 * ```
 */
export function Component(identifier?: string): ClassDecorator {
  return (target: Function) => {
    identifier = identifier || IOC.getIdentifier(target);
    IOC.saveClass("COMPONENT", target, identifier);
  };
}

/**
 * Controller decorator for registering controller class.
 * Used to mark a class as a Controller and define its routing path.
 * 
 * @param path The base path for all routes in this controller
 * @param options Additional configuration options for the controller
 * @param {string} [options.protocol='http'] Protocol used by the controller
 * @returns {ClassDecorator} Returns a class decorator function
 * 
 * @example
 * ```
 * @Controller('/api')
 * export class UserController {}
 * ```
 */
export function Controller(path = "", options?: { [key: string]: any }): ClassDecorator {
  options = options || {
    protocol: "http",
  };
  options.path = path;
  return processController(options);
}

/**
 * Controller decorator, used to mark a class as a controller.
 * 
 * @param {Object} [options] - Controller configuration options
 * @returns {Function} Returns a decorator function
 */
function processController(options?: { [key: string]: any }) {
  return (target: Function) => {
    const identifier = IOC.getIdentifier(target);
    IOC.saveClass("CONTROLLER", target, identifier);
    IOC.savePropertyData(CONTROLLER_ROUTER, options, target, identifier);
  };
}

/**
 * GrpcController decorator for registering gRPC controller class.
 * 
 * @param path The base path for the gRPC service
 * @param options Configuration options for the gRPC controller
 * @returns ClassDecorator function that registers the controller class
 * 
 * @example
 * ```typescript
 * @GrpcController("/user")
 * class UserController {}
 * ```
 */
export function GrpcController(path = "", options?: { [key: string]: any }): ClassDecorator {
  options = options || {
    protocol: "grpc",
  };
  options.path = path;
  return processController(options);
}

/**
 * WebSocket controller decorator.
 * Define a class as WebSocket controller.
 * 
 * @param {string} [path=''] - Base path for the WebSocket controller
 * @param {Object} [options] - WebSocket controller configuration options
 * @param {string} [options.protocol='ws'] - WebSocket protocol
 * @returns {ClassDecorator} Returns a class decorator function
 * 
 * @example
 * ```typescript
 * @WebSocketController('/ws')
 * export class MyWSController {}
 * ```
 */
export function WebSocketController(path = "", options?: { [key: string]: any }): ClassDecorator {
  options = options || {
    protocol: "ws",
  };
  options.path = path;
  return processController(options);
}

/**
 * GraphQL controller decorator.
 * Define a class as a GraphQL controller.
 * 
 * @param path - The base path for the GraphQL controller. Default is empty string.
 * @param options - Configuration options for the GraphQL controller
 * @returns ClassDecorator
 * 
 * @example
 * ```typescript
 * @GraphQLController('/api')
 * export class UserController {}
 * ```
 */
export function GraphQLController(path = "", options?: { [key: string]: any }): ClassDecorator {
  options = options || {
    protocol: "graphql",
  };
  options.path = path;
  return processController(options);
}

/**
 * Middleware decorator, used to mark a class as a middleware component.
 * 
 * @param identifier Optional custom identifier for the middleware. If not provided, 
 *                   the class name will be used as identifier
 * @returns ClassDecorator function that registers the middleware class in IOC container
 * 
 * @example
 * ```ts
 * @Middleware()
 * export class LogMiddleware {
 *   // middleware implementation
 *   run(options: any, app: KoattyApplication) {
 *     // do something
 *     return (ctx: KoattyContext, next: KoattyNext) {
 *       // do something
 *     }
 *   }
 * }
 * ```
 */
export function Middleware(identifier?: string): ClassDecorator {
  return (target: Function) => {
    identifier = identifier || IOC.getIdentifier(target);
    IOC.saveClass("MIDDLEWARE", target, identifier);
  };
}

/**
 * Service decorator, used to mark a class as a service component.
 * The decorated class will be registered in the IOC container.
 * 
 * @param identifier Optional service identifier. If not provided, will use the class name.
 * @returns ClassDecorator
 * @example
 * ```ts
 * @Service()
 * export class UserService {
 *   // do something
 * }
 */
export function Service(identifier?: string): ClassDecorator {
  return (target: Function) => {
    identifier = identifier || IOC.getIdentifier(target);
    IOC.saveClass("SERVICE", target, identifier);
  };
}

/**
 * Plugin decorator for registering plugin components.
 * The decorated class must have a name ending with "Plugin" suffix.
 * 
 * @param identifier Optional custom identifier for the plugin. If not provided, will use class name
 * @returns ClassDecorator
 * @throws Error if class name doesn't end with "Plugin"
 * 
 * @example
 * ```ts
 * @Plugin()
 * class MyPlugin {
 *   run(options: object, app: KoattyApplication) {}
 * }
 * ```
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
 * Check if a class implements the IMiddleware interface.
 * 
 * @param cls The class to check
 * @returns True if the class implements IMiddleware interface, false otherwise
 */
export function implementsMiddlewareInterface(cls: any): cls is IMiddleware {
  return 'run' in cls && Helper.isFunction(cls.run);
}

/**
 * Check if a class implements the IController interface.
 * 
 * @param cls - The class to check
 * @returns True if the class implements IController interface, false otherwise
 */
export function implementsControllerInterface(cls: any): cls is IController {
  return 'app' in cls && 'ctx' in cls;
}

/**
 * Check if a class implements the IService interface.
 * 
 * @param cls The class to check
 * @returns True if the class implements IService interface, false otherwise
 */
export function implementsServiceInterface(cls: any): cls is IService {
  return 'app' in cls;
}

/**
 * Check if a class implements the IPlugin interface.
 * 
 * @param cls The class to check
 * @returns True if the class implements IPlugin interface, false otherwise
 */
export function implementsPluginInterface(cls: any): cls is IPlugin {
  return 'run' in cls && Helper.isFunction(cls.run);
}

/**
 * Check if a class implements the IAspect interface.
 * 
 * @param cls The class to check
 * @returns True if the class implements IAspect interface, false otherwise
 */
export function implementsAspectInterface(cls: any): cls is IAspect {
  return 'app' in cls && 'run' in cls && Helper.isFunction(cls.run);
}