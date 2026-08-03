import { Client, LocalAuth } from 'whatsapp-web.js'
import * as qrcode from 'qrcode'
import * as qrcodeTerminal from 'qrcode-terminal'
import { Redis } from '@upstash/redis'
import { DASHBOARD_CONFIG } from '../dashboard/config'

const redis = Redis.fromEnv()

export class WhatsAppClient {
  private client: Client | null = null
  private qrCode: string | null = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth',
        clientId: DASHBOARD_CONFIG.SESSION_NAME
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.client) return

    this.client.on('qr', async (qr) => {
      this.qrCode = qr
      console.log('[WHATSAPP] ==========================================')
      console.log('[WHATSAPP] QR Code gerado - escaneie com o WhatsApp')
      console.log('[WHATSAPP] O painel exibe o QR; se preferir, use o login manual')
      console.log('[WHATSAPP] ==========================================')

      // Gerar QR code como imagem (salvo no painel)
      try {
        const qrCodeDataUrl = await qrcode.toDataURL(qr)
        await redis.set(`${DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY}:qr`, qrCodeDataUrl)
      } catch (error) {
        console.error('[WHATSAPP] Erro ao gerar imagem do QR code:', error)
        await redis.set(`${DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY}:qr`, qr)
      }

      // Também exibe o QR em texto no terminal para facilidade de autenticação
      try {
        qrcodeTerminal.generate(qr, { small: true }, (terminalQr) => {
          console.log('[WHATSAPP] QR Code no terminal:')
          console.log(terminalQr)
        })
      } catch (error) {
        console.error('[WHATSAPP] Erro ao exibir QR no terminal:', error)
      }
    })

    this.client.on('ready', async () => {
      console.log('[WHATSAPP] Cliente conectado com sucesso')
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'ready')
    })

    this.client.on('authenticated', async () => {
      console.log('[WHATSAPP] Autenticado com sucesso')
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'connected')
    })

    this.client.on('auth_failure', async (msg) => {
      console.error('[WHATSAPP] Falha na autenticação:', msg)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'error')
    })

    this.client.on('disconnected', async (reason) => {
      console.log('[WHATSAPP] Desconectado:', reason)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'disconnected')
    })

    this.client.on('message', async (message) => {
      if (message.body.toLowerCase() === '!ping') {
        await message.reply('pong')
      }
    })
  }

  async start() {
    if (!this.client) return
    
    await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'connecting')
    console.log('[WHATSAPP] Iniciando cliente...')
    
    try {
      await this.client.initialize()
    } catch (error) {
      console.error('[WHATSAPP] Erro ao iniciar:', error)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'error')
      throw error
    }
  }

  async stop() {
    if (!this.client) return
    
    console.log('[WHATSAPP] Parando cliente...')
    await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'disconnected')
    
    try {
      await this.client.destroy()
    } catch (error) {
      console.error('[WHATSAPP] Erro ao parar:', error)
    }
  }

  async sendMessage(phone: string, message: string) {
    if (!this.client) {
      throw new Error('Cliente não inicializado')
    }

    try {
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`
      const msg = await this.client.sendMessage(formattedPhone, message)
      console.log(`[WHATSAPP] Mensagem enviada para ${formattedPhone}`)
      return msg
    } catch (error) {
      console.error(`[WHATSAPP] Erro ao enviar para ${phone}:`, error)
      throw error
    }
  }

  getQRCode(): string | null {
    return this.qrCode
  }

  isReady(): boolean {
    return this.client ? this.client.info !== undefined : false
  }
}
