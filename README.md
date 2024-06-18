# Wasmer Pipeline

[![fluentci pipeline](https://shield.fluentci.io/x/wasmer_pipeline)](https://pkg.fluentci.io/wasmer_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.41)
[![dagger-min-version](https://shield.fluentci.io/dagger/v0.11.7)](https://dagger.io)
[![](https://jsr.io/badges/@fluentci/wasmer)](https://jsr.io/@fluentci/wasmer)
[![ci](https://github.com/fluent-ci-templates/wasmer-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/fluent-ci-templates/wasmer-pipeline/actions/workflows/ci.yml)

A ready-to-use CI/CD Pipeline for deploying your applications to [Wasmer Edge](https://wasmer.io/products/edge).

## 🚀 Usage

Run the following command:

```bash
fluentci run wasmer_pipeline
```

## 🧩 Dagger Module

Use as a [Dagger](https://dagger.io) Module:

```bash
dagger install github.com/fluent-ci-templates/wasmer-pipeline@main
```

Call a function from the module:

```sh
dagger call build --src .
dagger call deploy --src . --token WASMER_TOKEN
```

## 🛠️ Environment Variables

| Variable        | Description                      |
|-----------------|----------------------------------|
| WASMER_TOKEN    | Your wasmer access token         |

## ✨ Jobs

| Job     | Description                          |
|---------|--------------------------------------|
| build   | Build your application.              |
| deploy  | Deploy your application to wasm edge |

```typescript
  build(
    src: string | Directory
  ): Promise<Directory | string>

  deploy(
    src: string | Directory,
    token: string | Secret,
    cache = false
  ): Promise<string> 
```

## 👨‍💻 Programmatic usage

You can also use this pipeline programmatically:

```typescript
import { build, deploy } from "jsr:@fluentci/wasmer";

await build(".")
await deploy(".", Deno.env.get("WASMER_TOKEN"), true);
```
