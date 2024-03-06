import { FluentGithubActions } from "../../deps.ts";

export function generateYaml(): FluentGithubActions.Workflow {
  const workflow = new FluentGithubActions.Workflow("Deploy");

  const push = {
    branches: ["main"],
  };

  const deploy: FluentGithubActions.JobSpec = {
    "runs-on": "ubuntu-latest",
    steps: [
      {
        uses: "actions/checkout@v2",
      },

      {
        name: "Setup Fluent CI",
        uses: "fluentci-io/setup-fluentci@v1",
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
