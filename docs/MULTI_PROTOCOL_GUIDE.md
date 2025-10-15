# Koatty Core 多协议开发指南

> **版本**: 1.0.0  
> **更新日期**: 2025-10-15  
> **适用版本**: Koatty Core >= 1.x

---

## 📚 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [核心概念](#核心概念)
4. [协议辅助函数](#协议辅助函数)
5. [类型安全开发](#类型安全开发)
6. [中间件开发](#中间件开发)
7. [最佳实践](#最佳实践)
8. [故障排查](#故障排查)
9. [API 参考](#api-参考)

---

## 概述

### 支持的协议

Koatty Core 支持在单个应用中同时运行多种协议：

- **HTTP/HTTPS**: RESTful API、Web 页面
- **gRPC**: 高性能 RPC 服务
- **WebSocket**: 实时双向通信
- **GraphQL**: 灵活的查询语言

### 架构特性

- ✅ **协议隔离**: 每个协议独立的中间件栈
- ✅ **类型安全**: TypeScript 类型守卫和协议特定接口
- ✅ **声明式配置**: 装饰器支持协议过滤
- ✅ **性能优化**: Context 对象池、方法缓存
- ✅ **向后兼容**: 纯增量 API，不破坏现有代码

---

## 快速开始

### 基础示例

```typescript
import { Koatty } from 'koatty_core';

const app = new Koatty();

// HTTP 请求处理
app.use(async (ctx, next) => {
  if (ctx.protocol === 'http' || ctx.protocol === 'https') {
    console.log(`HTTP Request: ${ctx.url}`);
  }
  await next();
});

// 启动 HTTP 服务器
const httpCallback = app.callback('http');
httpServer.on('request', httpCallback);

// 启动 gRPC 服务器
const grpcCallback = app.callback('grpc');
grpcServer.addService(serviceDefinition, grpcCallback);
```

### 使用协议辅助函数

```typescript
import { isHttpContext, protocolMiddleware } from 'koatty_core';

// 方式 1: 使用类型守卫
app.use(async (ctx, next) => {
  if (isHttpContext(ctx)) {
    // TypeScript 知道 ctx.protocol 是 'http' | 'https'
    ctx.body = 'Hello HTTP';
  }
  await next();
});

// 方式 2: 使用协议过滤器
const httpOnlyMiddleware = protocolMiddleware(['http', 'https'], async (ctx, next) => {
  ctx.body = 'HTTP only';
  await next();
});
app.use(httpOnlyMiddleware);
```

---

## 核心概念

### 1. 协议隔离

每个协议维护独立的中间件栈，避免相互干扰：

```typescript
// HTTP 中间件只影响 HTTP 请求
app.use(protocolMiddleware(['http'], async (ctx, next) => {
  console.log('HTTP middleware');
  await next();
}));

// gRPC 中间件只影响 gRPC 请求
app.use(protocolMiddleware(['grpc'], async (ctx, next) => {
  console.log('gRPC middleware');
  await next();
}));
```

**实现原理**:
- `Application.callback(protocol)` 为每个协议创建独立的中间件组合
- 存储在 `Map<protocol, Function[]>` 中
- 确保协议间完全隔离

### 2. Context 工厂模式

不同协议使用不同的 Context Factory 创建特定的上下文对象：

```typescript
// HTTP Context
interface HttpContext {
  protocol: 'http' | 'https';
  requestParam?: () => unknown;
  requestBody?: () => Promise<unknown>;
}

// gRPC Context
interface GrpcContext {
  protocol: 'grpc';
  rpc: {
    call: IRpcServerCall;
    callback?: IRpcServerCallback;
  };
}
```

### 3. 类型守卫

运行时验证协议类型，提供 TypeScript 类型窄化：

```typescript
import { isHttpContext, isGrpcContext } from 'koatty_core';

app.use(async (ctx, next) => {
  if (isHttpContext(ctx)) {
    // ctx 被推断为 HttpContext
    const params = ctx.requestParam?.();
  }
  
  if (isGrpcContext(ctx)) {
    // ctx 被推断为 GrpcContext
    const call = ctx.rpc.call;
  }
  
  await next();
});
```

---

## 协议辅助函数

### 类型守卫函数

```typescript
import {
  isHttpContext,
  isGrpcContext,
  isWebSocketContext,
  isGraphQLContext
} from 'koatty_core';

// 用法
if (isHttpContext(ctx)) {
  // TypeScript 自动推断 ctx 为 HttpContext
}
```

### 断言函数

```typescript
import {
  assertHttpContext,
  assertGrpcContext,
  assertWebSocketContext,
  assertGraphQLContext
} from 'koatty_core';

// 用法：如果协议不匹配会抛出错误
assertHttpContext(ctx); // 抛出 Error: Expected HTTP/HTTPS context, got grpc
// 之后 TypeScript 知道 ctx 是 HttpContext
```

### 协议过滤中间件

```typescript
import { protocolMiddleware } from 'koatty_core';

// 单个协议
const httpMiddleware = protocolMiddleware('http', async (ctx, next) => {
  // 只在 HTTP 协议下执行
  await next();
});

// 多个协议
const webMiddleware = protocolMiddleware(['http', 'https', 'graphql'], async (ctx, next) => {
  // 在 HTTP/HTTPS/GraphQL 协议下执行
  await next();
});

app.use(httpMiddleware);
```

### 协议路由器

```typescript
import { protocolRouter } from 'koatty_core';

const router = protocolRouter(
  {
    'http': async (ctx, next) => {
      console.log('HTTP handler');
      await next();
    },
    'grpc': async (ctx, next) => {
      console.log('gRPC handler');
      await next();
    },
    'ws': async (ctx, next) => {
      console.log('WebSocket handler');
      await next();
    }
  },
  // 默认处理器（可选）
  async (ctx, next) => {
    console.log('Default handler');
    await next();
  }
);

app.use(router);
```

---

## 类型安全开发

### 协议特定接口

```typescript
import {
  HttpContext,
  GrpcContext,
  WebSocketContext,
  GraphQLContext
} from 'koatty_core';

// HTTP 处理器
function handleHttp(ctx: HttpContext) {
  // TypeScript 知道这些属性存在
  const protocol: 'http' | 'https' = ctx.protocol;
  const params = ctx.requestParam?.();
  const body = await ctx.requestBody?.();
}

// gRPC 处理器
function handleGrpc(ctx: GrpcContext) {
  // rpc 属性保证存在（非 undefined）
  const call = ctx.rpc.call;
  const callback = ctx.rpc.callback;
}
```

### 类型安全中间件辅助函数

```typescript
import {
  httpMiddleware,
  grpcMiddleware,
  wsMiddleware,
  graphqlMiddleware
} from 'koatty_core';

// HTTP 中间件 - 自动类型检查和推断
app.use(httpMiddleware(async (ctx, next) => {
  // ctx 自动推断为 HttpContext
  console.log(ctx.protocol); // 'http' | 'https'
  await next();
}));

// gRPC 中间件
app.use(grpcMiddleware(async (ctx, next) => {
  // ctx 自动推断为 GrpcContext
  console.log(ctx.rpc.call);
  await next();
}));

// WebSocket 中间件
app.use(wsMiddleware(async (ctx, next) => {
  // ctx 自动推断为 WebSocketContext
  ctx.websocket.send('message');
  await next();
}));
```

**优势**:
- ✅ 编译时类型检查
- ✅ 自动代码补全
- ✅ 运行时协议验证
- ✅ 更好的错误提示

---

## 中间件开发

### 使用 @Middleware 装饰器

```typescript
import { Middleware, IMiddlewareOptions } from 'koatty_core';

// 基础中间件（应用于所有协议）
@Middleware()
export class LoggerMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      console.log(`${ctx.protocol}: ${ctx.url || 'RPC'}`);
      await next();
    };
  }
}

// 协议限定中间件
@Middleware('HttpBodyParser', {
  protocol: ['http', 'https'],
  priority: 10
})
export class HttpBodyParserMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      // 只在 HTTP/HTTPS 下执行
      ctx.body = await parseBody(ctx.req);
      await next();
    };
  }
}

// 高级配置
@Middleware('RateLimiter', {
  protocol: 'http',
  priority: 5,
  enabled: true,
  maxRequests: 100
})
export class RateLimiterMiddleware {
  run(options: IMiddlewareOptions, app: any) {
    const maxRequests = options.maxRequests || 100;
    
    return async (ctx: any, next: any) => {
      // 限流逻辑
      await next();
    };
  }
}
```

### 使用 MiddlewareLoader

```typescript
import { MiddlewareLoader } from 'koatty_core';

// 加载中间件类
const middleware = MiddlewareLoader.load(
  HttpBodyParserMiddleware,
  { protocol: ['http', 'https'], priority: 10 },
  app
);

app.use(middleware);

// 批量加载和排序
const middlewares = [
  [LoggerMiddleware, { priority: 1 }],
  [AuthMiddleware, { priority: 5 }],
  [BodyParserMiddleware, { priority: 10 }]
];

// 过滤已启用
const enabled = MiddlewareLoader.filterEnabled(middlewares);

// 按优先级排序
const sorted = MiddlewareLoader.sortByPriority(enabled);

// 加载所有中间件
sorted.forEach(([MiddlewareClass, options]) => {
  const mw = MiddlewareLoader.load(MiddlewareClass, options, app);
  app.use(mw);
});
```

### 手动协议检查

```typescript
import { isHttpContext, isGrpcContext } from 'koatty_core';

export class CustomMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      if (isHttpContext(ctx)) {
        // HTTP 特定逻辑
        ctx.set('X-Custom-Header', 'value');
      } else if (isGrpcContext(ctx)) {
        // gRPC 特定逻辑
        ctx.setMetaData('custom', 'value');
      }
      
      await next();
    };
  }
}
```

---

## 最佳实践

### 1. 优先使用协议特定中间件

❌ **不推荐**: 在单个中间件中处理所有协议

```typescript
@Middleware()
export class BadMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      if (ctx.protocol === 'http') {
        // HTTP 逻辑
      } else if (ctx.protocol === 'grpc') {
        // gRPC 逻辑
      } else if (ctx.protocol === 'ws') {
        // WebSocket 逻辑
      }
      await next();
    };
  }
}
```

✅ **推荐**: 使用协议过滤或独立中间件

```typescript
@Middleware('HttpLogger', { protocol: ['http', 'https'] })
export class HttpLoggerMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      // 只处理 HTTP 逻辑
      console.log(`HTTP ${ctx.method} ${ctx.url}`);
      await next();
    };
  }
}

@Middleware('GrpcLogger', { protocol: 'grpc' })
export class GrpcLoggerMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      // 只处理 gRPC 逻辑
      console.log(`gRPC ${ctx.rpc.call.handler?.path}`);
      await next();
    };
  }
}
```

### 2. 使用类型安全辅助函数

```typescript
import { httpMiddleware, grpcMiddleware } from 'koatty_core';

// ✅ 类型安全
app.use(httpMiddleware(async (ctx, next) => {
  // ctx 自动推断为 HttpContext
  const params = ctx.requestParam?.();
  await next();
}));

// ❌ 手动类型断言（容易出错）
app.use(async (ctx: any, next: any) => {
  if (ctx.protocol === 'http') {
    const params = (ctx as HttpContext).requestParam?.();
  }
  await next();
});
```

### 3. 合理设置中间件优先级

```typescript
// 优先级规则：数字越小，优先级越高
@Middleware('ErrorHandler', { priority: 1 })    // 最先执行
@Middleware('Logger', { priority: 5 })          // 次之
@Middleware('Auth', { priority: 10 })           // 认证
@Middleware('BodyParser', { priority: 20 })     // 解析请求体
@Middleware('Router', { priority: 50 })         // 路由（默认）
@Middleware('Compress', { priority: 90 })       // 压缩响应
```

### 4. 避免协议泄漏

❌ **不推荐**: 在 gRPC 中间件中使用 HTTP 特定 API

```typescript
@Middleware('BadGrpcMiddleware', { protocol: 'grpc' })
export class BadGrpcMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      ctx.set('Header', 'value'); // ❌ HTTP API 在 gRPC 中不可用
      await next();
    };
  }
}
```

✅ **推荐**: 使用协议通用 API

```typescript
@Middleware('GoodGrpcMiddleware', { protocol: 'grpc' })
export class GoodGrpcMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      ctx.setMetaData('custom', 'value'); // ✅ 通用 API
      await next();
    };
  }
}
```

### 5. 使用 protocolRouter 简化路由

```typescript
import { protocolRouter } from 'koatty_core';

const authMiddleware = protocolRouter({
  'http': async (ctx, next) => {
    // HTTP JWT 认证
    const token = ctx.get('Authorization');
    await verifyJWT(token);
    await next();
  },
  'grpc': async (ctx, next) => {
    // gRPC metadata 认证
    const metadata = ctx.rpc.call.metadata;
    await verifyMetadata(metadata);
    await next();
  }
});

app.use(authMiddleware);
```

---

## 故障排查

### 常见问题

#### 1. 中间件在错误的协议下执行

**症状**: HTTP 中间件在 gRPC 请求中执行

**原因**: 未正确使用协议过滤

**解决方案**:
```typescript
// ❌ 错误 - 所有协议都会执行
app.use(async (ctx, next) => {
  ctx.body = 'HTTP only'; // gRPC 没有 body 属性
  await next();
});

// ✅ 正确 - 只在 HTTP 下执行
app.use(protocolMiddleware(['http', 'https'], async (ctx, next) => {
  ctx.body = 'HTTP only';
  await next();
}));
```

#### 2. TypeScript 类型错误

**症状**: `Property 'rpc' does not exist on type 'KoattyContext'`

**原因**: 未使用类型守卫

**解决方案**:
```typescript
import { assertGrpcContext } from 'koatty_core';

app.use(async (ctx, next) => {
  // ❌ 错误
  // const call = ctx.rpc.call; // TS Error

  // ✅ 正确
  if (isGrpcContext(ctx)) {
    const call = ctx.rpc.call; // OK
  }
  
  // 或使用断言
  assertGrpcContext(ctx);
  const call = ctx.rpc.call; // OK
  
  await next();
});
```

#### 3. 中间件加载顺序错误

**症状**: 认证中间件在 Body Parser 之前执行

**解决方案**:
```typescript
// 使用 priority 控制顺序
@Middleware('BodyParser', { priority: 10 })
@Middleware('Auth', { priority: 20 }) // 在 BodyParser 之后执行
```

#### 4. Context 属性未定义

**症状**: `ctx.requestParam is not a function`

**原因**: 该属性由特定中间件定义，需要确保中间件已加载

**解决方案**:
```typescript
// 检查属性是否存在
if (ctx.requestParam) {
  const params = ctx.requestParam();
}

// 或使用可选链
const params = ctx.requestParam?.();
```

### 调试技巧

#### 1. 启用协议日志

```typescript
app.use(async (ctx, next) => {
  console.log(`[${ctx.protocol}] Request started`);
  await next();
  console.log(`[${ctx.protocol}] Request finished`);
});
```

#### 2. 检查中间件栈

```typescript
// 在 callback 之后打印中间件栈
const httpCallback = app.callback('http');
console.log('HTTP middleware count:', app.middleware.length);
```

#### 3. 使用 TypeScript 严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

---

## API 参考

### 类型定义

```typescript
// Context 接口
interface KoattyContext extends Koa.Context {
  protocol: string;
  status: number;
  rpc?: { call: IRpcServerCall; callback?: IRpcServerCallback };
  websocket?: IWebSocket;
  getMetaData: (key: string) => any[];
  setMetaData: (key: string, value: unknown) => void;
  sendMetadata: (data?: KoattyMetadata) => void;
  requestParam?: () => unknown;
  requestBody?: () => Promise<unknown>;
}

// 协议特定 Context
interface HttpContext extends KoattyContext {
  protocol: 'http' | 'https';
}

interface GrpcContext extends KoattyContext {
  protocol: 'grpc';
  rpc: NonNullable<KoattyContext['rpc']>;
}

interface WebSocketContext extends KoattyContext {
  protocol: 'ws' | 'wss';
  websocket: NonNullable<KoattyContext['websocket']>;
}

interface GraphQLContext extends KoattyContext {
  protocol: 'graphql';
  graphql: {
    query: string;
    variables: Record<string, any>;
    operationName: string | null;
    schema: any;
    rootValue: any;
    contextValue: KoattyContext;
  };
}

// 中间件选项
interface IMiddlewareOptions {
  protocol?: string | string[];
  priority?: number;
  enabled?: boolean;
  [key: string]: any;
}
```

### 协议辅助函数

```typescript
// 类型守卫（返回 boolean）
function isHttpContext(ctx: KoattyContext): ctx is HttpContext;
function isGrpcContext(ctx: KoattyContext): ctx is GrpcContext;
function isWebSocketContext(ctx: KoattyContext): ctx is WebSocketContext;
function isGraphQLContext(ctx: KoattyContext): ctx is GraphQLContext;

// 断言函数（抛出异常）
function assertHttpContext(ctx: KoattyContext): asserts ctx is HttpContext;
function assertGrpcContext(ctx: KoattyContext): asserts ctx is GrpcContext;
function assertWebSocketContext(ctx: KoattyContext): asserts ctx is WebSocketContext;
function assertGraphQLContext(ctx: KoattyContext): asserts ctx is GraphQLContext;

// 协议过滤
function protocolMiddleware(
  protocols: string | string[],
  middleware: KoattyMiddleware
): KoattyMiddleware;

// 协议路由
function protocolRouter(
  handlers: Record<string, KoattyMiddleware>,
  defaultHandler?: KoattyMiddleware
): KoattyMiddleware;

// 类型安全中间件
function httpMiddleware(
  handler: (ctx: HttpContext, next: KoattyNext) => Promise<any>
): KoattyMiddleware;

function grpcMiddleware(
  handler: (ctx: GrpcContext, next: KoattyNext) => Promise<any>
): KoattyMiddleware;

function wsMiddleware(
  handler: (ctx: WebSocketContext, next: KoattyNext) => Promise<any>
): KoattyMiddleware;

function graphqlMiddleware(
  handler: (ctx: GraphQLContext, next: KoattyNext) => Promise<any>
): KoattyMiddleware;
```

### 装饰器

```typescript
// 中间件装饰器
function Middleware(
  identifier?: string,
  options?: IMiddlewareOptions
): ClassDecorator;

// 控制器装饰器
function Controller(
  path?: string,
  options?: {
    protocol?: 'http' | 'https' | 'grpc' | 'ws' | 'wss' | 'graphql';
    middleware?: string[];
  }
): ClassDecorator;
```

### MiddlewareLoader

```typescript
class MiddlewareLoader {
  // 加载中间件并应用协议过滤
  static load(
    middlewareClass: any,
    options: IMiddlewareOptions,
    app: KoattyApplication
  ): KoattyMiddleware;
  
  // 按优先级排序
  static sortByPriority(
    middlewares: Array<[any, IMiddlewareOptions]>
  ): Array<[any, IMiddlewareOptions]>;
  
  // 过滤已启用的中间件
  static filterEnabled(
    middlewares: Array<[any, IMiddlewareOptions]>
  ): Array<[any, IMiddlewareOptions]>;
}
```

---

## 迁移指南

### 从旧版本迁移

如果你的代码在多协议改造之前编写，以下是迁移建议：

#### 1. 中间件改造

**旧代码**:
```typescript
app.use(async (ctx, next) => {
  // 可能会在所有协议下执行
  ctx.body = 'response';
  await next();
});
```

**新代码**:
```typescript
// 方式 1: 使用协议过滤
app.use(protocolMiddleware(['http', 'https'], async (ctx, next) => {
  ctx.body = 'response';
  await next();
}));

// 方式 2: 使用装饰器
@Middleware('HttpHandler', { protocol: ['http', 'https'] })
export class HttpHandlerMiddleware {
  run(options: any, app: any) {
    return async (ctx: any, next: any) => {
      ctx.body = 'response';
      await next();
    };
  }
}
```

#### 2. 类型改造

**旧代码**:
```typescript
app.use(async (ctx: any, next: any) => {
  if (ctx.rpc) {
    // gRPC 处理
  }
  await next();
});
```

**新代码**:
```typescript
import { grpcMiddleware } from 'koatty_core';

app.use(grpcMiddleware(async (ctx, next) => {
  // ctx 自动推断为 GrpcContext
  const call = ctx.rpc.call;
  await next();
}));
```

---

## 示例项目

完整的示例项目请参考: [examples/multi-protocol-app/](./examples/multi-protocol-app/)

示例包含：
- ✅ HTTP RESTful API
- ✅ gRPC 服务
- ✅ WebSocket 实时通信
- ✅ GraphQL 查询接口
- ✅ 共享认证中间件
- ✅ 协议特定日志
- ✅ TypeScript 完整类型支持

---

## 总结

Koatty Core 的多协议支持提供了：

1. **安全性**: 协议完全隔离，避免相互干扰
2. **灵活性**: 支持单协议、多协议混合部署
3. **类型安全**: 完整的 TypeScript 类型支持
4. **开发体验**: 声明式配置、丰富的辅助函数
5. **性能**: 优化的 Context 创建和中间件执行

遵循本指南的最佳实践，你可以构建健壮、高性能的多协议应用。

---

## 参考资源

- [Koatty 官方文档](https://koatty.js.org)
- [多协议并存分析报告](./MULTI_PROTOCOL_ANALYSIS.md)
- [改造任务计划](./TASK.md)
- [GitHub Issues](https://github.com/koatty/koatty_core/issues)

---

**反馈和贡献**

如有问题或建议，欢迎提交 Issue 或 Pull Request！

