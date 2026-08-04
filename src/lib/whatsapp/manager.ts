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

// Inicialização automática - chamada no startup do servidor e em cada verificação
// de status. Auto-curativa: se o cliente não estiver rodando/saudável, reinicia.
export async function initializeWhatsApp(): Promise<void> {
  const client = getWhatsAppClient()

  // Se já está rodando e saudável, apenas garante o health check ativo.
  if (client.isStarted()) {
    try {
      const healthy = await client.isHealthy()
      if (healthy) {
        client.startHealthCheck()
        return
      }
    } catch (err) {
      console.warn('[WHATSAPP-MANAGER] isHealthy falhou, reiniciando:', err)
    }
  }

  // Evita disparos concorrentes de inicialização.
  if (autoStartPromise) {
    return autoStartPromise
  }

  autoStartPromise = (async () => {
    try {
      console.log('[WHATSAPP-MANAGER] Inicialização automática do WhatsApp...')
      const client = getWhatsAppClient()
      await client.start()
      console.log('[WHATSAPP-MANAGER] WhatsApp iniciado com sucesso')
    } catch (error) {
      console.error('[WHATSAPP-MANAGER] Falha na inicialização automática:', error)
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