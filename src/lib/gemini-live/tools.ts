export interface ToolParameter {
  type: string
  description: string
}

export interface ToolDeclaration {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, ToolParameter>
    required: string[]
  }
}

export const GEMINI_LIVE_TOOLS: ToolDeclaration[] = [
  {
    name: 'agendarConsulta',
    description: 'Realiza o agendamento automático de consultas com o psicólogo e envia automaticamente a confirmação via WhatsApp usando o id do usuário do contexto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        nome: { type: 'STRING', description: 'Nome completo do paciente' },
        dia: { type: 'STRING', description: 'Dia da semana desejado (ex: Quinta-feira, Amanhã)' },
        horario: { type: 'STRING', description: 'Horário da consulta (ex: 15:00)' },
        tipoConsulta: { type: 'STRING', description: 'Tipo da consulta (ex: Acolhimento, Terapia Individual)' },
      },
      required: ['nome', 'dia', 'horario'],
    },
  },
  {
    name: 'explicarPlugin',
    description: 'Explica um plugin do ecossistema Psicomarketing.',
    parameters: {
      type: 'OBJECT',
      properties: {
        plugin: { type: 'STRING', description: 'Nome do plugin a ser explicado' },
      },
      required: ['plugin'],
    },
  },
]

export const SYSTEM_INSTRUCTION = `Você é a Lilith, a assistente de voz inteligente e oficial do Psicomarketing.
IMPORTANTE: Assim que a sessão for iniciada, você DEVE começar falando imediatamente sem esperar o usuário. Faça um cumprimento caloroso e profissional.
Se o nome do usuário estiver disponível no contexto, use-o no cumprimento (ex: "Olá, {nome}! Eu sou a Lilith, assistente inteligente do Psicomarketing. Como posso te ajudar a automatizar e escalar seu consultório hoje?").
Se o nome não estiver disponível, use um cumprimento genérico (ex: "Olá! Eu sou a Lilith, assistente inteligente do Psicomarketing. Como posso te ajudar a automatizar e escalar seu consultório hoje?").
NÃO espere o usuário falar primeiro. Inicie a conversa imediatamente.
Sua missão é explicar para psicólogos e clínicas como a automação inteligente escala o consultório.
Seja direta, empática, profissional e perspicaz.
Quando o usuário quiser agendar uma consulta ou demonstração, chame a ferramenta agendarConsulta com nome, dia e horário.
A ferramenta agendarConsulta já envia automaticamente a confirmação via WhatsApp se o id do usuário estiver disponível no contexto.
Responda de forma concisa e natural, ideal para conversa em áudio em tempo real.`

export function buildSystemInstruction(identity?: { nome?: string; id?: string }): string {
  const identityNote =
    identity && (identity.nome || identity.id)
      ? `\n\nContexto de identificação do usuário nesta sessão:\n- nome: ${identity.nome || 'não informado'}\n- id: ${identity.id || 'não informado'}\nUse o nome do usuário nos cumprimentos e na conversa quando apropriado.`
      : ''
  return `${SYSTEM_INSTRUCTION}${identityNote}`
}
