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

## API文档

详细API文档请参考: [API文档](./docs/api)

## 贡献指南

欢迎提交Pull Request或报告Issue。在提交代码前请确保:

1. 运行测试: `npm test`
2. 遵循代码风格: `npm run eslint`

## 许可证

BSD 3-Clause License

Copyright (c) 2020-present, richenlin@gmail.com
