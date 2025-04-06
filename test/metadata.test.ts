import { KoattyMetadata } from '../src/Metadata';

describe('KoattyMetadata', () => {
  let metadata: KoattyMetadata;

  beforeEach(() => {
    metadata = new KoattyMetadata();
  });

  describe('set', () => {
    it('should store non-array value as array', () => {
      metadata.set('key1', 'value1');
      expect(metadata.get('key1')).toEqual(['value1']);
    });

    it('should store array value directly', () => {
      metadata.set('key2', ['value2', 'value3']);
      expect(metadata.get('key2')).toEqual(['value2', 'value3']);
    });
  });

  describe('add', () => {
    it('should append non-array value to existing array', () => {
      metadata.set('key1', 'value1');
      metadata.add('key1', 'value2');
      expect(metadata.get('key1')).toEqual(['value1', 'value2']);
    });

    it('should merge array value with existing array', () => {
      metadata.set('key1', ['value1']);
      metadata.add('key1', ['value2', 'value3']);
      expect(metadata.get('key1')).toEqual(['value1', 'value2', 'value3']);
    });

    it('should create new array when key not exists', () => {
      metadata.add('newKey', 'value1');
      expect(metadata.get('newKey')).toEqual(['value1']);
    });
  });

  describe('integration', () => {
    it('should handle mixed array and non-array values', () => {
      metadata.set('mixed', 'value1');
      metadata.add('mixed', ['value2', 'value3']);
      metadata.add('mixed', 'value4');
      expect(metadata.get('mixed')).toEqual(['value1', 'value2', 'value3', 'value4']);
    });
  });
});
