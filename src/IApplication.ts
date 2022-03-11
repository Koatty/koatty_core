/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-11-23 11:09:54
 * @LastEditTime: 2022-03-11 11:01:00
 */

import { Koatty } from "./Application";
import { Server } from 'net';

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

/**
 * interface Server
 *
 * @export
 * @interface KoattyServer
 */
export interface KoattyServer {
    app: Koatty;
    options: any;
    server: Server;
    status: number;

    Start: (listenCallback: () => void) => Server;
    Stop: (callback?: () => void) => void;
    /**
     * gRPC service register
     * @param {ServiceImplementation} impl
     */
    RegisterService?: (impl: any) => void;
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
