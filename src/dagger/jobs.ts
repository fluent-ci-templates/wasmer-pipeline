/**
 * @module wasmer
 * @description A module for building and deploying applications to Wasmer Edge.
 */

import { getDirectory, getWasmerToken } from "./lib.ts";
import { Directory, Secret, dag } from "../../deps.ts";

export enum Job {
  build = "build",
  deploy = "deploy",
}

export const exclude = ["target", ".git", ".fluentci"];

/**
 * @function
 * @description Build the project (wasix)
 * @param {string | Directory | undefined} src
 * @returns {string}
 */
export async function build(
  src: string | Directory
): Promise<Directory | string> {
  const CARGO_WASIX_VERSION = "v0.1.23";
  const context = await getDirectory(dag, src);
  const ctr = dag
    .pipeline(Job.build)
    .container()
    .from("rust:1.75-bookworm")
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "build-essential", "wget"])
    .withMountedCache(
      "/root/.cargo/registry",
      dag.cacheVolume("cargo-registry")
    )
    .withMountedCache("/root/.cargo/git", dag.cacheVolume("cargo-git-cache"))
    .withMountedCache("/app/target", dag.cacheVolume("wasmer-target-cache"))
    .withExec([
      "wget",
      `https://github.com/wasix-org/cargo-wasix/releases/download/${CARGO_WASIX_VERSION}/cargo-wasix-x86_64-unknown-linux-gnu.tar.xz`,
    ])
    .withExec(["tar", "-xvf", "cargo-wasix-x86_64-unknown-linux-gnu.tar.xz"])
    .withExec([
      "mv",
      "cargo-wasix-x86_64-unknown-linux-gnu/cargo-wasix",
      "/usr/local/cargo/bin",
    ])
    .withExec([
      "wget",
      "https://github.com/wasix-org/rust/releases/download/v2023-11-01.1/rust-toolchain-x86_64-unknown-linux-gnu.tar.gz",
    ])
    .withExec([
      "sh",
      "-c",
      "mkdir rust-toolchain-x86_64-unknown-linux-gnu && cd rust-toolchain-x86_64-unknown-linux-gnu && tar -xvf ../rust-toolchain-x86_64-unknown-linux-gnu.tar.gz",
    ])
    .withExec([
      "wget",
      "https://github.com/wasix-org/rust/releases/download/v2023-11-01.1/wasix-libc.tar.gz",
    ])
    .withExec([
      "sh",
      "-c",
      "mkdir wasix-libc && cd wasix-libc && tar -xvf ../wasix-libc.tar.gz",
    ])
    .withExec([
      "mkdir",
      "-p",
      "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-11-01.1",
    ])
    .withExec([
      "mv",
      "rust-toolchain-x86_64-unknown-linux-gnu",
      "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-11-01.1/rust",
    ])
    .withExec([
      "mv",
      "wasix-libc",
      "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-11-01.1/sysroot",
    ])
    .withExec([
      "rustup",
      "toolchain",
      "link",
      "wasix",
      "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-11-01.1/rust",
    ])
    .withExec([
      "sh",
      "-c",
      "chmod a+x /root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-11-01.1/rust/bin/* \
      /root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-11-01.1/rust/lib/rustlib/x86_64-unknown-linux-gnu/bin/*",
    ])
    .withExec([
      "cp",
      "/usr/local/rustup/toolchains/1.75.0-x86_64-unknown-linux-gnu/bin/cargo",
      "/usr/local/rustup/toolchains/wasix/bin",
    ])
    .withMountedCache(
      "/usr/local/cargo/registry",
      dag.cacheVolume("cargo_registry")
    )
    .withMountedCache(
      "/usr/local/cargo/git",
      dag.cacheVolume("cargo_git_cache")
    )
    .withDirectory("/app", context, {
      exclude,
    })
    .withWorkdir("/app")
    .withExec(["cargo", "wasix", "build", "--release"])
    .withExec(["cp", "-r", "/app/target/wasm32-wasmer-wasi", "/tmp"])
    .withExec(["ls", "-la", "/app/target/wasm32-wasmer-wasi/release/"]);

  await ctr.stdout();

  const id = await ctr.directory("/tmp/wasm32-wasmer-wasi").id();
  return id;
}

/**
 * @function
 * @description Deploy to Wasmer Edge
 * @param {string | Directory} src
 * @param {string | Secret} token
 * @param {boolean} cache
 * @returns {string}
 */
export async function deploy(
  src: string | Directory,
  token: string | Secret,
  cache = false
): Promise<string> {
  const context = await getDirectory(dag, src);
  const secret = await getWasmerToken(dag, token);

  if (!secret) {
    console.log(
      "Missing Wasmer token. Please provide a secret or set the WASMER_TOKEN environment variable."
    );
    Deno.exit(1);
  }

  let baseCtr = dag
    .pipeline(Job.deploy)
    .container()
    .from("ubuntu")
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "curl"])
    .withExec(["sh", "-c", "curl https://get.wasmer.io -sSfL | sh"])
    .withSecretVariable("WASMER_TOKEN", secret)
    .withEnvVariable("WASMER_DIR", "/root/.wasmer")
    .withEnvVariable("WASMER_CACHE_DIR", "/root/.wasmer/cache")
    .withEnvVariable("PATH", "/root/.wasmer/bin:$PATH", { expand: true });

  if (cache) {
    baseCtr = baseCtr.withMountedCache(
      "/app/target",
      dag.cacheVolume("wasmer-target-cache")
    );
  }

  const ctr = baseCtr
    .withDirectory("/app", context, { exclude: cache ? ["target"] : [] })
    .withWorkdir("/app")
    .withExec(["wasmer", "deploy", "--non-interactive"]);

  const result = await ctr.stdout();
  return result;
}

export type JobExec =
  | ((src: string) => Promise<Directory | string>)
  | ((src: string, token: string, cache?: boolean) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.build]: build,
  [Job.deploy]: deploy,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.build]: "Build the project (wasix)",
  [Job.deploy]: "Deploy to Wasmer Edge",
};
