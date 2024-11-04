/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */

import { ServiceDefinition, UntypedHandleCall } from "@grpc/grpc-js";
import Koa from "koa";
import { KoattyContext, KoattyNext } from "./IContext";

/**
 * InitOptions
 *
 * @interface InitOptions
 */
export interface InitOptions {
  name?: string;
  version?: string;
  appPath?: string;
  appDebug?: boolean;
  rootPath?: string;
  // koatty framework path
  koattyPath?: string;
}

/**
 * Koatty Application interface
 *
 * @export
 * @interface KoattyApplication
 * @extends {Koa}
 */
export interface KoattyApplication extends Koa {
  env: string;
  name: string;
  version: string;

  options: InitOptions;

  server: KoattyServer | KoattyServer[];
  router: KoattyRouter;

  appPath: string;
  rootPath: string;
  koattyPath: string;
  logsPath: string;

  appDebug: boolean;

  context: KoattyContext;

  /**
   * app custom init, must be defined options
   */
  init: () => void;

  /**
  * Application metadata operation
  * 
  * @memberof Context
  */
  readonly getMetaData: (key: string) => any[];
  readonly setMetaData: (key: string, value: unknown) => void;

  /**
   * Use middleware
   * @param fn 
   * @returns 
   */
  readonly use: (fn: Function) => any;

  /**
   * Use the given Express middleware
   * @param fn 
   * @returns 
   */
  readonly useExp: (fn: Function) => any;

  /**
   * Read app configuration
   * @param name 
   * @param type 
   * @returns 
   */
  readonly config: (name: string, type?: string) => any;

  /**
   * Create context
   * @param req 
   * @param res 
   * @param protocol 
   * @returns 
   */
  readonly createContext: (req: any, res: any, protocol?: string) => KoattyContext;

  /**
   * Listening and start server
   * @param listenCallback 
   * @returns 
   */
  readonly listen: (listenCallback?: any) => any;

  /**
   * 
   * @param protocol 
   * @param reqHandler 
   * @returns 
   */
  readonly callback: (protocol?: string, reqHandler?: (ctx: KoattyContext) => Promise<any>) => { (req: unknown, res: unknown): Promise<any> };

}


type unknownServer = unknown;

/**
 * interface Server
 *
 * @export
 * @interface KoattyServer
 */
export interface KoattyServer {
  options: any;
  server: unknownServer;
  status: number;

  readonly Start: (listenCallback: () => void) => unknownServer;
  readonly Stop: (callback?: () => void) => void;
  /**
   * gRPC service register
   * @param {ServiceImplementation} impl
   */
  readonly RegisterService?: (impl: any) => void;
}

/**
 * gRPC Implementation
 *
 * @export
 * @interface IRpcImplementation
 */
export interface IRpcImplementation {
  [methodName: string]: UntypedHandleCall;
}

// HttpImplementation
export type IHttpImplementation = (ctx: KoattyContext, next?: KoattyNext) => Promise<any>;

// IWsImplementation
export type IWsImplementation = (ctx: KoattyContext, next?: KoattyNext) => Promise<any>;

/**
 * RouterImplementation
 *
 * @export
 * @interface RouterImplementation
 */
export interface RouterImplementation {
  path?: string;
  method?: string;
  service?: ServiceDefinition;
  implementation?: IHttpImplementation | IRpcImplementation | IWsImplementation;
}

/**
 * Router interface
 *
 * @export
 * @interface KoattyRouter
 */
export interface KoattyRouter {
  /**
   * router options
   */
  options: any;
  /**
   * KoaRouter or custom router
   */
  router: any;

  /**
   * set router map
   * @param name 
   * @param impl 
   * @returns 
   */
  readonly SetRouter: (name: string, impl?: RouterImplementation) => void;

  /**
   * load router list and register handler
   * @param app 
   * @param list 
   * @returns 
   */
  readonly LoadRouter: (app: KoattyApplication, list: any[]) => Promise<void>;

  /**
   * return router list
   * @returns 
   */
  readonly ListRouter?: () => Map<string, RouterImplementation>;
}

/**
 * app event
 *
 * @export
 * @enum AppEvent
 */
export const enum AppEvent {
  appBoot = "appBoot",
  appReady = "appReady",
  appStart = "appStart",
  appStop = "appStop",
}
export const AppEventArr = ["appBoot", "appReady", "appStart", "appStop"];

// type EventHookFunc
export type EventHookFunc = (app: KoattyApplication) => Promise<any>;
