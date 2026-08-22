/**
 * Program schema unit tests.
 * Run with: `npx vitest run src/__tests__/schemas/program.schema.test.ts`
 */
import { describe, it, expect } from 'vitest';
import {
  programFormSchema,
  programFormDefaults,
} from '../../lib/schemas/program.schema';

describe('programFormSchema', () => {
  const baseValid = {
    ...programFormDefaults,
    name: 'Bachelor of Computer Science',
    field: 'Information Technology',
    university: 'uni-abc-123',
    level: 'bachelor',
    campusMode: 'on-campus',
  } as const;

  it('accepts valid minimal input', async () => {
    const result = await programFormSchema.safeParseAsync(baseValid);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing university', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      university: '',
    });
    expect(result.success).toBe(false);
  });

  it('transforms tuitionFeeLocal string to number', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      tuitionFeeLocal: '38000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tuitionFeeLocal).toBe(38000);
      expect(typeof result.data.tuitionFeeLocal).toBe('number');
    }
  });

  it('transforms intakeMonths CSV to array', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      intakeMonths: 'February, July, November',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intakeMonths).toEqual([
        'February',
        'July',
        'November',
      ]);
    }
  });

  it('transforms careerPathways CSV to array', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      careerPathways: 'Software Engineer, Data Scientist',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.careerPathways).toEqual([
        'Software Engineer',
        'Data Scientist',
      ]);
    }
  });

  it('conditional CRICOS: cricosCourseCode can be empty without errors', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      cricosCourseCode: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid website URL', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      website: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty website URL (optional)', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      website: '',
    });
    expect(result.success).toBe(true);
  });

  it('transforms empty numeric string fields to undefined', async () => {
    const result = await programFormSchema.safeParseAsync({
      ...baseValid,
      tuitionFeeLocal: '',
      tuitionFeeInternational: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tuitionFeeLocal).toBeUndefined();
      expect(result.data.tuitionFeeInternational).toBeUndefined();
    }
  });
});
