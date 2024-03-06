import {
  dag,
  env,
  Directory,
  DirectoryID,
  Secret,
  SecretID,
} from "../../deps.ts";

export const getDirectory = async (
  src: string | Directory | undefined = "."
) => {
  if (src instanceof Directory) {
    return src;
  }
  if (typeof src === "string") {
    try {
      const directory = dag.loadDirectoryFromID(src as DirectoryID);
      await directory.id();
      return directory;
    } catch (_) {
      return dag.host
        ? dag.host().directory(src)
        : dag.currentModule().source().directory(src);
    }
  }
  return dag.host
    ? dag.host().directory(src)
    : dag.currentModule().source().directory(src);
};

export const getWasmerToken = async (token?: string | Secret) => {
  if (env.get("WASMER_TOKEN")) {
    return dag.setSecret("WASMER_TOKEN", env.get("WASMER_TOKEN")!);
  }
  if (token && typeof token === "string") {
    try {
      const secret = dag.loadSecretFromID(token as SecretID);
      await secret.id();
      return secret;
    } catch (_) {
      return dag.setSecret("WASMER_TOKEN", token);
    }
  }
  if (token && token instanceof Secret) {
    return token;
  }
  return undefined;
};
