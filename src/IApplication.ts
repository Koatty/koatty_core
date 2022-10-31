/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-11-23 11:09:54
 * @LastEditTime: 2022-10-29 11:47:09
 */

import { Koatty } from "./Application";

/**
 * InitOptions
 *
 * @interface InitOptions
 */
export interface InitOptions {
  appPath?: string;
  appDebug?: boolean;
  rootPath?: string;
  thinkPath?: string;
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
