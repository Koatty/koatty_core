/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: BSD (3-Clause)
 * @ version: 2020-07-06 11:21:37
 */

/**
 * KoattyMetadata
 *
 * @export
 * @class KoattyMetadata
 */
export class KoattyMetadata {
  protected _internalRepo = new Map<string, any[]>();
  /**
   * Set the given value for the given key
   */
  set(key: string, value: any): void {
    this._internalRepo.set(key, [value]);
  }
  /**
   * Adds the given value for the given key by appending to a list of previous
   * values associated with that key. 
   */
  add(key: string, value: any): void {
    const existingValue: any[] | undefined = this._internalRepo.get(
      key
    );
    if (existingValue === undefined) {
      this._internalRepo.set(key, [value]);
    } else {
      existingValue.push(value);
    }
  }
  /**
   * Removes the given key and any associated values. Normalizes the key.
   * @param key The key whose values should be removed.
   */
  remove(key: string): void {
    this._internalRepo.delete(key);
  }
  /**
   * Gets a list of all values associated with the key. Normalizes the key.
   * @param key The key whose value should be retrieved.
   * @return A list of values associated with the given key.
   */
  get(key: string): any[] {
    let existingValue: any[] | undefined = this._internalRepo.get(
      key
    );
    existingValue = existingValue || [];
    return existingValue;
  }
  /**
   * Gets a plain object mapping each key to the first value associated with it.
   * This reflects the most common way that people will want to see metadata.
   * @return A key/value mapping of the metadata.
   */
  getMap(): {
    [key: string]: any;
  } {
    const result: { [key: string]: any } = {};

    this._internalRepo.forEach((values, key) => {
      if (values.length > 0) {
        const v = values[0];
        result[key] = v instanceof Buffer ? Buffer.from(v) : v;
      }
    });
    return result;
  }
  /**
   * Clones the metadata object.
   * @return The newly cloned object.
   */
  clone(): KoattyMetadata {
    const newMetadata = new KoattyMetadata();
    const newInternalRepr = newMetadata._internalRepo;

    this._internalRepo.forEach((value, key) => {
      const clonedValue: any[] = value.map((v) => {
        if (v instanceof Buffer) {
          return Buffer.from(v);
        } else {
          return v;
        }
      });

      newInternalRepr.set(key, clonedValue);
    });

    return newMetadata;
  }
  /**
   * Merges all key-value pairs from a given Metadata object into this one.
   * If both this object and the given object have values in the same key,
   * values from the other Metadata object will be appended to this object's
   * values.
   * @param other A Metadata object.
   */
  merge(other: KoattyMetadata): void {
    other._internalRepo.forEach((values: any, key: string) => {
      const mergedValue: any[] = (
        this._internalRepo.get(key) || []
      ).concat(values);

      this._internalRepo.set(key, mergedValue);
    });
  }
  /**
   * copy all key-value pairs from a given object into this new Metadata.
   *
   */
  static from(obj: {
    [key: string]: any;
  }): KoattyMetadata {
    const metadata = new this();
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const values = obj[key];
        metadata._internalRepo.set(key, values);
      }
    }
    return metadata;
  }
  /**
   * This modifies the behavior of JSON.stringify to show an object
   * representation of the metadata map.
   */
  toJSON(): {
    [key: string]: any;
  } {
    const result: { [key: string]: any[] } = {};
    for (const [key, values] of this._internalRepo.entries()) {
      result[key] = values;
    }
    return result;
  }
}