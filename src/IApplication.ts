/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-11-23 11:09:54
 * @LastEditTime: 2022-02-11 14:58:26
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

/**
 * listening options
 *
 * @interface ListeningOptions
 */
export interface ListeningOptions {
    hostname: string;
    port: number;
    protocol: string; // 'http' | 'https' | 'http2' | 'grpc' | 'ws' | 'wss'
    trace?: boolean; // Full stack debug & trace, default: false
    ext?: any; // Other extended configuration
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
    server: any;
    status: number;

    Start: (listenCallback: () => void) => void;
    Stop: () => void;
    /**
     * gRPC service register
     * @param {ServiceImplementation} impl
     */
    RegisterService?: (impl: any) => void;
}

/**
 * KoattyRouterOptions
 *
 * @export
 * @interface KoattyRouterOptions
 */
export interface KoattyRouterOptions {
    prefix: string;
    /**
     * Methods which should be supported by the router.
     */
    methods?: string[];
    routerPath?: string;
    /**
     * Whether or not routing should be case-sensitive.
     */
    sensitive?: boolean;
    /**
     * Whether or not routes should matched strictly.
     *
     * If strict matching is enabled, the trailing slash is taken into
     * account when matching routes.
     */
    strict?: boolean;
    /**
     * gRPC protocol file
     */
    protoFile?: string;
    // 
    /**
     * Other extended configuration
     */
    ext?: any;
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

export type KoattyProtocol = 'http' | 'https' | 'http2' | 'grpc' | 'ws' | 'wss';