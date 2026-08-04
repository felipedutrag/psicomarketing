import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Part } from '@google/generative-ai'
import { CONFIG } from './config'
import { OPENAI_TOOLS, GEMINI_TOOLS } from './tools'
import { executeTool } from './tool-executors'

export interface ToolContext {
  firstName?: string
  webhookUserId?: string
  webhookFirstName?: string
}

export async function runNvidia(
  apiKey: string,
  system: string,
  history: Array<[string, string]>,
  userText: string,
  userId: string,
  modelName: string = CONFIG.SECONDARY_NVIDIA_MODEL,
  context?: ToolContext
): Promise<{ reply: string }> {
  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: system },
    ...history.map(([r, t]) => ({ role: r === 'model' ? 'assistant' : 'user', content: t })),
    { role: 'user', content: userText }
  ]

  for (let round = 0; round < CONFIG.MAX_TOOL_ROUNDS; round++) {
    console.log(`[NVIDIA] Rodada ${round + 1} - chamada à API (${modelName})`)
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7
      })
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(`NVIDIA (${modelName}) ${res.status}: ${JSON.stringify(json)}`)
    }

    const msg = json.choices?.[0]?.message
    if (!msg) throw new Error(`NVIDIA (${modelName}) sem resposta: ${JSON.stringify(json)}`)

    const toolCalls = msg.tool_calls
    if (toolCalls && toolCalls.length > 0) {
      console.log(`[NVIDIA] ${toolCalls.length} tool call(s)`)
      messages.push(msg)
      let messageSent = false
      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments || '{}')
        } catch {
          args = {}
        }
        const { response } = await executeTool(tc.function.name, args, userId, context)
        if (response.message_sent) {
          messageSent = true
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(response) })
      }
      // Se a ferramenta enviou uma mensagem, retorna uma string vazia para evitar envio duplicado
      if (messageSent) {
        console.log(`[NVIDIA] Ferramenta enviou mensagem, retornando resposta vazia`)
        return { reply: '' }
      }
      continue
    }

    const reply = msg.content || ''
    console.log(`[NVIDIA - ${modelName}] Resposta recebida:`, reply.substring(0, 100))
    return { reply }
  }

  throw new Error(`NVIDIA (${modelName}): número máximo de rodadas de tools atingido`)
}

export async function runGroq(
  apiKey: string,
  system: string,
  history: Array<[string, string]>,
  userText: string,
  userId: string,
  modelName: string = CONFIG.GROQ_FALLBACK_MODEL,
  context?: ToolContext
): Promise<{ reply: string }> {
  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: system },
    ...history.map(([r, t]) => ({ role: r === 'model' ? 'assistant' : 'user', content: t })),
    { role: 'user', content: userText }
  ]

  for (let round = 0; round < CONFIG.MAX_TOOL_ROUNDS; round++) {
    console.log(`[GROQ] Rodada ${round + 1} - chamada à API (${modelName})`)
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7
      })
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(`Groq (${modelName}) ${res.status}: ${JSON.stringify(json)}`)
    }

    const msg = json.choices?.[0]?.message
    if (!msg) throw new Error(`Groq (${modelName}) sem resposta: ${JSON.stringify(json)}`)

    const toolCalls = msg.tool_calls
    if (toolCalls && toolCalls.length > 0) {
      console.log(`[GROQ] ${toolCalls.length} tool call(s)`)
      messages.push(msg)
      let messageSent = false
      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments || '{}')
        } catch {
          args = {}
        }
        const { response } = await executeTool(tc.function.name, args, userId, context)
        if (response.message_sent) {
          messageSent = true
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(response) })
      }
      // Se a ferramenta enviou uma mensagem, retorna uma string vazia para evitar envio duplicado
      if (messageSent) {
        console.log(`[GROQ] Ferramenta enviou mensagem, retornando resposta vazia`)
        return { reply: '' }
      }
      continue
    }

    const reply = msg.content || ''
    console.log(`[GROQ - ${modelName}] Resposta recebida:`, reply.substring(0, 100))
    return { reply }
  }

  throw new Error(`Groq (${modelName}): número máximo de rodadas de tools atingido`)
}

export async function runGemini(
  apiKey: string,
  system: string,
  history: Array<[string, string]>,
  userText: string,
  userId: string,
  context?: ToolContext
): Promise<{ reply: string }> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const historyParts: Array<{ role: string; parts: Array<{ text: string }> }> = history.map(([r, t]) => ({
    role: r,
    parts: [{ text: t }]
  }))

  let lastError: unknown = null
  for (const modelName of CONFIG.GEMINI_MODELS) {
    try {
      console.log(`[PROCESS-AI] Tentando Gemini ${modelName}...`)
      const model = genAI.getGenerativeModel(
        {
          model: modelName,
          systemInstruction: system,
          tools: GEMINI_TOOLS as never
        },
        { timeout: CONFIG.GEMINI_TIMEOUT_MS }
      )
      const chat = model.startChat({ history: historyParts })

      let userMessage: string | Part[] = userText
      for (let round = 0; round < CONFIG.MAX_TOOL_ROUNDS; round++) {
        const response = await chat.sendMessage(userMessage)
        const fnCalls = response.response.functionCalls()

        if (fnCalls && fnCalls.length > 0) {
          console.log(`[PROCESS-AI] Gemini ${modelName} rodada ${round + 1}: ${fnCalls.length} function call(s)`)
          const fnResponses: Part[] = []
          let messageSent = false
          for (const fn of fnCalls) {
            const { response: toolResp } = await executeTool(fn.name, (fn.args || {}) as Record<string, unknown>, userId, context)
            if (toolResp.message_sent) {
              messageSent = true
            }
            fnResponses.push({
              functionResponse: { name: fn.name, response: toolResp }
            })
          }
          // Se a ferramenta enviou uma mensagem, retorna uma string vazia para evitar envio duplicado
          if (messageSent) {
            console.log(`[PROCESS-AI] Ferramenta enviou mensagem, retornando resposta vazia`)
            return { reply: '' }
          }
          userMessage = fnResponses
          continue
        }

        const reply = response.response.text()
        console.log(`[PROCESS-AI] Gemini ${modelName} resposta:`, reply.substring(0, 100))
        return { reply }
      }

      throw new Error(`Gemini (${modelName}): número máximo de rodadas de tools atingido`)
    } catch (err) {
      console.error(`[PROCESS-AI] Gemini ${modelName} falhou:`, err)
      lastError = err
      continue
    }
  }

  throw lastError || new Error('Todos os modelos Gemini falharam')
}
