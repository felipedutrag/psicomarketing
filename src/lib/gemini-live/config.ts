export const GEMINI_LIVE_CONFIG = {
  WS_BASE_URL: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
  DEFAULT_MODEL: 'models/gemini-2.0-flash-exp',
  DEFAULT_VOICE: 'Leda',
  SESSION_EXPIRY_MS: 7200000, // 2 horas
  MAX_HISTORY_SIZE: 20,
  RECONNECT_DELAY_MS: 1000,
  AUDIO_SAMPLE_RATE: 16000,
  VOICE_THRESHOLD: 0.05,
} as const

export const GEMINI_LIVE_VOICES = [
  { id: 'Leda', name: 'Leda', gender: 'Feminina', style: 'Grave & Firme (Padrão Lilith)' },
  { id: 'Aoede', name: 'Aoede', gender: 'Feminina', style: 'Suave & Acolhedora' },
  { id: 'Kore', name: 'Kore', gender: 'Feminina', style: 'Expressiva & Fluida' },
  { id: 'Puck', name: 'Puck', gender: 'Masculina', style: 'Energética & Dinâmica' },
  { id: 'Charon', name: 'Charon', gender: 'Masculina', style: 'Profunda & Séria' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Masculina', style: 'Autoritária & Ponderada' },
  { id: 'Orpheus', name: 'Orpheus', gender: 'Masculina', style: 'Suave & Calma' },
] as const
