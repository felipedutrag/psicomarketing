import { Client, LocalAuth } from 'whatsapp-web.js'
import * as qrcode from 'qrcode'
import * as qrcodeTerminal from 'qrcode-terminal'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { Redis } from '@upstash/redis'
import { DASHBOARD_CONFIG } from '../dashboard/config'

const execFileAsync = promisify(execFile)
const redis = Redis.fromEnv()

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export class WhatsAppClient {
  private client: Client | null = null
  private qrCode: string | null = null
  private started = false

  constructor() {
    this.initialize()
    this.registerCleanup()
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

    // Se já estiver rodando/conectado, não reinicia o navegador (evita lock da sessão)
    if (this.started && this.isReady()) {
      console.log('[WHATSAPP] Cliente já está conectado, ignorando start')
      return
    }

    await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'connecting')
    console.log('[WHATSAPP] Iniciando cliente...')

    try {
      await this.initializeWithRetry()
      this.started = true
    } catch (error) {
      console.error('[WHATSAPP] Erro ao iniciar:', error)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'error')
      throw error
    }
  }

  private async initializeWithRetry(): Promise<void> {
    if (!this.client) return
    const maxAttempts = 3

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.client.initialize()
        return
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        const isLockError = /browser is already running|Target.*closed|Could not find browser/i.test(msg)

        if (isLockError && attempt < maxAttempts) {
          console.warn(`[WHATSAPP] Tentativa ${attempt} falhou (${msg}). Limpando browsers órfãos e tentando novamente...`)
          this.killStaleBrowsers()
          await sleep(3000 * attempt)
          continue
        }

        throw error
      }
    }
  }

  // Mata browsers Chrome/Chromium órfãos que ainda seguram o lock da sessão
  // após um restart abrupto do servidor (causa do "browser is already running")
  private killStaleBrowsers() {
    const marker = `session-${DASHBOARD_CONFIG.SESSION_NAME}`
    const platform = process.platform

    try {
      if (platform === 'win32') {
        const script = `Get-CimInstance Win32_Process -Filter "Name like '%chrome%'" | Where-Object { $_.CommandLine -like '*${marker}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
        execFileAsync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { timeout: 15000 })
      } else {
        execFileAsync('pkill', ['-f', marker], { timeout: 15000 })
      }
      console.log('[WHATSAPP] Browsers órfãos finalizados')
    } catch (error) {
      console.warn('[WHATSAPP] Nenhum browser órfão para limpar:', error instanceof Error ? error.message : error)
    }
  }

  // Ao encerrar o processo do servidor, destrói o browser para não deixar lock órfão
  private registerCleanup() {
    const cleanup = () => {
      try {
        if (this.client) {
          this.client.destroy().catch(() => undefined)
        }
      } catch {
        // ignora
      }
    }

    process.once('SIGTERM', cleanup)
    process.once('SIGINT', cleanup)
  }

  async stop() {
    if (!this.client) return
    
    console.log('[WHATSAPP] Parando cliente...')
    await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'disconnected')
    
    try {
      await this.client.destroy()
    } catch (error) {
      console.error('[WHATSAPP] Erro ao parar:', error)
    } finally {
      this.started = false
    }
  }

  async sendMessage(phone: string, message: string) {
    if (!this.client) {
      throw new Error('Cliente não inicializado')
    }

    try {
      const formattedPhone = String(phone).includes('@c.us') ? String(phone) : `${phone}@c.us`
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
