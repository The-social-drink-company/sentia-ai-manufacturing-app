import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = path.resolve(__dirname, "..")
const baselinePath = path.join(root, "lint-baseline.json")
if (!fs.existsSync(baselinePath)) {
  console.error("lint-baseline.json not found. Run eslint with --format json first.")
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(baselinePath, "utf8"))
const ruleCounts = new Map()
const dirMap = new Map()

for (const item of data) {
  const rel = path.relative(root, item.filePath).replace(/\\/g, "/")
  const parts = rel.split("/")
  const dir = parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0]

  for (const message of item.messages) {
    if (message.severity < 1) continue
    const rule = message.ruleId || "unknown"
    ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1)

    if (!dirMap.has(dir)) {
      dirMap.set(dir, { total: 0, rules: new Map() })
    }
    const dirEntry = dirMap.get(dir)
    dirEntry.total += 1
    dirEntry.rules.set(rule, (dirEntry.rules.get(rule) || 0) + 1)
  }
}

const sortedRules = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])
const sortedDirs = [...dirMap.entries()].sort((a, b) => b[1].total - a[1].total)

let md = "# Lint Baseline 2025-09-29\n\n"
md += "## Totals by Rule\n"
for (const [rule, count] of sortedRules) {
  md += `- ${rule}: ${count}\n`
}

md += "\n## Totals by Directory\n"
for (const [dir, info] of sortedDirs) {
  md += `- ${dir}: ${info.total}\n`
  const rules = [...info.rules.entries()].sort((a, b) => b[1] - a[1])
  for (const [rule, count] of rules) {
    md += `  - ${rule}: ${count}\n`
  }
}

const docsDir = path.join(root, "docs")
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

const reportPath = path.join(docsDir, "lint-baseline-2025-09-29.md")
fs.writeFileSync(reportPath, md)
console.log("Lint baseline report written to", reportPath)
