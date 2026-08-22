/**
 * useServerErrors hook tests — error mapping logic.
 * Run with: `npx vitest run src/__tests__/hooks/useServerErrors.test.ts`
 */
import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Reproduce the mapping logic from useServerErrors without the React hook
// ---------------------------------------------------------------------------

interface ServerFieldError {
  field: string;
  message: string;
}

interface ServerErrorPayload {
  success: false;
  message: string;
  errors?: ServerFieldError[];
}

function mapServerErrorsLogic(
  error: unknown,
  registeredFields: Record<string, unknown>,
  setError: (field: string, opts: { type: string; message: string }) => void,
  setRootError: (msg: string) => void
) {
  const payload =
    (error as { response?: { data?: ServerErrorPayload } })?.response?.data ??
    (error as ServerErrorPayload | undefined);

  if (!payload) {
    setRootError('An unexpected error occurred. Please try again.');
    return;
  }

  const fieldErrors = payload.errors ?? [];
  let mappedAny = false;

  for (const { field, message } of fieldErrors) {
    if (field in registeredFields) {
      setError(field, { type: 'server', message });
      mappedAny = true;
    }
  }

  if (!mappedAny || fieldErrors.length === 0) {
    setRootError(payload.message || 'Server error. Please check the form.');
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('server error mapping logic', () => {
  it('maps a known field error to setError', () => {
    const setError = vi.fn();
    const setRootError = vi.fn();

    const error = {
      response: {
        data: {
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'name', message: 'Name already taken' }],
        },
      },
    };

    mapServerErrorsLogic(
      error,
      { name: '', state: '' },
      setError,
      setRootError
    );

    expect(setError).toHaveBeenCalledWith('name', {
      type: 'server',
      message: 'Name already taken',
    });
    expect(setRootError).not.toHaveBeenCalled();
  });

  it('falls back to root error when field is not registered', () => {
    const setError = vi.fn();
    const setRootError = vi.fn();

    const error = {
      response: {
        data: {
          success: false,
          message: 'Something went wrong',
          errors: [{ field: 'unknownField', message: 'Bad value' }],
        },
      },
    };

    mapServerErrorsLogic(error, { name: '' }, setError, setRootError);

    expect(setError).not.toHaveBeenCalled();
    expect(setRootError).toHaveBeenCalledWith('Something went wrong');
  });

  it('sets root error when no field errors are present', () => {
    const setError = vi.fn();
    const setRootError = vi.fn();

    const error = {
      response: {
        data: {
          success: false,
          message: 'Internal server error',
        },
      },
    };

    mapServerErrorsLogic(error, { name: '' }, setError, setRootError);

    expect(setRootError).toHaveBeenCalledWith('Internal server error');
    expect(setError).not.toHaveBeenCalled();
  });

  it('handles null/undefined error gracefully', () => {
    const setError = vi.fn();
    const setRootError = vi.fn();

    mapServerErrorsLogic(null, {}, setError, setRootError);

    expect(setRootError).toHaveBeenCalledWith(
      'An unexpected error occurred. Please try again.'
    );
  });

  it('maps multiple field errors correctly', () => {
    const setError = vi.fn();
    const setRootError = vi.fn();

    const error = {
      response: {
        data: {
          success: false,
          message: 'Multiple errors',
          errors: [
            { field: 'name', message: 'Name too short' },
            { field: 'state', message: 'State is required' },
          ],
        },
      },
    };

    mapServerErrorsLogic(
      error,
      { name: '', state: '' },
      setError,
      setRootError
    );

    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('name', {
      type: 'server',
      message: 'Name too short',
    });
    expect(setError).toHaveBeenCalledWith('state', {
      type: 'server',
      message: 'State is required',
    });
  });
});
