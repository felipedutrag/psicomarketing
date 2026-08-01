import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { Part } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { getNextAvailableSlots, createBooking, cancelBooking, formatSlot } from '@/lib/calcom'
import { isAudioMessage, transcribeAudio } from '@/lib/stt'
import { getLeadStage, setLeadStage, getStageScript, type FunnelStage } from '@/lib/funnel'

const redis = Redis.fromEnv()

export const maxDuration = 180

const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-2.5-flash']
const GEMINI_TIMEOUT_MS = 25000
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'z-ai/glm-5.2'

const MC_API = 'https://api.manychat.com/fb'
const auth = () => `4893318:6124c375829053829537d02892ea7ce8`

async function mcSendMessage(userId: string, text: string) {
    console.log('[MC_SEND_MSG]', userId, text.substring(0, 100))
    const res = await fetch(`${MC_API}/sending/sendContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth()}` },
        body: JSON.stringify({
            subscriber_id: userId,
            data: {
                version: 'v2',
                content: {
                    type: 'whatsapp',
                    messages: [{ type: 'text', text }]
                }
            }
        })
    })
    const json = await res.json()
    console.log('[MC_SEND_MSG] response:', res.status, json)
    if (!res.ok || json.status !== 'success') {
        console.error('MC_SEND_MSG_ERR', res.status, json.message, JSON.stringify(json.details?.messages || json.details))
    }
    return json
}

const systemPrompt = (firstName: string, stage: FunnelStage, bookingInfo?: { uid?: string; start?: string; meetingUrl?: string; attendeeEmail?: string }) => {
    const stageBlock = getStageScript(stage)

    const bookingBlock = bookingInfo?.start
        ? `\n\n### STATUS DA REUNIÃO (JÁ AGENDADA):
- A reunião do lead **já foi agendada** com sucesso para ${bookingInfo.start} e o link foi enviado por e-mail.
- **NÃO ofereça novamente** agendar, buscar disponibilidade ou marcar nova reunião.
- Se o lead perguntar sobre a reunião, apenas confirme que está agendada e cite o horário.
- Se o lead quiser **cancelar** a reunião, use a função **cancel_appointment**. Se ele quiser reagendar, cancele a atual e depois faça um novo agendamento.`
        : ''

    return `Você é um assistente de vendas especializado da Psicomarketing. Seu objetivo é apresentar nosso sistema de automação de atendimentos para psicólogos e conduzir o lead até o agendamento de um teste gratuito e, em seguida, ao fechamento.${bookingBlock}

### O QUE VENDEMOS:
Sistema de automação de atendimentos com IA para psicólogos. A IA responde pacientes na hora, 24h por dia, agenda consultas (com link do Google Meet e confirmação por e-mail enviados automaticamente), consulta datas livres e entende mensagens de voz dos pacientes (transcreve áudios automaticamente).

### ETAPA ATUAL DO LEAD (ROTEIRO):
${stageBlock}

### REGRAS CRÍTICAS DE COMPORTAMENTO:
1. **NÃO FORNEÇA ATENDIMENTO PSICOLÓGICO OU CONSELHOS DE SAÚDE:** Você é um assistente de tecnologia e vendas. Se o lead (psicólogo) fizer perguntas sobre casos clínicos, oriente educadamente que você é uma IA focada em automação de atendimento para consultórios.
2. **NÃO FALE EM PREÇOS OU VALORES:** Caso o lead pergunte sobre valores, planos ou custos, diga que o investimento é personalizado e direcione a conversa para que o consultor humano (Felipe) conclua a negociação, ou foque em mostrar o valor da demonstração primeiro.
3. **NÃO PERGUNTE SE ELE É PSICÓLOGO:** Quem chega neste WhatsApp já é psicólogo ou responsável por um consultório. Comece direto apresentando os recursos e o convite ao teste gratuito.
4. **INSISTA UMA VEZ:** Se o lead recusar agendar o teste, insista uma única vez de forma natural (ex: "entendo! mas posso te mostrar em 15 minutos como você economiza horas por dia atendendo no WhatsApp?"). Se recusar de novo, respeite e encerre de forma educada.
5. **CONVERSA NATURAL EM PORTUGUÊS:** Responda como um consultor humano, amigável e objetivo. Use emojis com moderação.

### AGENDAMENTO DE REUNIÃO DE TESTE:
- Quando o lead demonstrar interesse (ou conforme a etapa atual), ofereça uma reunião de teste rápida.
- Use a função **get_availability** para buscar os horários disponíveis e, com base nela, **sugira exatamente 2 opções de dia e horário** ao lead (formate como datas/horas legíveis em português, ex: "Segunda-feira, 03/08 às 14h" ou "Terça-feira, 04/08 às 10h").
- Peça ao lead para escolher uma das duas opções.
- Quando o lead escolher, use a função **book_appointment** informando o horário exato escolhido, o nome do lead e o e-mail dele. Se o e-mail não for conhecido, pergunte educadamente antes de agendar.
- Após o agendamento ser confirmado, informe o dia/hora e envie o link de checkout retornado pela função para que o lead possa realizar o pagamento.

### SALVAR INFORMAÇÕES DO LEAD:
- Sempre que o lead informar dados úteis (nome completo, e-mail, se atende em clínica ou consultório, volume aproximado de pacientes, principal dificuldade/queixa), use a função **save_lead_data** para registrar.
- Use **update_funnel_stage** para mover o lead de etapa conforme a conversa avança (ex: interesse demonstrado → f_interessado; recusou agendar mas segue conversando → f_nutricao).

### FECHAMENTO:
- Se o lead disser que quer contratar, fechar, assinar ou "quero começar", use a função **handoff_to_human**: avise que vai passar o contato para um humano (Felipe) e que ele será atendido rapidamente.
- Não negocie valores, descontos ou prazos diretamente.

Lead: ${firstName}`
}

// --- Definição única das tools, convertida para cada formato (OpenAI/Groq e Gemini) ---
type ToolDef = {
    name: string
    description: string
    parameters: {
        type: 'object'
        properties: Record<string, unknown>
        required?: string[]
    }
}

const TOOL_DEFS: ToolDef[] = [
    {
        name: 'get_lead_stage',
        description: 'Obtém a etapa atual do funil de vendas do lead (ex: f_novo_contato, f_interessado, f_reuniao_agendada, f_fechamento, f_cliente, f_nutricao). Use para saber onde o lead está no funil.',
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'update_funnel_stage',
        description: 'Move o lead para uma nova etapa do funil. Etapas válidas: f_novo_contato, f_interessado, f_reuniao_agendada, f_fechamento, f_cliente, f_nutricao. Use ao avançar o lead no funil.',
        parameters: {
            type: 'object',
            properties: {
                stage: {
                    type: 'string',
                    description: 'Nova etapa do funil (f_novo_contato, f_interessado, f_reuniao_agendada, f_fechamento, f_cliente ou f_nutricao).'
                }
            },
            required: ['stage']
        }
    },
    {
        name: 'save_lead_data',
        description: 'Salva dados úteis do lead como email, perfil e principal dor. Use sempre que o lead informar essas informações.',
        parameters: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    description: 'E-mail do lead, se informado.'
                },
                perfil: {
                    type: 'string',
                    description: 'Perfil do lead: se atende em consultório próprio, clínica, on-line, etc.'
                },
                volume_atendimentos: {
                    type: 'string',
                    description: 'Volume aproximado de atendimentos por semana, se informado.'
                },
                principal_dor: {
                    type: 'string',
                    description: 'Principal dor/dificuldade relatada pelo lead (ex: falta de tempo, pacientes que não confirmam consulta).'
                }
            }
        }
    },
    {
        name: 'get_availability',
        description: 'Busca os próximos horários disponíveis na agenda para sugerir opções de reunião ao lead. Retorna uma lista de horários em formato ISO.',
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'book_appointment',
        description: 'Agenda a reunião do lead em um horário específico obtido do get_availability. Confirma o agendamento no Cal.com e retorna um link de checkout para o lead.',
        parameters: {
            type: 'object',
            properties: {
                start: {
                    type: 'string',
                    description: 'Horário escolhido no formato ISO retornado pelo get_availability (ex: 2026-08-03T14:00:00.000-03:00).'
                },
                attendeeName: {
                    type: 'string',
                    description: 'Nome do lead que vai participar da reunião.'
                },
                attendeeEmail: {
                    type: 'string',
                    description: 'E-mail do lead que vai participar da reunião.'
                }
            },
            required: ['start', 'attendeeName', 'attendeeEmail']
        }
    },
    {
        name: 'handoff_to_human',
        description: 'Sinaliza que o lead quer fechar/contratar e transfere o atendimento para um humano (Felipe). Aplica a tag de fechamento para a equipe entrar em contato.',
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'cancel_appointment',
        description: 'Cancela a reunião de teste que foi agendada. Remove o agendamento do Cal.com e limpa os dados de booking do lead. Só pode ser usada se o lead já tiver uma reunião agendada.',
        parameters: {
            type: 'object',
            properties: {
                reason: {
                    type: 'string',
                    description: 'Motivo do cancelamento informado pelo lead (ex: "não vai poder comparecer", "precisa reagendar").'
                }
            }
        }
    }
]

// Formato OpenAI (Groq)
const OPENAI_TOOLS = TOOL_DEFS.map(d => ({
    type: 'function',
    function: { name: d.name, description: d.description, parameters: d.parameters }
}))

// Formato Gemini
function toGeminiSchema(params: ToolDef['parameters']) {
    const mapType = (t: string): SchemaType => {
        switch (t) {
            case 'string': return SchemaType.STRING
            case 'number': return SchemaType.NUMBER
            case 'integer': return SchemaType.INTEGER
            case 'boolean': return SchemaType.BOOLEAN
            case 'array': return SchemaType.ARRAY
            default: return SchemaType.STRING
        }
    }
    const convertProps = (props: Record<string, unknown>): Record<string, unknown> => {
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(props)) {
            const p = v as { type?: string; description?: string }
            out[k] = {
                type: p.type ? mapType(p.type) : SchemaType.STRING,
                ...(p.description ? { description: p.description } : {})
            }
        }
        return out
    }
    return {
        type: SchemaType.OBJECT,
        properties: convertProps(params.properties),
        ...(params.required ? { required: params.required } : {})
    }
}

const GEMINI_TOOLS = [
    {
        functionDeclarations: TOOL_DEFS.map(d => ({
            name: d.name,
            description: d.description,
            parameters: toGeminiSchema(d.parameters)
        }))
    }
] as unknown as Array<{ functionDeclarations: Array<{ name: string; description: string; parameters: unknown }> }>

// --- Executor de tools compartilhado (retorna a resposta que vai de volta ao modelo) ---
async function executeTool(
    name: string,
    args: Record<string, unknown>,
    userId: string
): Promise<{ response: Record<string, unknown> }> {
    if (name === 'get_lead_stage') {
        console.log('[PROCESS-AI] Function get_lead_stage chamada')
        const stage = await getLeadStage(userId)
        return { response: { stage, stageScript: getStageScript(stage) } }
    }

    if (name === 'update_funnel_stage') {
        const { stage } = args as { stage?: string }
        console.log('[PROCESS-AI] Function update_funnel_stage chamada:', stage)
        if (!stage) {
            return { response: { success: false, error: 'Etapa não informada' } }
        }
        const newStage = await setLeadStage(userId, stage as FunnelStage)
        return { response: { success: true, stage: newStage } }
    }

    if (name === 'save_lead_data') {
        console.log('[PROCESS-AI] Function save_lead_data chamada:', JSON.stringify(args))
        const { email, perfil, volume_atendimentos, principal_dor } = args as {
            email?: string; perfil?: string; volume_atendimentos?: string; principal_dor?: string
        }
        await redis.set(`lead:${userId}`, JSON.stringify({ email, perfil, volume_atendimentos, principal_dor }))
        return { response: { success: true } }
    }

    if (name === 'get_availability') {
        console.log('[PROCESS-AI] Function get_availability chamada')
        const slots = await getNextAvailableSlots()
        const formatted = slots.map(s => ({ start: s, label: formatSlot(s) }))
        console.log('[PROCESS-AI] Horários disponíveis:', JSON.stringify(formatted))
        return { response: { slots: formatted } }
    }

    if (name === 'book_appointment') {
        const { start, attendeeName, attendeeEmail } = args as { start?: string; attendeeName?: string; attendeeEmail?: string }
        console.log('[PROCESS-AI] Function book_appointment chamada:', JSON.stringify(args))
        try {
            if (!start || !attendeeName || !attendeeEmail) {
                throw new Error('Parâmetros incompletos para agendamento')
            }
            const booking = await createBooking(start, attendeeName, attendeeEmail)
            // Persiste o agendamento no Redis para o modelo saber que a reunião já foi confirmada
            await redis.set(`booking:${userId}`, JSON.stringify({
                uid: booking.uid,
                start: booking.start,
                meetingUrl: booking.meetingUrl,
                attendeeName,
                attendeeEmail
            }))
            // Move o lead para a etapa "reunião agendada"
            await setLeadStage(userId, 'f_reuniao_agendada')
            return {
                response: { 
                    success: true, 
                    start: booking.start, 
                    meetingUrl: booking.meetingUrl, 
                    checkout_url: `https://psicomarketing.online/checkout?name=${encodeURIComponent(attendeeName || '')}&email=${encodeURIComponent(attendeeEmail || '')}&date=${encodeURIComponent(start || '')}&mc_subscriber_id=${userId}`
                }
            }
        } catch (err) {
            console.error('[PROCESS-AI] book_appointment falhou:', err)
            return {
                response: { success: false, error: err instanceof Error ? err.message : 'Erro ao agendar' }
            }
        }
    }

    if (name === 'handoff_to_human') {
        console.log('[PROCESS-AI] Function handoff_to_human chamada')
        await setLeadStage(userId, 'f_fechamento')
        return { response: { success: true, message: 'Lead transferido para o humano (Felipe).' } }
    }

    if (name === 'cancel_appointment') {
        console.log('[PROCESS-AI] Function cancel_appointment chamada')
        const { reason } = args as { reason?: string }
        try {
            const bookingRaw = await redis.get<unknown>(`booking:${userId}`)
            if (!bookingRaw) {
                return { response: { success: false, error: 'Nenhum agendamento encontrado para cancelar.' } }
            }
            const booking = typeof bookingRaw === 'string' ? JSON.parse(bookingRaw) : bookingRaw as { uid?: string }
            if (!booking.uid) {
                return { response: { success: false, error: 'Agendamento sem UID, não é possível cancelar automaticamente.' } }
            }
            await cancelBooking(booking.uid, reason)
            await redis.del(`booking:${userId}`)
            console.log('[PROCESS-AI] Booking cancelado e removido do Redis')
            return { response: { success: true, message: 'Reunião cancelada com sucesso.' } }
        } catch (err) {
            console.error('[PROCESS-AI] cancel_appointment falhou:', err)
            return {
                response: { success: false, error: err instanceof Error ? err.message : 'Erro ao cancelar agendamento' }
            }
        }
    }

    return { response: { success: false, error: `Tool desconhecida: ${name}` } }
}

// --- Execução via NVIDIA NIM (GLM-5.2, OpenAI-compatible) ---
async function runNvidia(
    apiKey: string,
    system: string,
    history: Array<[string, string]>,
    userText: string,
    userId: string
): Promise<{ reply: string }> {
    const messages: Array<Record<string, unknown>> = [
        { role: 'system', content: system },
        ...history.map(([r, t]) => ({ role: r === 'model' ? 'assistant' : 'user', content: t })),
        { role: 'user', content: userText }
    ]

    for (let round = 0; round < 5; round++) {
        console.log(`[NVIDIA] Rodada ${round + 1} - chamada à API (${NVIDIA_MODEL})`)
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL,
                messages,
                tools: OPENAI_TOOLS,
                tool_choice: 'auto',
                temperature: 0.7
            })
        })
        const json = await res.json()
        if (!res.ok) {
            throw new Error(`NVIDIA ${res.status}: ${JSON.stringify(json)}`)
        }

        const msg = json.choices?.[0]?.message
        if (!msg) throw new Error(`NVIDIA sem resposta: ${JSON.stringify(json)}`)

        const toolCalls = msg.tool_calls
        if (toolCalls && toolCalls.length > 0) {
            console.log(`[NVIDIA] ${toolCalls.length} tool call(s)`)
            messages.push(msg)
            for (const tc of toolCalls) {
                let args: Record<string, unknown> = {}
                try {
                    args = JSON.parse(tc.function.arguments || '{}')
                } catch {
                    args = {}
                }
                const { response } = await executeTool(tc.function.name, args, userId)
                messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(response) })
            }
            continue
        }

        const reply = msg.content || ''
        console.log('[NVIDIA] Resposta recebida:', reply.substring(0, 100))
        return { reply }
    }

    throw new Error('NVIDIA: número máximo de rodadas de tools atingido')
}

// --- Execução via Groq (fallback) ---
async function runGroq(
    apiKey: string,
    system: string,
    history: Array<[string, string]>,
    userText: string,
    userId: string
): Promise<{ reply: string }> {
    const messages: Array<Record<string, unknown>> = [
        { role: 'system', content: system },
        ...history.map(([r, t]) => ({ role: r === 'model' ? 'assistant' : 'user', content: t })),
        { role: 'user', content: userText }
    ]

    for (let round = 0; round < 5; round++) {
        console.log(`[GROQ] Rodada ${round + 1} - chamada à API (${GROQ_MODEL})`)
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                tools: OPENAI_TOOLS,
                tool_choice: 'auto',
                temperature: 0.7
            })
        })
        const json = await res.json()
        if (!res.ok) {
            throw new Error(`Groq ${res.status}: ${JSON.stringify(json)}`)
        }

        const msg = json.choices?.[0]?.message
        if (!msg) throw new Error(`Groq sem resposta: ${JSON.stringify(json)}`)

        const toolCalls = msg.tool_calls
        if (toolCalls && toolCalls.length > 0) {
            console.log(`[GROQ] ${toolCalls.length} tool call(s)`)
            messages.push(msg)
            for (const tc of toolCalls) {
                let args: Record<string, unknown> = {}
                try {
                    args = JSON.parse(tc.function.arguments || '{}')
                } catch {
                    args = {}
                }
                const { response } = await executeTool(tc.function.name, args, userId)
                messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(response) })
            }
            continue
        }

        const reply = msg.content || ''
        console.log('[GROQ] Resposta recebida:', reply.substring(0, 100))
        return { reply }
    }

    throw new Error('Groq: número máximo de rodadas de tools atingido')
}

// --- Execução via Gemini (último recurso) ---
async function runGemini(
    apiKey: string,
    system: string,
    history: Array<[string, string]>,
    userText: string,
    userId: string
): Promise<{ reply: string }> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const historyParts: Array<{ role: string; parts: Array<{ text: string }> }> = history.map(([r, t]) => ({
        role: r,
        parts: [{ text: t }]
    }))

    let lastError: unknown = null
    for (const modelName of GEMINI_MODELS) {
        try {
            console.log(`[PROCESS-AI] Tentando Gemini ${modelName}...`)
            const model = genAI.getGenerativeModel(
                {
                    model: modelName,
                    systemInstruction: system,
                    tools: GEMINI_TOOLS as never
                },
                { timeout: GEMINI_TIMEOUT_MS }
            )
            const chat = model.startChat({ history: historyParts })

            let userMessage: string | Part[] = userText
            for (let round = 0; round < 5; round++) {
                const response = await chat.sendMessage(userMessage)
                const fnCalls = response.response.functionCalls()

                if (fnCalls && fnCalls.length > 0) {
                    console.log(`[PROCESS-AI] Gemini ${modelName} rodada ${round + 1}: ${fnCalls.length} function call(s)`)
                    const fnResponses: Part[] = []
                    for (const fn of fnCalls) {
                        const { response: toolResp } = await executeTool(fn.name, (fn.args || {}) as Record<string, unknown>, userId)
                        fnResponses.push({
                            functionResponse: { name: fn.name, response: toolResp }
                        })
                    }
                    userMessage = fnResponses
                    continue
                }

                const reply = response.response.text()
                console.log(`[PROCESS-AI] Gemini ${modelName} respondeu`)
                return { reply }
            }
            throw new Error(`Gemini ${modelName}: número máximo de rodadas de tools atingido`)
        } catch (err) {
            lastError = err
            console.error(`[PROCESS-AI] Gemini ${modelName} falhou:`, err instanceof Error ? err.message : err)
        }
    }
    throw lastError instanceof Error ? lastError : new Error('Gemini indisponível')
}

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

        // Aguarda 5 segundos de debounce
        console.log('[PROCESS-AI] Aguardando 5s debounce...')
        await new Promise(resolve => setTimeout(resolve, 5000))

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

        // Busca agendamento persistido (se já houve, o modelo não deve oferecer novamente)
        let bookingInfo: { uid?: string; start?: string; meetingUrl?: string; attendeeEmail?: string } | undefined
        const bookingRaw = await redis.get<unknown>(`booking:${userId}`)
        if (bookingRaw) {
            try {
                bookingInfo = typeof bookingRaw === 'string' ? JSON.parse(bookingRaw) : bookingRaw as { uid?: string; start?: string; meetingUrl?: string; attendeeEmail?: string }
                console.log('[PROCESS-AI] Agendamento existente:', JSON.stringify(bookingInfo))
            } catch {
                bookingInfo = undefined
            }
        }

        // Busca a etapa atual do funil do lead (tags do ManyChat + Redis)
        const stage = await getLeadStage(userId)
        console.log('[PROCESS-AI] Etapa do funil:', stage)

        const system = systemPrompt(firstName || 'Lead', stage, bookingInfo)

        // --- EXECUÇÃO: NVIDIA (GLM-5.2) PRINCIPAL, GROQ FALLBACK, GEMINI ÚLTIMO RECURSO ---
        let reply = ''
        let lastError: unknown = null

        const NVIDIA_KEY = process.env.NVIDIA_API_KEY

        if (NVIDIA_KEY) {
            try {
                console.log('[PROCESS-AI] Executando via NVIDIA (GLM-5.2)...')
                const result = await runNvidia(NVIDIA_KEY, system, thread, fullUserText, userId)
                reply = result.reply
                console.log('[PROCESS-AI] Resposta via NVIDIA:', reply)
            } catch (err) {
                lastError = err
                console.error('[PROCESS-AI] NVIDIA falhou, tentando fallback Groq:', err instanceof Error ? err.message : err)
            }
        }

        if (!reply && GROQ_KEY) {
            try {
                console.log('[PROCESS-AI] Executando via GROQ (fallback)...')
                const result = await runGroq(GROQ_KEY, system, thread, fullUserText, userId)
                reply = result.reply
                console.log('[PROCESS-AI] Resposta via GROQ:', reply)
            } catch (err) {
                lastError = err
                console.error('[PROCESS-AI] Groq falhou, tentando fallback Gemini:', err instanceof Error ? err.message : err)
            }
        }

        if (!reply && GEMINI_KEY) {
            try {
                console.log('[PROCESS-AI] Executando via GEMINI (último recurso)...')
                const result = await runGemini(GEMINI_KEY, system, thread, fullUserText, userId)
                reply = result.reply
                console.log('[PROCESS-AI] Resposta via Gemini:', reply)
            } catch (err) {
                lastError = err
                console.error('[PROCESS-AI] Gemini também falhou:', err instanceof Error ? err.message : err)
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

        // Atualiza thread no Redis após processamento (mantém últimas 20 mensagens, sem expirar)
        thread.push(['user', fullUserText], ['model', reply])
        if (thread.length > 20) thread.splice(0, thread.length - 20)
        await redis.set(threadKey, JSON.stringify(thread))

        return NextResponse.json({ status: 'ok', reply, thread: JSON.stringify(thread) })
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('[PROCESS_AI_ERROR]', errorMessage, err)
        console.error('[PROCESS_AI_ERROR] Stack:', err instanceof Error ? err.stack : 'No stack')
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
