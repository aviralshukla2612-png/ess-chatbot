import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Citation Sources Formatting & React Child Safety", () => {
  // Helper matching BotPreviewWidget and WebsiteKnowledgeManager extraction logic
  function formatCitation(src) {
    const title =
      typeof src === "object" && src !== null
        ? src.title || src.url || "Knowledge Document"
        : String(src || "Knowledge Source");
    const url = typeof src === "object" && src !== null ? src.url : null;
    return { title, url };
  }

  test("1. Safely formats object with keys {title, url} into string primitives", () => {
    const rawSrc = { title: "Company FAQ", url: "https://example.com/faq" };
    const result = formatCitation(rawSrc);

    assert.equal(typeof result.title, "string");
    assert.equal(result.title, "Company FAQ");
    assert.equal(result.url, "https://example.com/faq");
    assert.notEqual(typeof result.title, "object");
  });

  test("2. Safely formats object with missing title falling back to url", () => {
    const rawSrc = { url: "https://example.com/pricing" };
    const result = formatCitation(rawSrc);

    assert.equal(typeof result.title, "string");
    assert.equal(result.title, "https://example.com/pricing");
    assert.equal(result.url, "https://example.com/pricing");
  });

  test("3. Safely formats string citations (e.g. 'Verified Knowledge')", () => {
    const rawSrc = "Verified Knowledge";
    const result = formatCitation(rawSrc);

    assert.equal(typeof result.title, "string");
    assert.equal(result.title, "Verified Knowledge");
    assert.equal(result.url, null);
  });

  test("4. Resilient against null, undefined, or empty objects", () => {
    assert.equal(formatCitation(null).title, "Knowledge Source");
    assert.equal(formatCitation(undefined).title, "Knowledge Source");
    assert.equal(formatCitation({}).title, "Knowledge Document");
    assert.equal(formatCitation({ title: "" }).title, "Knowledge Document");
  });
});
