import { CONFIG } from '../process-ai/config'
import { runNvidia, runGroq, runGemini } from '../process-ai/ai-providers'

export interface PersonalizationRequest {
  leads: Array<{ nome: string; whatsapp: string }>
  baseMessage: string
  customPrompt?: string
}

export async function personalizeMessages(request: PersonalizationRequest): Promise<Array<{ nome: string; whatsapp: string; mensagem_personalizada: string }>> {
  const { leads, baseMessage, customPrompt } = request
  
  const systemPrompt = customPrompt || `Você é um especialista em personalização de mensagens de WhatsApp para marketing B2B.
Sua tarefa é personalizar uma mensagem base para cada lead, usando o nome da pessoa de forma natural e profissional.
Mantenha o tom original da mensagem mas adapte para soar mais pessoal para cada destinatário.
A mensagem deve ser curta, direta e profissional, adequada para WhatsApp.
Não altere a essência da mensagem original, apenas personalize com o nome.`

  const userPrompt = `Personalize a seguinte mensagem para cada lead:
Mensagem base: "${baseMessage}"

Leads:
${leads.map(lead => `- ${lead.nome} (${lead.whatsapp})`).join('\n')}

Retorne o resultado no formato JSON:
[
  {
    "nome": "Nome do lead",
    "whatsapp": "número",
    "mensagem_personalizada": "mensagem personalizada"
  }
]`

  const GROQ_KEY = process.env.GROQ_API_KEY
  const GEMINI_KEY = process.env.GEMINI_API_KEY
  const NVIDIA_KEY = process.env.NVIDIA_API_KEY

  let result = ''
  let lastError: unknown = null

  // Tenta Gemini primeiro (modelo principal: gemini-3.5-flash-lite)
  if (GEMINI_KEY) {
    try {
      const response = await runGemini(GEMINI_KEY, systemPrompt, [], userPrompt, 'dashboard')
      result = response.reply
    } catch (err) {
      lastError = err
    }
  }

  // Fallback para NVIDIA
  if (!result && NVIDIA_KEY) {
    try {
      const response = await runNvidia(NVIDIA_KEY, systemPrompt, [], userPrompt, 'dashboard', CONFIG.SECONDARY_NVIDIA_MODEL)
      result = response.reply
    } catch (err) {
      lastError = err
    }
  }

  // Fallback para Groq
  if (!result && GROQ_KEY) {
    try {
      const response = await runGroq(GROQ_KEY, systemPrompt, [], userPrompt, 'dashboard', CONFIG.GROQ_FALLBACK_MODEL)
      result = response.reply
    } catch (err) {
      lastError = err
    }
  }

  if (!result) {
    throw lastError || new Error('Todos os modelos de IA falharam')
  }

  // Parse do resultado JSON
  try {
    // Extrair JSON da resposta (pode estar em bloco de código)
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    const jsonString = jsonMatch ? jsonMatch[0] : result
    const personalized = JSON.parse(jsonString)
    
    return personalized.map((item: { nome: string; whatsapp: string; mensagem_personalizada: string }) => ({
      nome: item.nome,
      whatsapp: item.whatsapp,
      mensagem_personalizada: item.mensagem_personalizada
    }))
  } catch (error) {
    console.error('Erro ao parsear resposta da IA:', error)
    // Fallback: retorna mensagens base sem personalização
    return leads.map(lead => ({
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      mensagem_personalizada: baseMessage.replace(/{nome}/gi, lead.nome)
    }))
  }
}
