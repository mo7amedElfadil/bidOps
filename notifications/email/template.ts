import { readFile } from 'node:fs/promises'
import path from 'node:path'

const templateCache = new Map<string, string>()
const templatesDir = path.join(__dirname, 'templates')

async function loadTemplate(name: string) {
  if (templateCache.has(name)) return templateCache.get(name)!
  const filename = name.endsWith('.html') ? name : `${name}.html`
  const fullPath = path.join(templatesDir, filename)
  const contents = await readFile(fullPath, 'utf-8')
  templateCache.set(name, contents)
  return contents
}

export async function renderEmailTemplate(name: string, data: Record<string, string | undefined>) {
  const template = await loadTemplate(name)
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => data[key] ?? '')
}
