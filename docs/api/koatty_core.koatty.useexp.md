<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [koatty\_core](./koatty_core.md) &gt; [Koatty](./koatty_core.koatty.md) &gt; [useExp](./koatty_core.koatty.useexp.md)

## Koatty.useExp() method

Use express-style middleware function. Convert express-style middleware to koa-style middleware.

**Signature:**

```typescript
useExp(fn: Function): any;
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

fn


</td><td>

Function


</td><td>

Express-style middleware function


</td></tr>
</tbody></table>
**Returns:**

any

{<!-- -->any<!-- -->} Returns the result of middleware execution

## Exceptions

{<!-- -->Error<!-- -->} When parameter is not a function

