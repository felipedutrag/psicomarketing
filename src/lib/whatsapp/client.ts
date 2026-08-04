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
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isHealthChecking = false
  private isReconnecting = false
  private isStarting = false

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
      // Auto-reconnect imediato ao detectar desconexão
      if (this.started) {
        console.log('[WHATSAPP] Desconexão detectada - agendando reconexão automática...')
        setTimeout(() => {
          this.reconnect().catch(err => {
            console.error('[WHATSAPP] Erro na reconexão agendada:', err)
          })
        }, 1000)
      }
    })

    this.client.on('message', async (message) => {
      if (message.body.toLowerCase() === '!ping') {
        await message.reply('pong')
      }
    })
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

  // Inicia o polling de health check automático
  startHealthCheck(intervalMs = 30000): void {
    if (this.healthCheckInterval) {
      return // Já está rodando
    }
    console.log('[WHATSAPP] Iniciando health check automático a cada', intervalMs, 'ms')
    this.healthCheckInterval = setInterval(async () => {
      if (this.isHealthChecking) return
      this.isHealthChecking = true
      try {
        const healthy = await this.isHealthy()
        const status = await redis.get(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY)
        
        if (!healthy && (status === 'connected' || status === 'ready')) {
          console.warn('[WHATSAPP] Health check detectou desconexão! Status:', status, 'Tentando reconectar...')
          await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'disconnected')
          // Tentar reconectar automaticamente
          await this.reconnect()
        } else if (healthy) {
          // Garantir que o status está correto
          if (status === 'connected' || status === 'ready') {
            // Tudo ok
          }
        }
      } catch (error) {
        console.error('[WHATSAPP] Erro no health check:', error)
      } finally {
        this.isHealthChecking = false
      }
    }, intervalMs)
  }

  // Para o health check
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      console.log('[WHATSAPP] Health check automático parado')
    }
  }

  // Reconexão automática
  private async reconnect(): Promise<void> {
    if (this.isReconnecting) return
    this.isReconnecting = true
    console.log('[WHATSAPP] Iniciando reconexão automática...')
    try {
      await this.stop()
      await sleep(2000)
      await this.start()
      this.startHealthCheck()
      console.log('[WHATSAPP] Reconexão automática concluída')
    } catch (error) {
      console.error('[WHATSAPP] Falha na reconexão automática:', error)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'error')
    } finally {
      this.isReconnecting = false
    }
  }

  // Sobrecarrega start para iniciar health check
  async start(): Promise<void> {
    if (this.isStarting) return
    this.isStarting = true

    try {
      // Se o client foi destruído, recria uma instância 100% nova para evitar
      // referências a páginas/frames já destacados ("detached Frames").
      if (!this.client) {
        this.initialize()
      }

      // Se já está rodando (navegador vivo com session lock), NÃO reinicia o
      // navegador. Isso evita conflito de lock "browser is already running"
      // quando múltiplas chamadas de status chegam durante a espera do QR.
      // A recuperação de browser morto é feita pelo reconnect()/health check.
      if (this.started) {
        this.startHealthCheck()
        return
      }

      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'connecting')
      console.log('[WHATSAPP] Iniciando cliente...')

      await this.initializeWithRetry()
      this.started = true
      this.startHealthCheck()
    } catch (error) {
      console.error('[WHATSAPP] Erro ao iniciar:', error)
      await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, 'error')
      throw error
    } finally {
      this.isStarting = false
    }
  }

  // Sobrecarrega stop para parar health check
  async stop(): Promise<void> {
    if (!this.client) return
    
    this.stopHealthCheck()
    
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
