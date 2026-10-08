import { ISocietyRepository } from './repository.interface';
import { MockDynamoRepository } from './mock-repository';
import { FirestoreRepository } from './firestore-repository';

// Global singleton instance for local server memory lifecycle
declare global {
  // eslint-disable-next-line no-var
  var __societyRepoInstance: ISocietyRepository | undefined;
}

/**
 * Repository Factory
 * Automatically uses Google Cloud Firestore in production when USE_FIRESTORE is true
 * or when FIREBASE_SERVICE_ACCOUNT_KEY is present in AWS Amplify / .env.local,
 * and falls back seamlessly to the high-fidelity MockDynamoRepository during local development.
 */
export function getRepository(): ISocietyRepository {
  if (global.__societyRepoInstance) {
    return global.__societyRepoInstance;
  }

  const useFirestore =
    process.env.USE_FIRESTORE === 'true' ||
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  if (useFirestore) {
    console.info('🚀 SocietyApps: Initializing Google Cloud Firestore repository');
    global.__societyRepoInstance = new FirestoreRepository();
  } else {
    global.__societyRepoInstance = new MockDynamoRepository();
  }

  return global.__societyRepoInstance;
}
