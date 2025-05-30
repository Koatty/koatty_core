/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */
import { ServerUnaryCall } from "@grpc/grpc-js";
import { IncomingMessage } from "http";
import { Exception, HttpStatusCode, HttpStatusCodeMap } from "koatty_exception";
import { Helper } from "koatty_lib";
import {
  IRpcServerCall, IRpcServerCallback, IWebSocket,
  KoaContext, KoattyContext, RequestType,
  ResponseType
} from './IContext';
import { KoattyMetadata } from "./Metadata";

/**
 * Protocol types supported by Koatty
 */
type ProtocolType = 'http' | 'https' | 'ws' | 'wss' | 'grpc' | 'graphql';

/**
 * Protocol types supported by Koatty
 */
const ProtocolTypeArray: ProtocolType[] = ['http', 'https', 'ws', 'wss', 'grpc', 'graphql'];

/**
 * Context factory interface for different protocols
 */
interface IContextFactory {
  create(context: KoattyContext, req?: any, _res?: any): KoattyContext;
}

/**
 * Context pool for reusing context objects
 */
class ContextPool {
  private static pools = new Map<ProtocolType, KoattyContext[]>();
  private static readonly MAX_POOL_SIZE = 100;

  static get(protocol: ProtocolType): KoattyContext | null {
    const pool = this.pools.get(protocol);
    return pool && pool.length > 0 ? pool.pop()! : null;
  }

  static release(protocol: ProtocolType, context: KoattyContext): void {
    const pool = this.pools.get(protocol) || [];
    if (pool.length < this.MAX_POOL_SIZE) {
      // Reset context state
      this.resetContext(context);
      pool.push(context);
      this.pools.set(protocol, pool);
    }
  }

  private static resetContext(context: KoattyContext): void {
    // Reset metadata - create new instance instead of reassigning
    if (context.metadata && typeof context.metadata.set === 'function') {
      // Clear existing metadata instead of replacing
      const keys = Object.keys(context.metadata.getMap());
      keys.forEach(key => context.metadata.remove(key));
    }
    // Reset status
    context.status = 200;
    // Clear other protocol-specific properties
    if (context.rpc) {
      delete context.rpc;
    }
    if (context.websocket) {
      delete context.websocket;
    }
    // For GraphQL, we can't delete the property due to Helper.define,
    // but we can reset its content if it exists
    if ((context as any).graphql) {
      try {
        (context as any).graphql = null;
      } catch {
        // If we can't reset the properties, just ignore
      }
    }
  }
}

/**
 * Base context methods that are shared across all protocols
 */
const BaseContextMethods = {
  getMetaData: function(this: KoattyContext, key: string): any[] {
    if (!key || typeof key !== 'string') {
      throw new Error('Metadata key must be a non-empty string');
    }
    return this.metadata?.get(key) || [];
  },

  setMetaData: function(this: KoattyContext, key: string, value: any): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Metadata key must be a non-empty string');
    }
    if (!this.metadata) {
      this.metadata = new KoattyMetadata();
    }
    this.metadata.set(key, value);
  },

  throw: function(this: KoattyContext, statusOrMessage: HttpStatusCode | string,
    codeOrMessage: string | number = 1, status?: HttpStatusCode): never {
    if (typeof statusOrMessage !== "string") {
      const httpStatus = HttpStatusCodeMap.get(statusOrMessage);
      if (httpStatus) {
        status = statusOrMessage;
        statusOrMessage = httpStatus;
      }
    }
    if (typeof codeOrMessage === "string") {
      statusOrMessage = codeOrMessage;
      codeOrMessage = 1;
    }
    throw new Exception(<string>statusOrMessage, codeOrMessage, status);
  }
};

/**
 * HTTP Context Factory
 */
class HttpContextFactory implements IContextFactory {
  create(context: KoattyContext): KoattyContext {
    // Initialize metadata
    Helper.define(context, "metadata", new KoattyMetadata());
    
    // Define methods
    Helper.define(context, "getMetaData", BaseContextMethods.getMetaData);
    Helper.define(context, "setMetaData", BaseContextMethods.setMetaData);
    Helper.define(context, "sendMetadata", function(this: KoattyContext, data?: KoattyMetadata) {
      const metadataToSend = data || this.metadata;
      if (metadataToSend && typeof metadataToSend.getMap === 'function') {
        this.set(metadataToSend.getMap());
      }
    });

    return context;
  }
}

/**
 * gRPC Context Factory
 */
class GrpcContextFactory implements IContextFactory {
  create(context: KoattyContext, call: IRpcServerCall<RequestType, ResponseType>,
    callback: IRpcServerCallback<any>): KoattyContext {
    
    context.status = 200;

    if (call) {
      Helper.define(context, "rpc", { call, callback });
      Helper.define(context, "metadata", KoattyMetadata.from(call.metadata.toJSON()));
      
      // Define methods
      Helper.define(context, "getMetaData", BaseContextMethods.getMetaData);
      Helper.define(context, "setMetaData", BaseContextMethods.setMetaData);

      // Safely get handler information
      let handler: any = {};
      try {
        handler = Reflect.get(call, 'handler') || {};
      } catch {
        // 如果反射失败，使用空的handler
        handler = {};
      }
      
      // Set initial metadata
      context.setMetaData("originalPath", handler.path || '');
      context.setMetaData("_body", (<ServerUnaryCall<any, any>>call).request || {});
      
      // Define sendMetadata for gRPC
      Helper.define(context, "sendMetadata", function(this: KoattyContext, data?: KoattyMetadata) {
        const metadataToSend = data || this.metadata;
        if (metadataToSend && call) {
          const m = metadataToSend.getMap();
          const metadata = call.metadata.clone();
          Object.keys(m).forEach(k => metadata.add(k, m[k]));
          call.sendMetadata(metadata);
        }
      });
    }

    return context;
  }
}

/**
 * GraphQL Context Factory
 */
class GraphQLContextFactory implements IContextFactory {
  private httpFactory = new HttpContextFactory();

  create(context: KoattyContext, req?: any, _res?: any): KoattyContext {
    // Initialize metadata first
    Helper.define(context, "metadata", new KoattyMetadata());
    
    // Define base methods
    Helper.define(context, "getMetaData", BaseContextMethods.getMetaData);
    Helper.define(context, "setMetaData", BaseContextMethods.setMetaData);
    
    context.status = 200;
    
    // Add GraphQL specific properties
    const graphqlInfo = {
      query: req?.body?.query || req?.query?.query || '',
      variables: req?.body?.variables || req?.query?.variables || {},
      operationName: req?.body?.operationName || req?.query?.operationName || null,
      schema: null as any, // Will be set by GraphQL middleware
      rootValue: null as any, // Will be set by GraphQL middleware
      contextValue: context, // Reference to the context itself
    };
    
    Helper.define(context, "graphql", graphqlInfo);
    
    // Set GraphQL specific metadata
    context.setMetaData("_body", req?.body || {});
    context.setMetaData("originalPath", req?.url || req?.path || '/graphql');
    context.setMetaData("graphqlQuery", graphqlInfo.query);
    context.setMetaData("graphqlVariables", graphqlInfo.variables);
    context.setMetaData("graphqlOperationName", graphqlInfo.operationName);
    
    // Define sendMetadata for GraphQL to handle response format
    Helper.define(context, "sendMetadata", function(this: KoattyContext, data?: KoattyMetadata) {
      const metadataToSend = data || this.metadata;
      if (metadataToSend && typeof metadataToSend.getMap === 'function') {
        // For GraphQL, metadata is typically sent as response headers
        const metadataMap = metadataToSend.getMap();
        Object.keys(metadataMap).forEach(key => {
          if (!key.startsWith('_') && !key.startsWith('graphql')) {
            this.set(key, metadataMap[key]);
          }
        });
      }
    });

    return context;
  }
}

/**
 * WebSocket Context Factory
 */
class WebSocketContextFactory implements IContextFactory {
  private httpFactory = new HttpContextFactory();

  create(context: KoattyContext, req: IncomingMessage & {
    data: Buffer | ArrayBuffer | Buffer[];
  }, socket: IWebSocket): KoattyContext {
    
    // First create HTTP context
    context = this.httpFactory.create(context);
    context.status = 200;
    
    // Add WebSocket specific properties
    Helper.define(context, "websocket", socket);
    context.setMetaData("_body", (req.data ?? "").toString());
    
    return context;
  }
}

/**
 * Context factory registry
 */
class ContextFactoryRegistry {
  private static factories = new Map<ProtocolType, IContextFactory>([
    ['http', new HttpContextFactory()],
    ['https', new HttpContextFactory()],
    ['ws', new WebSocketContextFactory()],
    ['wss', new WebSocketContextFactory()],
    ['grpc', new GrpcContextFactory()],
    ['graphql', new GraphQLContextFactory()]
  ]);

  static getFactory(protocol: ProtocolType): IContextFactory {
    const factory = this.factories.get(protocol);
    if (!factory) {
      throw new Error(`Unsupported protocol: ${protocol}`);
    }
    return factory;
  }

  static registerFactory(protocol: ProtocolType, factory: IContextFactory): void {
    this.factories.set(protocol, factory);
  }
}

/**
 * Create Koatty context instance based on protocol type.
 * 
 * @param {KoaContext} ctx - Koa context object
 * @param {string} protocol - Protocol type ('http'|'https'|'ws'|'wss'|'grpc'|'graphql')
 * @param {any} req - Request object
 * @param {any} res - Response object
 * @returns {KoattyContext} Returns appropriate context instance based on protocol
 */
export function createKoattyContext(ctx: KoaContext, protocol: string,
  req: any, res: any): KoattyContext {
  
  try {
    // Validate protocol
    const protocolType = protocol as ProtocolType;
    if (!ProtocolTypeArray.includes(protocolType)) {
      throw new Error(`Invalid protocol: ${protocol}`);
    }

    // Initialize base context
    const context = initBaseContext(ctx, protocolType);
    
    // Get factory and create context
    const factory = ContextFactoryRegistry.getFactory(protocolType);
    return factory.create(context, req, res);
    
  } catch (error) {
    throw new Error(`Failed to create context for protocol ${protocol}: ${error.message}`);
  }
}

/**
 * Initialize base context by extending KoaContext with additional properties and methods.
 * 
 * @param {KoaContext} ctx - The original Koa context object to extend from.
 * @param {ProtocolType} protocol - The protocol to be defined in the context.
 * @returns {KoattyContext} The extended context object with additional properties and methods.
 */
function initBaseContext(ctx: KoaContext, protocol: ProtocolType): KoattyContext {
  const context: KoattyContext = Object.create(ctx);
  
  // Define protocol
  Helper.define(context, "protocol", protocol);
  
  // Define throw method
  Helper.define(context, "throw", BaseContextMethods.throw);

  return context;
}

// Export for external use
export { ContextPool, ContextFactoryRegistry, type IContextFactory, type ProtocolType };