// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Job, QueueBaseOptions } from 'bullmq';
import { Queue, Worker } from 'bullmq';
import { tryGetRequestContext, tryRunInRequestContext } from '../context';
import { GLOBAL_SHARD_ID } from '../fhir/sharding';
import { globalLogger } from '../logger';
import type { WorkerInitializer, WorkerInitializerOptions } from './utils';
import { addVerboseQueueLogging, getBullmqRedisConnectionOptions, getWorkerBullmqConfig, queueRegistry } from './utils';

export interface ShardSyncJobData {
  readonly shardId: string;
  readonly requestId?: string;
  readonly traceId?: string;
}

const queueName = 'ShardSyncQueue';

export const initShardSyncWorker: WorkerInitializer = (config, options?: WorkerInitializerOptions) => {
  const defaultOptions: QueueBaseOptions = {
    connection: getBullmqRedisConnectionOptions(config),
  };

  const queue = new Queue<ShardSyncJobData>(queueName, {
    ...defaultOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });

  let worker: Worker<ShardSyncJobData> | undefined;
  if (options?.workerEnabled !== false) {
    const workerBullmq = getWorkerBullmqConfig(config, 'shard-sync');
    worker = new Worker<ShardSyncJobData>(
      queueName,
      (job) => tryRunInRequestContext(job.data.requestId, job.data.traceId, () => execShardSyncJob(job)),
      {
        ...defaultOptions,
        ...workerBullmq,
      }
    );
    addVerboseQueueLogging<ShardSyncJobData>(queue, worker, (job) => ({
      shardId: job.data.shardId,
    }));
  }

  return { queue, worker, name: queueName };
};

/**
 * Executes a shard sync job.
 * @param job - The shard sync job details.
 */
export async function execShardSyncJob(job: Job<ShardSyncJobData>): Promise<void> {
  const shardId = job.data.shardId;

  if (shardId === GLOBAL_SHARD_ID) {
    globalLogger.info('Shard sync not allowed against the global shard');
    return;
  }
  globalLogger.info('Executing shard sync job', { jobData: job.data });

  // fetch the first N items from shard_sync_outbox ordering by id ascending.
  // get the content of each resource from the shard. Can this be done in a single query/join between the shard_sync_outbox and the resources tables? It'd probably be ugly since there are multiple resource types.
  // If the version is already the same on global, it should be a no-op that gets logged since that's unexpected.
  // otherwise, update the resource content to the global shard. This should not trigger most (any?) background jobs that normally would be triggered by a resource update. Referential integrity shouldn't be enforced.
  // delete the rows from shard_sync_outbox
  // repeat until all items are processed with a configurable delay between chunks.
  // Log the results

  // Open questions:
  // should a column be added to resource tables to distinguish synced rows from natural rows?
  // what happens if two jobs run concurrently against the same shardId? Should an advisory lock be used to ensure only one job runs at a time? Or SELECT ... FOR UPDATE SKIP LOCKED?
}

/**
 * Returns the shard sync queue instance.
 * This is used by the unit tests.
 * @returns The shard sync queue (if available).
 */
export function getShardSyncQueue(): Queue<ShardSyncJobData> | undefined {
  return queueRegistry.get(queueName);
}

async function addShardSyncJobData(jobData: ShardSyncJobData): Promise<Job<ShardSyncJobData>> {
  const queue = getShardSyncQueue();
  if (!queue) {
    throw new Error(`Job queue ${queueName} not available`);
  }
  return queue.add('ShardSyncJobData', jobData);
}

export interface ShardSyncJobOptions {}

export async function addReindexJob(shardId: string, options?: ShardSyncJobOptions): Promise<Job<ShardSyncJobData>> {
  const jobData = prepareShardSyncJobData(shardId, options);
  return addShardSyncJobData(jobData);
}

export function prepareShardSyncJobData(shardId: string, _options?: ShardSyncJobOptions): ShardSyncJobData {
  const ctx = tryGetRequestContext();

  return {
    shardId,
    requestId: ctx?.requestId,
    traceId: ctx?.traceId,
  };
}
