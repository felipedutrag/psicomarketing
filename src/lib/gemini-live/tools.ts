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
    description: 'Realiza o agendamento automático de consultas com o psicólogo.',
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
  {
    name: 'enviarConfirmacaoAgendamento',
    description: 'Envia a confirmação do agendamento simulado para o paciente via ManyChat (WhatsApp), usando o id do usuário no ManyChat.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'ID do usuário/subscriber no ManyChat que deve receber a confirmação' },
        nome: { type: 'STRING', description: 'Nome completo do paciente' },
        dia: { type: 'STRING', description: 'Dia da semana da consulta (ex: Quinta-feira, Amanhã)' },
        horario: { type: 'STRING', description: 'Horário da consulta (ex: 15:00)' },
        tipoConsulta: { type: 'STRING', description: 'Tipo da consulta (ex: Acolhimento, Terapia Individual)' },
      },
      required: ['id'],
    },
  },
]

export const SYSTEM_INSTRUCTION = `Você é a Lilith, a assistente de voz inteligente e oficial do Psicomarketing.
Assim que a chamada for iniciada, cumprimente o usuário imediatamente em áudio com uma saudação calorosa e profissional (ex: "Olá! Eu sou a Lilith, assistente inteligente do Psicomarketing. Como posso te ajudar a automatizar e escalar seu consultório hoje?").
Sua missão é explicar para psicólogos e clínicas como a automação inteligente escala o consultório.
Seja direta, empática, profissional e perspicaz.
Quando o usuário quiser agendar uma consulta ou demonstração, chame a ferramenta agendarConsulta com nome, dia e horário.
Responda de forma concisa e natural, ideal para conversa em áudio em tempo real.`

export function buildSystemInstruction(identity?: { nome?: string; id?: string }): string {
  const identityNote =
    identity && (identity.nome || identity.id)
      ? `\n\nContexto opcional de identificação desta sessão (use apenas se fizer sentido na conversa):\n- nome: ${identity.nome || 'não informado'}\n- id: ${identity.id || 'não informado'}`
      : ''
  return `${SYSTEM_INSTRUCTION}${identityNote}`
}
