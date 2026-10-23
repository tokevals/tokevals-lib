import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalogAndSchema, validateCatalog } from "../scripts/validate-catalog.mjs";

const { catalog, schema } = await loadCatalogAndSchema();

function changed(mutate) {
  const copy = structuredClone(catalog);
  mutate(copy);
  return validateCatalog(copy, schema);
}

test("published catalog validates without Explorer access", () => {
  assert.deepEqual(validateCatalog(catalog, schema), []);
});

test("rejects duplicate and unresolved model identities", () => {
  assert.match(changed((copy) => {
    copy.models[1].id = copy.models[0].id;
  }).join("\n"), /duplicate id/);
  assert.match(changed((copy) => {
    copy.models[0].provider = "missing-provider";
  }).join("\n"), /unknown provider/);
  const localIndex = catalog.models.findIndex((model) => model.kind === "local");
  assert.match(changed((copy) => {
    copy.models[localIndex].tokenizerId = "missing-tokenizer";
  }).join("\n"), /unknown tokenizerId/);
});

test("rejects mismatched shared-tokenizer ownership", () => {
  const index = catalog.models.findIndex((model) => model.tokenizerProvider);
  assert.ok(index >= 0);
  assert.match(changed((copy) => {
    delete copy.models[index].tokenizerProvider;
  }).join("\n"), /tokenizerProvider must name/);
});

test("rejects unpinned revisions and deployment-only catalog fields", () => {
  const index = catalog.tokenizers.findIndex((tokenizer) => tokenizer.kind === "open");
  assert.match(changed((copy) => {
    copy.tokenizers[index].revision = "short";
  }).join("\n"), /expected one valid variant/);
  const apiIndex = catalog.models.findIndex((model) => model.kind === "hosted");
  assert.match(changed((copy) => {
    copy.models[apiIndex].environmentOverride = "ANTHROPIC_MODEL";
  }).join("\n"), /expected one valid variant/);
});
