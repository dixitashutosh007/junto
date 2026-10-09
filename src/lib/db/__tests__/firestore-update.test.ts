import { describe, it, expect, vi } from 'vitest';
import { FieldValue } from 'firebase-admin/firestore';

vi.mock('@/lib/firebase/admin', async () => (await import('@/test/firebase-admin-mock')).firebaseAdminMock);

const { toFirestoreUpdate } = await import('../firestore-repository');

describe('toFirestoreUpdate', () => {
  it('removes fields set to undefined instead of sending undefined, which Firestore rejects', () => {
    // A profile saved with a typed (not picked) work location clears its coordinates
    const update = toFirestoreUpdate({ workLocationName: 'Typed place', workLatitude: undefined, workLongitude: undefined });
    expect(update.workLocationName).toBe('Typed place');
    expect(update.workLatitude).toEqual(FieldValue.delete());
    expect(update.workLongitude).toEqual(FieldValue.delete());
  });

  it('passes other values through unchanged', () => {
    expect(toFirestoreUpdate({ fullName: 'Asha', seats: 0, active: false, note: null })).toEqual({
      fullName: 'Asha',
      seats: 0,
      active: false,
      note: null,
    });
  });
});
