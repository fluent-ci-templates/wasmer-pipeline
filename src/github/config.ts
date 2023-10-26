import { FluentGithubActions } from "../../deps.ts";

export function generateYaml(): FluentGithubActions.Workflow {
  const workflow = new FluentGithubActions.Workflow("Deploy");

  const push = {
    branches: ["main"],
  };

  const setupDagger = `\
  curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.8.1 sh
  sudo mv bin/dagger /usr/local/bin
  dagger version`;

  const deploy: FluentGithubActions.JobSpec = {
    "runs-on": "ubuntu-latest",
    steps: [
      {
        uses: "actions/checkout@v2",
      },
      {
        uses: "denoland/setup-deno@v1",
        with: {
          "deno-version": "v1.37",
        },
      },
      {
        name: "Setup Fluent CI CLI",
        run: "deno install -A -r https://cli.fluentci.io -n fluentci",
      },
      {
        name: "Setup Dagger",
        run: setupDagger,
      },
      {
        name: "Run Dagger Pipelines",
        run: "fluentci run wasmer_pipeline",
        env: {
          WASMER_TOKEN: "${{ secrets.WASMER_TOKEN }}",
        },
      },
    ],
  };

  workflow.on({ push }).jobs({ deploy });

  return workflow;
}
