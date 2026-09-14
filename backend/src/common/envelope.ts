/**
 * Every JSON response uses the same shape so clients never branch on
 * status code to find the payload: `{ data, error: null }` on success,
 * `{ data: null, error: { code, message, details? } }` on failure.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface Envelope<T> {
  data: T | null;
  error: ApiError | null;
}

export const ok = <T>(data: T): Envelope<T> => ({ data, error: null });

export const fail = (error: ApiError): Envelope<never> => ({ data: null, error });
