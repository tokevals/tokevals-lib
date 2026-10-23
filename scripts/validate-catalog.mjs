#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const catalogUrl = new URL("../catalog/models.json", import.meta.url);
const schemaUrl = new URL("../catalog/schema.json", import.meta.url);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function matchesType(value, type) {
  if (type === "object") return isObject(value);
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isSafeInteger(value);
  return typeof value === type;
}

// The committed schema deliberately uses a small JSON Schema subset. Keep its
// offline validator dependency-free; cross-entry references are checked below.
function checkSchema(value, rule, root, path, errors) {
  if (rule.$ref) {
    const target = rule.$ref.split("/").slice(1).reduce(
      (part, key) => part?.[key], root,
    );
    if (!target) throw new Error(`Broken schema reference: ${rule.$ref}`);
    checkSchema(value, target, root, path, errors);
    return;
  }
  if (rule.oneOf) {
    const matching = rule.oneOf.filter((alternative) => {
      const branchErrors = [];
      checkSchema(value, alternative, root, path, branchErrors);
      return branchErrors.length === 0;
    });
    if (matching.length !== 1) errors.push(`${path}: expected one valid variant`);
    return;
  }
  if (rule.type && !matchesType(value, rule.type)) {
    errors.push(`${path}: expected ${rule.type}`);
    return;
  }
  if ("const" in rule && value !== rule.const) {
    errors.push(`${path}: unexpected value`);
  }
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${path}: value is not allowed`);
  }
  if (typeof value === "string") {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${path}: value is empty`);
    }
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
      errors.push(`${path}: value does not match required pattern`);
    }
  }
  if (typeof value === "number" && rule.minimum !== undefined &&
      value < rule.minimum) {
    errors.push(`${path}: value is below minimum`);
  }
  if (Array.isArray(value)) {
    if (rule.minItems && value.length < rule.minItems) {
      errors.push(`${path}: array is empty`);
    }
    if (rule.items) value.forEach((item, index) =>
      checkSchema(item, rule.items, root, `${path}[${index}]`, errors));
  }
  if (isObject(value)) {
    for (const key of rule.required ?? []) {
      if (!(key in value)) errors.push(`${path}.${key}: required`);
    }
    for (const [key, item] of Object.entries(value)) {
      const property = rule.properties?.[key];
      if (property) checkSchema(item, property, root, `${path}.${key}`, errors);
      else if (rule.additionalProperties === false) {
        errors.push(`${path}.${key}: undeclared field`);
      }
    }
  }
}

function checkUnique(entries, category, errors) {
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.id)) errors.push(`${category}: duplicate id ${entry.id}`);
    seen.add(entry.id);
  }
}

export function validateCatalog(catalog, schema) {
  const errors = [];
  checkSchema(catalog, schema, schema, "catalog", errors);
  if (errors.length || !isObject(catalog)) return errors;

  const providers = new Map(catalog.providers.map((entry) => [entry.id, entry]));
  const tokenizers = new Map(catalog.tokenizers.map((entry) => [entry.id, entry]));
  checkUnique(catalog.providers, "providers", errors);
  checkUnique(catalog.tokenizers, "tokenizers", errors);
  checkUnique(catalog.models, "models", errors);

  for (const tokenizer of catalog.tokenizers) {
    if (!providers.has(tokenizer.provider)) {
      errors.push(`tokenizer ${tokenizer.id}: unknown provider`);
    }
    if (tokenizer.kind === "open") {
      if (tokenizer.artifactUrl && !tokenizer.artifactSha256) {
        errors.push(`tokenizer ${tokenizer.id}: artifact SHA-256 required`);
      }
      if (tokenizer.decoder === "tiktoken" &&
          (!tokenizer.artifactUrl || !tokenizer.pattern)) {
        errors.push(`tokenizer ${tokenizer.id}: tiktoken artifact and pattern required`);
      }
    }
  }

  for (const model of catalog.models) {
    if (!providers.has(model.provider)) {
      errors.push(`model ${model.id}: unknown provider`);
    }
    if (model.kind === "local") {
      const tokenizer = tokenizers.get(model.tokenizerId);
      if (!tokenizer) {
        errors.push(`model ${model.id}: unknown tokenizerId`);
      } else if (tokenizer.provider === model.provider) {
        if (model.tokenizerProvider !== undefined) {
          errors.push(`model ${model.id}: redundant tokenizerProvider`);
        }
      } else if (model.tokenizerProvider !== tokenizer.provider) {
        errors.push(`model ${model.id}: tokenizerProvider must name the tokenizer owner`);
      }
    } else if (model.capability === "count_only" && model.supportsBoundaries) {
      errors.push(`model ${model.id}: count-only API cannot claim boundaries`);
    }
  }
  return errors;
}

export async function loadCatalogAndSchema(catalogPath = catalogUrl) {
  const [catalog, schema] = await Promise.all([
    readFile(catalogPath, "utf8").then(JSON.parse),
    readFile(schemaUrl, "utf8").then(JSON.parse),
  ]);
  return { catalog, schema };
}

if (process.argv[1] && resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)) {
  try {
    const path = process.argv[2] ? resolve(process.argv[2]) : catalogUrl;
    const { catalog, schema } = await loadCatalogAndSchema(path);
    const errors = validateCatalog(catalog, schema);
    if (errors.length) {
      process.stderr.write(`Catalog invalid:\n${errors.slice(0, 25).join("\n")}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(`Catalog ${catalog.catalogVersion} valid: ${catalog.models.length} models, ${catalog.tokenizers.length} tokenizers.\n`);
    }
  } catch (error) {
    process.stderr.write(`Catalog validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
