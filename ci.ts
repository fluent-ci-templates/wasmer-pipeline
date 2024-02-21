import {
  build,
  deploy,
} from "https://pkg.fluentci.io/wasmer_pipeline@v0.3.2/mod.ts";

await build(".");
await deploy(".", Deno.env.get("WASMER_TOKEN"), true);
