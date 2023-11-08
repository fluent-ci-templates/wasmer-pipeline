import {
  build,
  deploy,
} from "https://pkg.fluentci.io/wasmer_pipeline@v0.2.0/mod.ts";

await build(".");
await deploy(".", Deno.env.get("WASMER_TOKEN"), true);
