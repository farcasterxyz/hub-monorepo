import { BulkJobOptions, Job, JobsOptions, Queue, SandboxedJob } from "bullmq";
import { HubRpcClient } from "@farcaster/hub-nodejs";
import { Redis } from "ioredis";
import path from "path";
import fs from "fs";
import { DB } from "./db.js";
import { Logger } from "./log.js";
import { AssertionError } from "./error.js";
import { REDIS_URL } from "./env.js";
import { JSONValue } from "./util.js";
import { getRedisClient } from "./redis.js";

export const JOB_QUEUES = {
  default: new Queue("default", {
    connection: getRedisClient(REDIS_URL),
  }),
};

type QueueName = keyof typeof JOB_QUEUES;

type UtilArgs = { db: DB; redis: Redis; log: Logger; hub: HubRpcClient };

interface JobEnqueuer<TReturn, TJobName extends string, TArgs extends JSONValue | undefined = undefined> {
  name: TJobName;
  run: (args: TArgs, utils: UtilArgs) => Promise<TReturn>;
  enqueue(args: TArgs, jobOptions?: JobsOptions): Promise<Job<TArgs, TReturn, TJobName>>;
  enqueueBulk(
    jobDefs: Array<{ args: TArgs; bulkJobOptions?: BulkJobOptions }>,
  ): Promise<Job<TArgs, TReturn, TJobName>[]>;
}

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
const registeredJobTypes = new Map<string, JobEnqueuer<any, string, any>>();

const GLOBAL_DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 20,
  backoff: {
    type: "exponential",
    delay: 1_000,
  },
} as const;

export const registerJob = <TJobName extends string, TReturn, TArgs extends JSONValue | undefined = undefined>({
  name,
  run,
  opts = {},
  queue = "default",
}: {
  name: TJobName;
  run: (args: TArgs, utils: UtilArgs) => Promise<TReturn>;
  opts?: JobsOptions;
  queue?: QueueName;
}) => {
  const defaultOptionsForJobType = { ...GLOBAL_DEFAULT_JOB_OPTIONS, ...opts };
  const jobEnqueuer = {
    name,
    run,
    async enqueue(args: TArgs, jobOptions: JobsOptions = {}): Promise<Job<TArgs, TReturn, TJobName>> {
      const job = await JOB_QUEUES[queue].add(name, args, { ...defaultOptionsForJobType, ...jobOptions });
      return job as Job<TArgs, TReturn, TJobName>;
    },
    async enqueueBulk(
      jobDefs: Array<{ args: TArgs; bulkJobOptions?: BulkJobOptions }>,
    ): Promise<Job<TArgs, TReturn, TJobName>[]> {
      const jobs = await JOB_QUEUES[queue].addBulk(
        jobDefs.map(({ args, bulkJobOptions }) => ({
          name,
          data: args,
          opts: { ...defaultOptionsForJobType, ...bulkJobOptions },
        })),
      );
      return jobs as Job<TArgs, TReturn, TJobName>[];
    },
  };

  registeredJobTypes.set(name, jobEnqueuer);
  return jobEnqueuer;
};

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const runJob = async (job: SandboxedJob<any, any>, db: DB, redis: Redis, log: Logger, hub: HubRpcClient) => {
  const jobRunner = registeredJobTypes.get(job.name);
  if (jobRunner === undefined) throw new AssertionError(`Unknown job type ${job.name}`);
  return jobRunner.run(job.data, { db, redis, log, hub });
};

export const loadJobs = async () => {
  await Promise.all(
    fs
      .readdirSync(path.join(__dirname, "jobs"), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => /\.[jt]s$/.test(fileName) && !/\.test\.[jt]s$/.test(fileName))
      .map((fileName) => path.basename(path.basename(fileName, ".ts"), ".js"))
      .map(async (basename) => {
        await import(`./jobs/${basename}`);
      }),
  );
};
