import fs from "fs";
import path from "path";
import os from "os";

/**
 * Checks whether the current Node process is executing under a test runner
 */
export function isTestMode() {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.TEST_DATA_DIR !== undefined ||
    process.execArgv.some((a) => a.includes("test")) ||
    process.argv.some((a) => a.includes("test") || a.includes(".test.js"))
  );
}

/**
 * Resolves the primary shared data file path in the workspace
 */
export function resolveSharedDataFile(filename) {
  const frontendPath = path.join(process.cwd(), "frontend", "data", filename);
  if (fs.existsSync(frontendPath)) return frontendPath;
  const directPath = path.join(process.cwd(), "data", filename);
  if (fs.existsSync(directPath)) return directPath;
  if (process.cwd().endsWith("frontend")) return directPath;
  return frontendPath;
}

/**
 * Resolves the target data file path.
 * When in test mode, returns an isolated temporary file in os.tmpdir()
 * seeded from the source data file to prevent mutating tracked repository files.
 */
export function getDataFilePath(filename) {
  if (process.env.TEST_DATA_DIR || isTestMode()) {
    const testDir = process.env.TEST_DATA_DIR || path.join(os.tmpdir(), "ess_chatbot_test_fixtures");
    if (!fs.existsSync(testDir)) {
      try {
        fs.mkdirSync(testDir, { recursive: true });
      } catch (e) {}
    }
    const testFile = path.join(testDir, filename);
    if (!fs.existsSync(testFile)) {
      const sourceFile = resolveSharedDataFile(filename);
      if (fs.existsSync(sourceFile)) {
        try {
          fs.copyFileSync(sourceFile, testFile);
        } catch (e) {}
      } else {
        try {
          fs.writeFileSync(testFile, "[]", "utf8");
        } catch (e) {}
      }
    }
    return testFile;
  }
  return resolveSharedDataFile(filename);
}
