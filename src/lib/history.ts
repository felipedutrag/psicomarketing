import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const HISTORY_FILE = join(process.cwd(), 'custom_fields_history.json')

export function loadHistory(): Record<string, unknown> {
  if (!existsSync(HISTORY_FILE)) return {}
  return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'))
}

export function saveHistory(history: Record<string, unknown>) {
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
}
