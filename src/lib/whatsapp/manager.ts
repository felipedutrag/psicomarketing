import { WhatsAppClient } from './client'

let instance: WhatsAppClient | null = null

export function getWhatsAppClient(): WhatsAppClient {
  if (!instance) {
    instance = new WhatsAppClient()
  }
  return instance
}

export function getWhatsAppClientIfExists(): WhatsAppClient | null {
  return instance
}