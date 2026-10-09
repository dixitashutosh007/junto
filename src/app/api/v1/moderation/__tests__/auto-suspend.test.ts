import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeRequest, resetRepository } from '@/test/route-helpers';
import { resetRateLimits } from '@/lib/rate-limit';
import { MockDynamoRepository } from '@/lib/db/mock-repository';
import * as reports from '../reports/route';

const SOCIETY = 'soc-ggh-001';
const SEEKER = 'usr-seeker-001';
const OFFENDER = 'usr-offerer-002';
const SOCIETY_ADMIN = 'usr-admin-001';

type Handler = (req: NextRequest) => Promise<Response>;

function as(userId: string, handler: Handler, options: { method?: string; body?: unknown } = {}) {
  return handler(
    makeRequest('/api/v1/moderation/reports', {
      ...options,
      headers: { 'x-dev-user-id': userId, 'x-society-id': SOCIETY },
    })
  );
}

let repo: MockDynamoRepository;

beforeEach(() => {
  repo = resetRepository();
  resetRateLimits();
});

async function fileReport(reportedUserId = OFFENDER): Promise<string> {
  const res = await as(SEEKER, reports.POST, {
    method: 'POST',
    body: { reportedUserId, category: 'NO_SHOW', description: 'Did not turn up for the ride' },
  });
  expect(res.status).toBe(200);
  return (await res.json()).report.id;
}

async function decide(reportId: string, status: 'RESOLVED' | 'DISMISSED') {
  const res = await as(SOCIETY_ADMIN, reports.PATCH, { method: 'PATCH', body: { reportId, status } });
  expect(res.status).toBe(200);
  return (await res.json()) as { autoSuspended: boolean };
}

describe('5.5 auto-restrict after upheld reports', () => {
  it('suspends a resident on the third upheld report, and tells them', async () => {
    expect((await decide(await fileReport(), 'RESOLVED')).autoSuspended).toBe(false);
    expect((await decide(await fileReport(), 'RESOLVED')).autoSuspended).toBe(false);
    expect((await repo.getMembership(SOCIETY, OFFENDER))?.status).toBe('ACTIVE');

    expect((await decide(await fileReport(), 'RESOLVED')).autoSuspended).toBe(true);
    expect((await repo.getMembership(SOCIETY, OFFENDER))?.status).toBe('SUSPENDED');
    expect((await repo.listUserNotifications(SOCIETY, OFFENDER)).some((n) => n.title === 'Your access is paused')).toBe(true);
    expect((await repo.listAuditEvents(SOCIETY)).some((e) => e.action === 'MEMBER_AUTO_SUSPENDED')).toBe(true);
  });

  it('does not count dismissed reports', async () => {
    await decide(await fileReport(), 'RESOLVED');
    await decide(await fileReport(), 'RESOLVED');
    expect((await decide(await fileReport(), 'DISMISSED')).autoSuspended).toBe(false);
    expect((await repo.getMembership(SOCIETY, OFFENDER))?.status).toBe('ACTIVE');
  });

  it('never suspends an admin automatically', async () => {
    for (let i = 0; i < 3; i++) await decide(await fileReport(SOCIETY_ADMIN), 'RESOLVED');
    expect((await repo.getMembership(SOCIETY, SOCIETY_ADMIN))?.status).toBe('ACTIVE');
  });
});
