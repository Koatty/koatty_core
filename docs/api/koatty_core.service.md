<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [koatty\_core](./koatty_core.md) &gt; [Service](./koatty_core.service.md)

## Service() function

Service decorator, used to mark a class as a service component. The decorated class will be registered in the IOC container.

**Signature:**

```typescript
export declare function Service(identifier?: string): ClassDecorator;
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

identifier


</td><td>

string


</td><td>

_(Optional)_ Optional service identifier. If not provided, will use the class name.


</td></tr>
</tbody></table>
**Returns:**

ClassDecorator

ClassDecorator

## Example

\`\`\`<!-- -->ts @<!-- -->Service() export class UserService { // do something }

