export const CONFIG = {
  MAX_DURATION: 180,
  DEBOUNCE_MS: 5000,
  MAX_THREAD_SIZE: 10,
  GEMINI_MODELS: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
  GEMINI_TIMEOUT_MS: 25000,
  PRIMARY_MODEL: process.env.PRIMARY_MODEL || 'openai/gpt-oss-120b',
  SECONDARY_NVIDIA_MODEL: 'nvidia/nemotron-3-ultra-550b-a55b',
  GROQ_FALLBACK_MODEL: 'openai/gpt-oss-120b',
  MAX_TOOL_ROUNDS: 5,
  MC_API: 'https://api.manychat.com/fb',
  MC_AUTH: () => `4893318:6124c375829053829537d02892ea7ce8`
} as const
