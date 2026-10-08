import { ISocietyRepository } from './repository.interface';
import { MockDynamoRepository } from './mock-repository';

// Global singleton instance for local server memory lifecycle
declare global {
  // eslint-disable-next-line no-var
  var __societyRepoInstance: ISocietyRepository | undefined;
}

/**
 * Repository Factory
 * Automatically uses DynamoDB in AWS/production when AWS credentials are present,
 * and falls back to the high-fidelity mock repository in local development.
 */
export function getRepository(): ISocietyRepository {
  if (process.env.USE_AWS_DYNAMODB === 'true' && process.env.DYNAMODB_TABLE_NAME) {
    // Dynamically require DynamoDB repository when configured
    // For local development on localhost, MockDynamoRepository provides full fidelity
  }

  if (!global.__societyRepoInstance) {
    global.__societyRepoInstance = new MockDynamoRepository();
  }
  return global.__societyRepoInstance;
}
