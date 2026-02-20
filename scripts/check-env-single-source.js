const fs = require("fs");
const path = require("path");

const root = process.cwd();
const envPath = path.join(root, ".env");
const envLocalPath = path.join(root, ".env.local");

function parseKeys(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
    .map((line) => line.split("=")[0]);
}

const envKeys = parseKeys(envPath);
const envLocalKeys = parseKeys(envLocalPath);
const duplicates = envKeys.filter((k) => envLocalKeys.includes(k));

if (!fs.existsSync(envLocalPath)) {
  console.warn("[env-check] .env.local not found. Create it as your single source of truth.");
}

if (envKeys.length > 0) {
  console.warn(
    `[env-check] .env contains ${envKeys.length} active key(s). Keep runtime keys in .env.local to avoid confusion.`
  );
}

if (duplicates.length > 0) {
  console.warn(
    `[env-check] Duplicate keys found in .env and .env.local: ${duplicates.join(", ")}`
  );
}
