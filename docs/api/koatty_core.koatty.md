<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [koatty\_core](./koatty_core.md) &gt; [Koatty](./koatty_core.koatty.md)

## Koatty class

Koatty Application   Koatty  {<!-- -->Koa<!-- -->}  {<!-- -->BaseApp<!-- -->}

**Signature:**

```typescript
export declare class Koatty extends Koa implements KoattyApplication 
```
**Extends:** Koa

**Implements:** [KoattyApplication](./koatty_core.koattyapplication.md)

## Constructors

<table><thead><tr><th>

Constructor


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[(constructor)(options)](./koatty_core.koatty._constructor_.md)


</td><td>

`protected`


</td><td>

Protected constructor for the Application class. Initializes a new instance with configuration options and sets up the application environment.


</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[appDebug](./koatty_core.koatty.appdebug.md)


</td><td>


</td><td>

boolean


</td><td>


</td></tr>
<tr><td>

[appPath](./koatty_core.koatty.apppath.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
<tr><td>

[context](./koatty_core.koatty.context.md)


</td><td>


</td><td>

[KoattyContext](./koatty_core.koattycontext.md)


</td><td>


</td></tr>
<tr><td>

[ctxStorage](./koatty_core.koatty.ctxstorage.md)


</td><td>


</td><td>

AsyncLocalStorage&lt;unknown&gt;


</td><td>


</td></tr>
<tr><td>

[env](./koatty_core.koatty.env.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
<tr><td>

[koattyPath](./koatty_core.koatty.koattypath.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
<tr><td>

[logsPath](./koatty_core.koatty.logspath.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
<tr><td>

[name](./koatty_core.koatty.name.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
<tr><td>

[options](./koatty_core.koatty.options.md)


</td><td>


</td><td>

[InitOptions](./koatty_core.initoptions.md)


</td><td>


</td></tr>
<tr><td>

[rootPath](./koatty_core.koatty.rootpath.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
<tr><td>

[router](./koatty_core.koatty.router.md)


</td><td>


</td><td>

[KoattyRouter](./koatty_core.koattyrouter.md)


</td><td>


</td></tr>
<tr><td>

[server](./koatty_core.koatty.server.md)


</td><td>


</td><td>

[KoattyServer](./koatty_core.koattyserver.md)


</td><td>


</td></tr>
<tr><td>

[version](./koatty_core.koatty.version.md)


</td><td>


</td><td>

string


</td><td>


</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[callback(protocol, reqHandler)](./koatty_core.koatty.callback.md)


</td><td>


</td><td>

Create a callback function for handling requests.


</td></tr>
<tr><td>

[config(name, type)](./koatty_core.koatty.config.md)


</td><td>


</td><td>

Get configuration value by name and type.


</td></tr>
<tr><td>

[createContext(req, res, protocol)](./koatty_core.koatty.createcontext.md)


</td><td>


</td><td>

Create a Koatty context object.


</td></tr>
<tr><td>

[getMetaData(key)](./koatty_core.koatty.getmetadata.md)


</td><td>


</td><td>

Get metadata by key from application instance


</td></tr>
<tr><td>

[init()](./koatty_core.koatty.init.md)


</td><td>


</td><td>

Initialize application. This method can be overridden in subclasses to perform initialization tasks.


</td></tr>
<tr><td>

[listen(listenCallback)](./koatty_core.koatty.listen.md)


</td><td>


</td><td>

Listening and start server

Since Koa.listen returns an http.Server type, the return value must be defined as 'any' type here. When calling, note that Koatty.listen returns a NativeServer, such as http/https Server or grpcServer or Websocket


</td></tr>
<tr><td>

[setMetaData(key, value)](./koatty_core.koatty.setmetadata.md)


</td><td>


</td><td>

Set metadata value by key.


</td></tr>
<tr><td>

[use(fn)](./koatty_core.koatty.use.md)


</td><td>


</td><td>

Add middleware to the application.


</td></tr>
<tr><td>

[useExp(fn)](./koatty_core.koatty.useexp.md)


</td><td>


</td><td>

Use express-style middleware function. Convert express-style middleware to koa-style middleware.


</td></tr>
</tbody></table>
