# Koatty Core

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![npm version](https://badge.fury.io/js/koatty_core.svg)](https://badge.fury.io/js/koatty_core)

Koatty框架核心模块，基于Koa的Node.js应用框架。

## 特性

- 基于Koa的轻量级核心
- 支持HTTP、gRPC、WebSocket、GraphQL多种协议
- 内置应用生命周期管理
- 强大的中间件支持
- 灵活的配置管理
- 完善的错误处理机制
- 请求追踪和性能监控
- 元数据管理
- **高性能优化**：
  - 上下文对象池化复用，减少GC压力
  - 元数据缓存机制，提升访问性能
  - 预编译方法缓存，避免重复创建
  - 工厂模式优化，支持单例复用
  - 内存使用优化，防止内存泄漏

## 安装

```bash
npm install koatty_core --save
```

## 快速开始

```typescript
import { Koatty } from 'koatty_core';

class MyApp extends Koatty {
  init() {
    this.appDebug = true;
    this.name = 'MyApp';
    this.version = '1.0.0';
  }
}

const app = new MyApp();

app.use(async (ctx, next) => {
  ctx.body = 'Hello Koatty!';
  await next();
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 性能优化

Koatty Core在性能方面进行了多项优化：

### 上下文池化
- 实现了上下文对象池，复用HTTP/HTTPS上下文对象
- 减少对象创建和垃圾回收的开销
- 支持池大小配置和统计监控

### 元数据缓存
- `KoattyMetadata`类实现了`getMap()`结果缓存
- 避免重复的对象转换操作
- 在数据变更时自动失效缓存

### 方法预编译
- 预编译常用方法到缓存中，避免重复创建
- 使用单例工厂模式减少实例化开销
- 优化属性定义和方法绑定流程

### 性能指标
根据性能测试结果：
- HTTP上下文创建：平均 < 0.1ms/个
- GraphQL上下文创建：平均 < 0.2ms/个  
- 元数据操作：平均 < 0.01ms/次
- 并发处理能力：> 10,000 ops/sec
- 内存使用：10k上下文增长 < 100MB

### 性能测试
运行性能测试：
```bash
npm test -- test/performance.test.ts
```

## API文档

详细API文档请参考: [API文档](./docs/api)

## 贡献指南

欢迎提交Pull Request或报告Issue。在提交代码前请确保:

1. 运行测试: `npm test`
2. 遵循代码风格: `npm run eslint`

## 许可证

BSD 3-Clause License

Copyright (c) 2020-present, richenlin@gmail.com
