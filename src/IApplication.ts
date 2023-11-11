/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */

import { Koatty } from "./Application";

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
  app: Koatty;
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
 * Router interface
 *
 * @export
 * @interface KoattyRouter
 */
export interface KoattyRouter {
  app: Koatty;
  options: any;
  router: any;

  SetRouter: (path: string, func: Function, method?: any) => void;
  LoadRouter: (list: any[]) => void;
  ListRouter?: () => any;
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
