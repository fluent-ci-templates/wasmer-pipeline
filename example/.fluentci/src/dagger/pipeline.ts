import * as jobs from "./jobs.ts";
import { env } from "../../deps.ts";

const { build, deploy, runnableJobs } = jobs;

export default async function pipeline(src = ".", args: string[] = []) {
  if (args.length > 0) {
    await runSpecificJobs(src, args as jobs.Job[]);
    return;
  }
  await build(src);
  await deploy(src, env.get("WASMER_TOKEN") || "", true);
}

async function runSpecificJobs(src: string, args: jobs.Job[]) {
  for (const name of args) {
    const job = runnableJobs[name];
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    await job(src, env.get("WASMER_TOKEN") || "", true);
  }
}
