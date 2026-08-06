import { WhatsAppClient } from './client'

let instance: WhatsAppClient | null = null
let autoStartPromise: Promise<void> | null = null

export function getWhatsAppClient(): WhatsAppClient {
  if (!instance) {
    instance = new WhatsAppClient()
  }
  return instance
}

export function getWhatsAppClientIfExists(): WhatsAppClient | null {
  return instance
}

// Inicialização sob demanda (conectar/restart). Não é chamada em polling de
// status: a reconexão automática acontece apenas quando um envio falha.
export async function initializeWhatsApp(): Promise<void> {
  if (autoStartPromise) {
    return autoStartPromise
  }

  autoStartPromise = (async () => {
    try {
      console.log('[WHATSAPP-MANAGER] Inicializando WhatsApp...')
      const client = getWhatsAppClient()
      await client.start()
      console.log('[WHATSAPP-MANAGER] WhatsApp iniciado com sucesso')
    } catch (error) {
      console.error('[WHATSAPP-MANAGER] Falha na inicialização:', error)
    } finally {
      autoStartPromise = null
    }
  })()

  return autoStartPromise
}

// Forçar reinicialização completa
export async function restartWhatsApp(): Promise<void> {
  console.log('[WHATSAPP-MANAGER] Reinicialização forçada...')
  if (instance) {
    await instance.stop()
    instance = null
  }
  autoStartPromise = null
  await initializeWhatsApp()
}