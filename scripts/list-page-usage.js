import fs from "fs"
import path from "path"

const projectRoot = process.cwd()
const pagesDir = path.join(projectRoot, 'src/pages')
const pageFiles = fs.readdirSync(pagesDir).filter((file) => file.endsWith('.jsx'))

const sourceFiles = []
const stack = ['src']
while (stack.length) {
  const dir = stack.pop()
  const fullDir = path.join(projectRoot, dir)
  const entries = fs.readdirSync(fullDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const relative = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      stack.push(relative)
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      sourceFiles.push(relative)
    }
  }
}

const fileCache = new Map()
const readFile = (relativePath) => {
  if (!fileCache.has(relativePath)) {
    fileCache.set(relativePath, fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'))
  }
  return fileCache.get(relativePath)
}

for (const file of pageFiles) {
  const baseName = file.replace(/\.jsx$/, '')
  const importPattern = new RegExp(`['"]@/pages/${baseName}['"]`)
  const relativePattern = new RegExp(`['"]\\.\\./pages/${baseName}['"]`)
  const inUse = sourceFiles.some((sourceFile) => {
    const content = readFile(sourceFile)
    return importPattern.test(content) || relativePattern.test(content)
  })
  console.log(`${file}: ${inUse ? 'in use' : 'UNUSED'}`)
}
