import { ISocietyRepository } from './repository.interface';
import { MockDynamoRepository } from './mock-repository';
import { FirestoreRepository } from './firestore-repository';
import { hasFirebaseCredentials } from '../firebase/admin';

// Global singleton instance for local server memory lifecycle
declare global {
  var __societyRepoInstance: ISocietyRepository | undefined;
}

/**
 * Repository Factory
 * Automatically uses Google Cloud Firestore in production when USE_FIRESTORE is true
 * or when FIREBASE_SERVICE_ACCOUNT_KEY is present in AWS Amplify / .env.local,
 * and falls back to the seeded MockDynamoRepository during local development and tests.
 *
 * In production a missing Firestore configuration is a hard error: the mock
 * repository holds demo admin accounts and loses all data on restart.
 */
export function getRepository(): ISocietyRepository {
  if (global.__societyRepoInstance) {
    return global.__societyRepoInstance;
  }

  const useFirestore = process.env.USE_FIRESTORE === 'true' || hasFirebaseCredentials();

  if (!useFirestore && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Firestore is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (or _B64) in the production environment.'
    );
  }

  if (useFirestore) {
    console.info('Junto: initializing Google Cloud Firestore repository');
    global.__societyRepoInstance = new FirestoreRepository();
  } else {
    global.__societyRepoInstance = new MockDynamoRepository();
  }

  return global.__societyRepoInstance;
}
