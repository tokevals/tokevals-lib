# Contributing to the TokEvals catalog

Read the [project context](https://github.com/tokevals/tokevals-research/blob/main/PROJECT_CONTEXT.md)
before changing scope or terminology. The catalog describes pinned tokenizers
and provider capabilities; it does not establish that one model is better or
cheaper than another.

## Add a model that shares an existing local tokenizer

1. Verify from primary sources or published model files that the model uses
   the same tokenizer, including normalization, pre-tokenization, vocabulary,
   merges, special tokens, and relevant configuration. Family branding or
   similar vocabulary size is insufficient.
2. Add a `kind: "local"` entry in `catalog/models.json` with a stable ID,
   existing provider ID, name, and existing `tokenizerId`. If the tokenizer is
   owned by another provider, declare its owner in `tokenizerProvider`.
3. Run `npm test`. Record the source URLs and exact revisions in the pull
   request. Compare ASCII, Korean, another script, whitespace, decomposed
   Unicode, and emoji with the model's own tokenizer. The network-backed
   equivalence checker is still planned; do not claim its verification yet.

## Add a new local tokenizer integration

1. Add the provider if needed, then a tokenizer with a stable ID, provider,
   label, encoding, and source URL. Public artifacts use `kind: "open"`, a
   repository, a full 40-character commit revision, decoder, and an honest
   `supportsBoundaries` value.
2. For a directly downloaded artifact, include its URL, byte size, and
   SHA-256. Record normalization and boundary limitations where applicable.
   Do not present spans over normalized bytes as raw-input spans.
3. Add the canonical model and verified aliases, then run `npm test` and
   document the verification corpus and upstream license. Do not commit
   downloaded tokenizer artifacts, model weights, or restricted data here.

## API model entries

API-backed entries are maintainer-owned because their capabilities and
upstream IDs require private provider access to verify. External pull requests
changing them are closed by default. Deployment settings and credentials must
never go in the catalog.

## Review checklist

- Run `npm test` and include the catalog version change and changelog entry.
- Record pinned revisions and source URLs for tokenizer claims.
- Check Unicode round trips, normalization, unusual spacing, emoji, mixed
  scripts, and byte-boundary splits where applicable.
- Keep raw bytes and byte spans when a tokenizer exposes boundaries. A token
  need not decode as an independent UTF-8 string.
- Do not invent token IDs or spans for count-only APIs, or equate token count
  with quality, latency, energy, or monetary cost.
- Exclude credentials, personal paths, account identifiers, prompts, datasets,
  model weights, checkpoints, and raw diagnostics.
- Sign off each commit with `git commit -s` for the Developer Certificate of
  Origin.
