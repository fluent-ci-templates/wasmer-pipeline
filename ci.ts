import { build, deploy } from "jsr:@fluentci/wasmer";

await build(".");
await deploy(".", Deno.env.get("WASMER_TOKEN"), true);
