import Client, { connect } from "../../deps.ts";

export enum Job {
  build = "build",
  deploy = "deploy",
}

export const exclude = ["target", ".git", ".fluentci"];

export const build = async (src = ".") => {
  await connect(async (client: Client) => {
    const context = client.host().directory(src);
    const ctr = client
      .pipeline(Job.build)
      .container()
      .from("rust:1.71-bookworm")
      .withExec(["apt", "update"])
      .withExec(["apt", "install", "-y", "build-essential", "wget"])
      .withMountedCache(
        "/root/.cargo/registry",
        client.cacheVolume("cargo-registry")
      )
      .withMountedCache(
        "/root/.cargo/git",
        client.cacheVolume("cargo-git-cache")
      )
      .withMountedCache(
        "/app/target",
        client.cacheVolume("wasmer-target-cache")
      )
      .withExec(["cargo", "install", "cargo-wasix"])
      .withExec([
        "wget",
        "https://github.com/wasix-org/rust/releases/download/v2023-07-21.1/rust-toolchain-x86_64-unknown-linux-gnu.tar.gz",
      ])
      .withExec([
        "sh",
        "-c",
        "mkdir rust-toolchain-x86_64-unknown-linux-gnu && cd rust-toolchain-x86_64-unknown-linux-gnu && tar -xvf ../rust-toolchain-x86_64-unknown-linux-gnu.tar.gz",
      ])
      .withExec([
        "wget",
        "https://github.com/wasix-org/rust/releases/download/v2023-07-21.1/wasix-libc.tar.gz",
      ])
      .withExec([
        "sh",
        "-c",
        "mkdir wasix-libc && cd wasix-libc && tar -xvf ../wasix-libc.tar.gz",
      ])
      .withExec([
        "mkdir",
        "-p",
        "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-07-21.1",
      ])
      .withExec([
        "mv",
        "rust-toolchain-x86_64-unknown-linux-gnu",
        "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-07-21.1/rust",
      ])
      .withExec([
        "mv",
        "wasix-libc",
        "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-07-21.1/sysroot",
      ])
      .withExec([
        "rustup",
        "toolchain",
        "link",
        "wasix",
        "/root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-07-21.1/rust",
      ])
      .withExec([
        "sh",
        "-c",
        "chmod a+x /root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-07-21.1/rust/bin/* \
      /root/.local/share/cargo-wasix/x86_64-unknown-linux-gnu_v2023-07-21.1/rust/lib/rustlib/x86_64-unknown-linux-gnu/bin/*",
      ])
      .withExec([
        "cp",
        "/usr/local/rustup/toolchains/1.71.1-x86_64-unknown-linux-gnu/bin/cargo",
        "/usr/local/rustup/toolchains/wasix/bin",
      ])
      .withMountedCache(
        "/usr/local/cargo/registry",
        client.cacheVolume("cargo_registry")
      )
      .withMountedCache(
        "/usr/local/cargo/git",
        client.cacheVolume("cargo_git_cache")
      )
      .withDirectory("/app", context, {
        exclude,
      })
      .withWorkdir("/app")
      .withExec(["cargo", "wasix", "build", "--release"])
      .withExec(["ls", "-la", "/app/target/wasm32-wasmer-wasi/release/"]);

    const result = await ctr.stdout();

    console.log(result);
  });
  return "Done";
};

export const deploy = async (src = ".", token?: string, cache = false) => {
  await connect(async (client: Client) => {
    const context = client.host().directory(src);

    if (!Deno.env.get("WASMER_TOKEN") && !token) {
      console.log("WASMER_TOKEN is not set");
      Deno.exit(1);
    }

    let baseCtr = client
      .pipeline(Job.deploy)
      .container()
      .from("ubuntu")
      .withExec(["apt", "update"])
      .withExec(["apt", "install", "-y", "curl"])
      .withExec(["sh", "-c", "curl https://get.wasmer.io -sSfL | sh"])
      .withEnvVariable("WASMER_TOKEN", Deno.env.get("WASMER_TOKEN") || token!)
      .withEnvVariable("WASMER_DIR", "/root/.wasmer")
      .withEnvVariable("WASMER_CACHE_DIR", "/root/.wasmer/cache")
      .withEnvVariable("PATH", "/root/.wasmer/bin:$PATH", { expand: true });

    if (cache) {
      baseCtr = baseCtr.withMountedCache(
        "/app/target",
        client.cacheVolume("wasmer-target-cache")
      );
    }

    const ctr = baseCtr
      .withDirectory("/app", context, { exclude: cache ? ["target"] : [] })
      .withWorkdir("/app")
      .withExec(["wasmer", "deploy", "--non-interactive"]);

    const result = await ctr.stdout();

    console.log(result);
  });
  return "Done";
};

export type JobExec = (
  src?: string
) => Promise<string> | ((src?: string, cache?: boolean) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.build]: build,
  [Job.deploy]: deploy,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.build]: "Build the project (wasix)",
  [Job.deploy]: "Deploy to Wasmer Edge",
};
