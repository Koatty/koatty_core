/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-11-11 19:12:44
 * @LastEditTime: 2021-11-11 19:15:36
 */

/**
 * listening options
 *
 * @interface ListeningOptions
 */
export interface ListeningOptions {
    hostname: string;
    port: number;
    protocol: string; // http|https|grpc|ws|wss
    ext?: any; // Other extended configuration
}

/**
 * interface Server
 *
 * @export
 * @interface KoattyServer
 */
export interface KoattyServer {
    Start: (openTrace: boolean, listenCallback: () => void) => void;
    Stop: () => void;
}