export const DASHBOARD_CONFIG = {
  DELAY_MIN: 2 * 60 * 1000, // 2 minutos
  DELAY_MAX: 5 * 60 * 1000, // 5 minutos
  WHATSAPP_AUTH_PATH: '.wwebjs_auth',
  SESSION_NAME: 'psicomarketing_dashboard',
  REDIS_PREFIX: 'dashboard:',
  LEADS_KEY: 'dashboard:leads',
  STATS_KEY: 'dashboard:stats',
  WHATSAPP_STATUS_KEY: 'dashboard:whatsapp:status',
} as const

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected' | 'ready' | 'sending' | 'error'

export interface Lead {
  id: string
  nome: string
  whatsapp: string
  website?: string
  mensagem_inicial?: string
  mensagem_personalizada?: string
  status: 'pending' | 'personalized' | 'sent' | 'responded' | 'error'
  data_envio?: string
  data_resposta?: string
  erro?: string
  created_at: string
}

export interface DashboardStats {
  total_leads: number
  pending: number
  personalized: number
  sent: number
  responded: number
  error: number
  response_rate: number
  last_updated: string
}

export interface ScrapingConfig {
  url: string
  data_count: number
  selector?: string
}
