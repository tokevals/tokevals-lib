# TokEvals shared catalog

This repository publishes the model and tokenizer catalog used by the TokEvals
project. It is **not** the `tokevals` Python package and does not provide the
Explorer application or its hosted-provider Worker.

The first catalog snapshot, `0.1.0`, records 112 model entries and 35 tokenizer
integrations. A local row points to a pinned tokenizer definition; an API row
describes a provider's count or breakdown capability. A catalog entry is a
source-and-capability claim, **not** a measurement of quality, latency, energy,
or cost. API entries are maintained by the project because external
contributors cannot exercise the private Worker configuration.

## Contents

- [`catalog/models.json`](catalog/models.json): the versioned catalog.
- [`catalog/schema.json`](catalog/schema.json): the version 2 document shape.
- [`scripts/validate-catalog.mjs`](scripts/validate-catalog.mjs): offline
  structural and reference validation, with fixture tests.
- [`corpus/inputs.json`](corpus/inputs.json): small synthetic Unicode cases for
  future tokenizer-equivalence checks; no model outputs or measurements.

Run `npm test` with Node.js 22 or later to validate the catalog. No Explorer
checkout, provider credentials, or billable request is required. Tokenizer
equivalence checks and release assets are planned but are **not yet available**;
the present validator checks structure and references, not behavioral
equivalence between artifacts.

See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing an entry. The wider
research scope and measurement terminology live in
[`tokevals-research/PROJECT_CONTEXT.md`](https://github.com/tokevals/tokevals-research/blob/main/PROJECT_CONTEXT.md).
The [TokEvals Explorer](https://tokeval.dev) is a hosted dashboard with a
private implementation; its public catalog is maintained here.

## Licensing

Code and documentation outside `catalog/` are Apache-2.0 licensed under
[LICENSE](LICENSE). The files in `catalog/`, including the model data and schema,
are CC-BY-4.0 licensed under [catalog/LICENSE](catalog/LICENSE). Contributions
require a DCO sign-off. The “TokEvals” name and `tokeval.dev` marks are not
licensed with the code or catalog.
