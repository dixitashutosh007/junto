import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/api-auth';

/**
 * Parses and validates a JSON request body. Returns the data, or a 400
 * response to return as-is:
 *
 *   const body = await parseBody(req, Schema);
 *   if (body instanceof NextResponse) return body;
 */
export async function parseBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T> | NextResponse> {
  const raw = await req.json().catch(() => undefined);
  const result = schema.safeParse(raw ?? {});
  if (!result.success) {
    return errorResponse(result.error.issues[0]?.message || 'Invalid request');
  }
  return result.data;
}

/** Same as parseBody for URL query parameters */
export function parseQuery<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): z.infer<T> | NextResponse {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return errorResponse(result.error.issues[0]?.message || 'Invalid query parameters');
  }
  return result.data;
}
