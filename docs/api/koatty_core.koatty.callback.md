<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [koatty\_core](./koatty_core.md) &gt; [Koatty](./koatty_core.koatty.md) &gt; [callback](./koatty_core.koatty.callback.md)

## Koatty.callback() method

Create a callback function for handling requests.

**Signature:**

```typescript
callback(protocol?: string, reqHandler?: (ctx: KoattyContext) => Promise<any>): (req: RequestType, res: ResponseType) => Promise<any>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

protocol


</td><td>

string


</td><td>

_(Optional)_ The protocol type, defaults to "http"


</td></tr>
<tr><td>

reqHandler


</td><td>

(ctx: [KoattyContext](./koatty_core.koattycontext.md)<!-- -->) =&gt; Promise&lt;any&gt;


</td><td>

_(Optional)_ Optional request handler function for processing requests


</td></tr>
</tbody></table>
**Returns:**

(req: [RequestType](./koatty_core.requesttype.md)<!-- -->, res: [ResponseType](./koatty_core.responsetype.md)<!-- -->) =&gt; Promise&lt;any&gt;

A function that handles incoming requests with the configured middleware stack \`\`\`

