import { NextRequest } from 'next/server';
import { MockDynamoRepository } from '@/lib/db/mock-repository';

/**
 * Test helpers for calling App Router route handlers directly.
 * Route tests run against a fresh, seeded MockDynamoRepository.
 */

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

export function makeRequest(path: string, options: RequestOptions = {}): NextRequest {
  const { method = 'GET', body, headers = {}, cookies = {} } = options;

  const allHeaders: Record<string, string> = { ...headers };
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('; ');
  if (cookieHeader) allHeaders.cookie = cookieHeader;
  if (body !== undefined) allHeaders['content-type'] = 'application/json';

  return new NextRequest(new URL(path, 'http://localhost:3000'), {
    method,
    headers: allHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Replaces the global repository singleton used by getRepository() with a
 * freshly seeded mock, so each test starts from known data.
 */
export function resetRepository(): MockDynamoRepository {
  const repo = new MockDynamoRepository();
  global.__societyRepoInstance = repo;
  return repo;
}
