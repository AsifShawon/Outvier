/**
 * University schema unit tests.
 *
 * Prerequisites:
 *   Install a test runner (e.g. vitest or jest) and ts-jest / vitest configs.
 *   Example: `npm install -D vitest @vitest/runner`
 *   Then run: `npx vitest run src/__tests__/schemas/university.schema.test.ts`
 */
import { describe, it, expect } from 'vitest';
import {
  universityFormSchema,
  universityFormDefaults,
} from '../../lib/schemas/university.schema';

describe('universityFormSchema', () => {
  it('rejects a name shorter than 2 characters', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'A',
      state: 'SA',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) =>
        i.path.includes('name')
      );
      expect(nameError).toBeDefined();
    }
  });

  it('rejects a description shorter than 10 characters', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'Short',
      state: 'SA',
    });
    expect(result.success).toBe(false);
  });

  it('transforms establishedYear string to number on output', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
      establishedYear: '1874',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.establishedYear).toBe(1874);
      expect(typeof result.data.establishedYear).toBe('number');
    }
  });

  it('transforms ranking string to number on output', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
      ranking: '100',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ranking).toBe(100);
    }
  });

  it('transforms campuses CSV string to array on output', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
      campuses: 'North Terrace, Mawson Lakes, City West',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campuses).toEqual([
        'North Terrace',
        'Mawson Lakes',
        'City West',
      ]);
    }
  });

  it('treats empty campuses string as empty array', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
      campuses: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campuses).toEqual([]);
    }
  });

  it('rejects an invalid website URL', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
      website: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts an empty website URL (optional field)', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
      website: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts default values without errors', async () => {
    const result = await universityFormSchema.safeParseAsync({
      ...universityFormDefaults,
      name: 'Test University',
      description: 'A valid description for testing purposes',
      state: 'SA',
    });
    expect(result.success).toBe(true);
  });
});
