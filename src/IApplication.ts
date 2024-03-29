/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */

import { ServiceDefinition, UntypedHandleCall } from "@grpc/grpc-js";
import { Koatty } from "./Application";
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
  koattyPath?: string;
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
  readonly LoadRouter: (app: Koatty, list: any[]) => Promise<void>;

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
export type EventHookFunc = (app: Koatty) => Promise<any>;
