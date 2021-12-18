<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [koatty\_core](./koatty_core.md) &gt; [KoattyMetadata](./koatty_core.koattymetadata.md)

## KoattyMetadata class

KoattyMetadata

  KoattyMetadata

<b>Signature:</b>

```typescript
export declare class KoattyMetadata extends Metadata 
```
<b>Extends:</b> Metadata

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [internalRepr](./koatty_core.koattymetadata.internalrepr.md) |  | Map&lt;string, any\[\]&gt; |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [add(key, value)](./koatty_core.koattymetadata.add.md) |  | Adds the given value for the given key by appending to a list of previous values associated with that key. |
|  [clone()](./koatty_core.koattymetadata.clone.md) |  | Clones the metadata object.  The newly cloned object. |
|  [from(obj)](./koatty_core.koattymetadata.from.md) | <code>static</code> | copy all key-value pairs from a given object into this new Metadata. |
|  [get(key)](./koatty_core.koattymetadata.get.md) |  | Gets a list of all values associated with the key. Normalizes the key. |
|  [getMap()](./koatty_core.koattymetadata.getmap.md) |  | Gets a plain object mapping each key to the first value associated with it. This reflects the most common way that people will want to see metadata.  A key/value mapping of the metadata. |
|  [merge(other)](./koatty_core.koattymetadata.merge.md) |  | Merges all key-value pairs from a given Metadata object into this one. If both this object and the given object have values in the same key, values from the other Metadata object will be appended to this object's values. |
|  [remove(key)](./koatty_core.koattymetadata.remove.md) |  | Removes the given key and any associated values. Normalizes the key. |
|  [set(key, value)](./koatty_core.koattymetadata.set.md) |  | Set the given value for the given key |
|  [toJSON()](./koatty_core.koattymetadata.tojson.md) |  | This modifies the behavior of JSON.stringify to show an object representation of the metadata map. |
