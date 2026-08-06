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
  private isStarting = false
  private lastStartAttempt = 0
  private consecutiveFailures = 0

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
      // Sem reconexão automática aqui: o cliente só reconecta quando um envio
      // falha (sendWithReconnect na rota de envio). Evita o loop de reconexão
      // que consumia as requisições enquanto o painel ficava aberto.
    })

    this.client.on('message', async (message) => {
      if (message.body.toLowerCase() === '!ping') {
        await message.reply('pong')
      }
    })
  }

  // Backoff exponencial: 5s -> 15s -> 45s -> 2m -> 5m -> até 10m.
  // Impede o loop de reconexão que consumia as requisições do Redis/browser
  // quando o cliente falha repetidamente em iniciar.
  private getStartCooldown(): number {
    if (this.consecutiveFailures === 0) return 0
    const base = 5000
    const max = 10 * 60 * 1000
    return Math.min(base * Math.pow(3, this.consecutiveFailures - 1), max)
  }

  private canAttemptStart(): boolean {
    if (this.consecutiveFailures === 0) return true
    return Date.now() - this.lastStartAttempt >= this.getStartCooldown()
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

  isStarted(): boolean {
    return this.started
  }

  // Health check real - verifica se o WhatsApp Web está realmente conectado
  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isReady()) {
      return false
    }
    try {
      // Tentar acessar propriedades que só existem quando realmente conectado
      const info = this.client.info
      if (!info || !info.wid || !info.pushname) {
        return false
      }
      // Verificar se o cliente ainda tem o browser vivo
      const pupPage = (this.client as any).pupPage
      if (pupPage && pupPage.isClosed()) {
        return false
      }
      return true
    } catch (error) {
      console.warn('[WHATSAPP] Health check falhou:', error instanceof Error ? error.message : error)
      return false
    }
  }

  // Inicia o cliente. Reconexão acontece apenas quando um envio falha
  // (sendWithReconnect na rota de envio). Não há polling/health check em
  // background para não consumir requisições enquanto o painel fica aberto.
  async start(): Promise<void> {
    if (this.isStarting) return
    if (!this.canAttemptStart()) {
      const wait = this.getStartCooldown()
      console.warn(`[WHATSAPP] Início adiado pelo cooldown (${Math.round(wait / 1000)}s) para evitar loop...`)
      throw new Error(`Cooldown de reconexão ativo (${Math.round(wait / 1000)}s). Aguarde antes de tentar novamente.`)
    }

    this.isStarting = true
    this.lastStartAttempt = Date.now()

    try {
      // Se o client foi destruído, recria uma instância 100% nova para evitar
      // referências a páginas/frames já destacados ("detached Frames").
      if (!this.client) {
        this.initialize()
      }

      // Se já está rodando (navegador vivo com session lock), NÃO reinicia o
      // navegador. Isso evita conflito de lock "browser is already running"
      // quando múltiplas chamadas de status chegam durante a espera do QR.
      if (this.started) {
        return
      }

      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'connecting')
      console.log('[WHATSAPP] Iniciando cliente...')

      await this.initializeWithRetry()
      this.started = true
      this.consecutiveFailures = 0
    } catch (error) {
      this.consecutiveFailures++
      console.error('[WHATSAPP] Erro ao iniciar:', error)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'error')
      throw error
    } finally {
      this.isStarting = false
    }
  }

  async stop(): Promise<void> {
    if (!this.client) return

    console.log('[WHATSAPP] Parando cliente...')
    await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'disconnected')
    
    try {
      await this.client.destroy()
    } catch (error) {
      console.error('[WHATSAPP] Erro ao parar:', error)
    } finally {
      // Descarta a instância destruída; o próximo start() cria um Client novo.
      this.client = null
      this.qrCode = null
      this.started = false
    }
  }
}
