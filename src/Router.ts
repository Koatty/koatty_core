/*
 * @Description: KoattyRouter
 * @Usage: 
 * @Author: richen
 * @Date: 2021-11-11 19:09:59
 * @LastEditTime: 2021-11-11 19:12:04
 */

import { Koatty } from "./Application";

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
    // gRPC proto file
    protoFile?: string;
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
    ListRouter: () => any;
    LoadRouter: (list: any[]) => void;
}
