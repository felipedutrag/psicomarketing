import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { isAudioMessage, transcribeAudio } from '@/lib/stt'
import { getLeadStage } from '@/lib/funnel'
import { CONFIG } from '@/lib/process-ai/config'
import { buildSystemPrompt } from '@/lib/process-ai/prompt-builder'
import { mcSendMessage } from '@/lib/process-ai/manychat'
import { runNvidia, runGroq, runGemini } from '@/lib/process-ai/ai-providers'

const redis = Redis.fromEnv()

export const dynamic = 'force-dynamic'
export const maxDuration = 180

export async function GET() {
  console.log('[PROCESS-AI] Health check called')
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}

export async function POST(req: NextRequest) {
  console.log('[PROCESS-AI] ========================================')
  console.log('[PROCESS-AI] REQUEST RECEBIDO')
  console.log('[PROCESS-AI] ========================================')
  try {
    const body = await req.json()
    const { id: userId, first_name: firstName } = body
    console.log('[PROCESS-AI] Iniciando processamento:', { userId, firstName })

    const GROQ_KEY = process.env.GROQ_API_KEY
    const GEMINI_KEY = process.env.GEMINI_API_KEY
    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    if (!GROQ_KEY && !GEMINI_KEY) {
      console.error('[PROCESS-AI] GROQ_API_KEY e GEMINI_API_KEY missing')
      return NextResponse.json({ error: 'Nenhuma API key configurada' }, { status: 500 })
    }

    const bufferKey = `buffer:${userId}`
    const versionKey = `version:${userId}`
    const threadKey = `thread:${userId}`

    // Capta a versão no momento em que a requisição iniciou
    const initialVersion = await redis.get<number>(versionKey)
    console.log('[PROCESS-AI] Versão inicial:', initialVersion)

    // Aguarda o tempo de debounce configurado
    console.log(`[PROCESS-AI] Aguardando ${CONFIG.DEBOUNCE_MS}ms debounce...`)
    await new Promise(resolve => setTimeout(resolve, CONFIG.DEBOUNCE_MS))

    // Checa se o usuário enviou novas mensagens durante o debounce
    const latestVersion = await redis.get<number>(versionKey)
    console.log('[PROCESS-AI] Versão final:', latestVersion, 'inicial:', initialVersion)

    if (latestVersion !== initialVersion) {
      console.log('[PROCESS-AI] Debounce ativado - ignorando execução antiga')
      return NextResponse.json({ status: 'debounced', message: 'Ignored older execution' })
    }

    // Resgata o buffer do Redis (só deleta após sucesso para não perder mensagem)
    const messages = await redis.lrange<string>(bufferKey, 0, -1)
    console.log('[PROCESS-AI] Mensagens do buffer:', messages.length, messages)

    if (!messages || messages.length === 0) {
      console.log('[PROCESS-AI] Buffer vazio')
      return NextResponse.json({ status: 'empty_buffer' })
    }

    // Transcreve mensagens de áudio do usuário (URLs de áudio do WhatsApp)
    const transcribed: string[] = []
    for (const msg of messages) {
      if (isAudioMessage(msg)) {
        console.log('[PROCESS-AI] Mensagem de áudio detectada:', msg)
        try {
          const text = await transcribeAudio(msg)
          transcribed.push(text)
        } catch (err) {
          console.error('[PROCESS-AI] Falha na transcrição de áudio:', err instanceof Error ? err.message : err)
          transcribed.push('[áudio não pôde ser transcrito]')
        }
      } else {
        transcribed.push(msg)
      }
    }

    // Unifica o buffer em um único texto
    const fullUserText = transcribed.join('\n')
    console.log('[PROCESS-AI] Texto completo:', fullUserText)

    // Busca thread do Redis (histórico da conversa).
    const threadFromRedis = await redis.get<unknown>(threadKey)
    let thread: Array<[string, string]> = []
    if (threadFromRedis) {
      try {
        if (Array.isArray(threadFromRedis)) {
          thread = threadFromRedis as Array<[string, string]>
        } else if (typeof threadFromRedis === 'string') {
          thread = JSON.parse(threadFromRedis)
        }
      } catch {
        console.error('[PROCESS-AI] Thread inválida no Redis, reiniciando histórico')
        await redis.del(threadKey)
        thread = []
      }
    }
    console.log('[PROCESS-AI] Thread do Redis:', thread.length, 'mensagens')

    // Busca a etapa atual do funil do lead (tags do ManyChat + Redis)
    const stage = await getLeadStage(userId)
    console.log('[PROCESS-AI] Etapa do funil:', stage)

    const system = buildSystemPrompt(firstName || 'Lead', stage)

    // --- EXECUÇÃO DO AGENTE DE IA EM CASCATA COM FALLBACKS ---
    let reply = ''
    let lastError: unknown = null

    // 1. Modelo Principal: z-ai/glm-5.2 (via NVIDIA NIM ou Groq/OpenAI compatible)
    if (NVIDIA_KEY) {
      try {
        console.log(`[PROCESS-AI] [1/5] Executando modelo principal: ${CONFIG.PRIMARY_MODEL}...`)
        const result = await runNvidia(NVIDIA_KEY, system, thread, fullUserText, userId, CONFIG.PRIMARY_MODEL)
        reply = result.reply
        console.log('[PROCESS-AI] Resposta recebida via principal (NVIDIA):', reply)
      } catch (err) {
        lastError = err
        console.error(`[PROCESS-AI] Modelo principal (${CONFIG.PRIMARY_MODEL}) falhou no NVIDIA NIM:`, err instanceof Error ? err.message : err)
      }
    }

    if (!reply && GROQ_KEY) {
      try {
        console.log(`[PROCESS-AI] [1/5 - tentativa Groq] Executando modelo principal: ${CONFIG.PRIMARY_MODEL}...`)
        const result = await runGroq(GROQ_KEY, system, thread, fullUserText, userId, CONFIG.PRIMARY_MODEL)
        reply = result.reply
        console.log('[PROCESS-AI] Resposta recebida via principal (Groq):', reply)
      } catch (err) {
        lastError = err
        console.error(`[PROCESS-AI] Modelo principal (${CONFIG.PRIMARY_MODEL}) falhou no Groq:`, err instanceof Error ? err.message : err)
      }
    }

    // 2. Segundo Modelo: nvidia/nemotron-3-ultra-550b-a55b (via NVIDIA NIM)
    if (!reply && NVIDIA_KEY) {
      try {
        console.log(`[PROCESS-AI] [2/5] Executando segundo modelo: ${CONFIG.SECONDARY_NVIDIA_MODEL}...`)
        const result = await runNvidia(NVIDIA_KEY, system, thread, fullUserText, userId, CONFIG.SECONDARY_NVIDIA_MODEL)
        reply = result.reply
        console.log('[PROCESS-AI] Resposta recebida via segundo modelo (NVIDIA):', reply)
      } catch (err) {
        lastError = err
        console.error(`[PROCESS-AI] Segundo modelo (${CONFIG.SECONDARY_NVIDIA_MODEL}) falhou:`, err instanceof Error ? err.message : err)
      }
    }

    // 3. Fallbacks Gemini: gemini-3-flash-preview -> gemini-3.5-flash
    if (!reply && GEMINI_KEY) {
      try {
        console.log('[PROCESS-AI] [3/5 & 4/5] Tentando fallbacks Gemini (gemini-3-flash-preview -> gemini-3.5-flash)...')
        const result = await runGemini(GEMINI_KEY, system, thread, fullUserText, userId)
        reply = result.reply
        console.log('[PROCESS-AI] Resposta recebida via Gemini:', reply)
      } catch (err) {
        lastError = err
        console.error('[PROCESS-AI] Fallback Gemini falhou:', err instanceof Error ? err.message : err)
      }
    }

    // 5. Fallback Groq: llama-3.3-70b-versatile
    if (!reply && GROQ_KEY) {
      try {
        console.log(`[PROCESS-AI] [5/5] Executando fallback Groq: ${CONFIG.GROQ_FALLBACK_MODEL}...`)
        const result = await runGroq(GROQ_KEY, system, thread, fullUserText, userId, CONFIG.GROQ_FALLBACK_MODEL)
        reply = result.reply
        console.log('[PROCESS-AI] Resposta recebida via Groq fallback:', reply)
      } catch (err) {
        lastError = err
        console.error(`[PROCESS-AI] Fallback Groq (${CONFIG.GROQ_FALLBACK_MODEL}) falhou:`, err instanceof Error ? err.message : err)
      }
    }

    if (!reply) {
      console.error('[PROCESS-AI] Todos os modelos falharam')
      throw lastError instanceof Error ? lastError : new Error('Nenhum modelo disponível')
    }

    // --- ENVIO DIRETO DA MENSAGEM NO WHATSAPP ---
    console.log('[PROCESS-AI] Enviando mensagem para ManyChat:', reply)
    await mcSendMessage(userId, reply)
    console.log('[PROCESS-AI] Mensagem enviada com sucesso')

    // Só apaga o buffer após sucesso total (evita perder mensagem em falha)
    await redis.del(bufferKey)

    // Atualiza thread no Redis após processamento (mantém últimas N mensagens, sem expirar)
    thread.push(['user', fullUserText], ['model', reply])
    if (thread.length > CONFIG.MAX_THREAD_SIZE) thread.splice(0, thread.length - CONFIG.MAX_THREAD_SIZE)
    await redis.set(threadKey, JSON.stringify(thread))

    return NextResponse.json({ status: 'ok', reply, thread: JSON.stringify(thread) })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[PROCESS_AI_ERROR]', errorMessage, err)
    console.error('[PROCESS_AI_ERROR] Stack:', err instanceof Error ? err.stack : 'No stack')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
