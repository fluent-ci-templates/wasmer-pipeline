import { Directory, DirectoryID, Secret, SecretID } from "../../deps.ts";
import { Client } from "../../sdk/client.gen.ts";

export const getDirectory = async (
  client: Client,
  src: string | Directory | undefined = "."
) => {
  if (src instanceof Directory) {
    return src;
  }
  if (typeof src === "string") {
    try {
      const directory = client.loadDirectoryFromID(src as DirectoryID);
      await directory.id();
      return directory;
    } catch (_) {
      return client.host
        ? client.host().directory(src)
        : client.currentModule().source().directory(src);
    }
  }
  return client.host
    ? client.host().directory(src)
    : client.currentModule().source().directory(src);
};

export const getWasmerToken = async (
  client: Client,
  token?: string | Secret
) => {
  if (Deno.env.get("WASMER_TOKEN")) {
    return client.setSecret("WASMER_TOKEN", Deno.env.get("WASMER_TOKEN")!);
  }
  if (token && typeof token === "string") {
    try {
      const secret = client.loadSecretFromID(token as SecretID);
      await secret.id();
      return secret;
    } catch (_) {
      return client.setSecret("WASMER_TOKEN", token);
    }
  }
  if (token && token instanceof Secret) {
    return token;
  }
  return undefined;
};
