import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(path: string): string {
  if (typeof path === 'string' && path.startsWith('/')) return path
  return `/${path || ''}`
}
