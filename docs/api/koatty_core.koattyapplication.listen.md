<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [koatty\_core](./koatty_core.md) &gt; [KoattyApplication](./koatty_core.koattyapplication.md) &gt; [listen](./koatty_core.koattyapplication.listen.md)

## KoattyApplication.listen property

Listening and start server

Since Koa.listen returns an http.Server type, the return value must be defined as 'any' type here. When calling, note that Koatty.listen returns a NativeServer, such as http/https Server or grpcServer or Websocket

**Signature:**

```typescript
readonly listen: (listenCallback?: any) => any;
```
