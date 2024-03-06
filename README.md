# Wasmer Pipeline

[![fluentci pipeline](https://img.shields.io/badge/dynamic/json?label=pkg.fluentci.io&labelColor=%23000&color=%23460cf1&url=https%3A%2F%2Fapi.fluentci.io%2Fv1%2Fpipeline%2Fwasmer_pipeline&query=%24.version)](https://pkg.fluentci.io/wasmer_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.41)
[![dagger-min-version](https://img.shields.io/badge/dagger-v0.10.0-blue?color=3D66FF&labelColor=000000)](https://dagger.io)
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
