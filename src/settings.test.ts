import { describe, expect, it } from 'vitest';
import { loadableDisabledNodeTypes } from './settings';

describe('loadableDisabledNodeTypes', () => {
  it('returns an empty list when the settings file has no disabled node types', () => {
    expect(loadableDisabledNodeTypes(undefined)).toEqual([]);
  });

  it('keeps disableable core node types as-is', () => {
    expect(loadableDisabledNodeTypes(['text-replace', 'note'])).toEqual(['text-replace', 'note']);
  });

  it('drops types whose definition is locked on (disableable: false)', () => {
    expect(loadableDisabledNodeTypes(['input'])).toEqual([]);
    expect(loadableDisabledNodeTypes(['output', 'text-replace'])).toEqual(['text-replace']);
  });

  it('keeps unknown type strings for forward compatibility', () => {
    expect(loadableDisabledNodeTypes(['com.example/plugin-node', 'someday-node'])).toEqual([
      'com.example/plugin-node',
      'someday-node',
    ]);
  });

  it('filters only the locked types out of a mixed list', () => {
    expect(loadableDisabledNodeTypes(['input', 'combiner', 'output'])).toEqual(['combiner']);
  });
});
