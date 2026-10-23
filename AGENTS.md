# Agent Guide

Read [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), and the
[research project context](https://github.com/tokevals/tokevals-research/blob/main/PROJECT_CONTEXT.md)
before changing catalog scope or terminology.

This repository owns public catalog artifacts, not the private Explorer, the
hosted Worker, the `tokevals` Python package, or research measurements. Keep
plans, source claims, and measured results distinct.

Validate catalog structure and references with `npm test`. Model/tokenizer
equivalence requires separate artifact-based checks and must not be claimed
from structural tests. Pin exact revisions and hashes. Preserve raw bytes and
byte spans; do not invent boundaries for count-only APIs or assume each token
independently decodes as UTF-8.

Do not commit credentials, prompts, personal paths, account identifiers,
machine diagnostics, datasets, model weights, checkpoints, or downloaded
tokenizer artifacts. Keep changes small, documented, and signed off.
