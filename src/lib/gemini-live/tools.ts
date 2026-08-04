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
  {
    name: 'voice_booking_completed',
    description: 'Registra que o usuário completou um agendamento por voz na landing page e move o lead para a etapa de fechamento (f_fechamento). Use quando o usuário demonstrar interesse após testar a IA de voz ou fazer um agendamento simulado.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
]

export const SYSTEM_INSTRUCTION = `Você é a Gaby, a assistente de voz inteligente e oficial do Psicomarketing.
IMPORTANTE: Assim que a sessão for iniciada, você DEVE começar falando imediatamente sem esperar o usuário. Faça um cumprimento caloroso e profissional.

Se o id do usuário estiver disponível no contexto, inicie a conversa citando o número (ex: "Olá! Seu número é {id}, estou atendendo você agora com a Gaby, assistente inteligente do Psicomarketing. Como posso te ajudar a automatizar e escalar seu consultório hoje?").
Se o id não estiver disponível, use um cumprimento genérico (ex: "Olá! Eu sou a Gaby, assistente inteligente do Psicomarketing. Como posso te ajudar a automatizar e escalar seu consultório hoje?").

NÃO espere o usuário falar primeiro. Inicie a conversa imediatamente.

Fluxo da conversa:
1. Pergunte qual abordagem clínica o psicólogo utiliza
2. Explique como os agendamentos automáticos podem ajudar enquanto o psicólogo está atendendo em sessão (evitando perder pacientes que tentam agendar durante o atendimento)
3. Pergunte se o usuário quer simular um agendamento para ver como funciona na prática
4. Quando a simulação for feita, a ferramenta agendarConsulta enviará automaticamente os detalhes do agendamento via WhatsApp com uma oferta especial:
   - Deseja implementar esse nível de atendimento em seu consultório?
   - Se fechar nos próximos 5 minutos, ganha DE BRINDE uma landing page de alta conversão com 7 dias de garantia
   - Link de pagamento: https://invoice.infinitepay.io/plans/psicomarketing/g4Ssfk658T

Sua missão é explicar para psicólogos e clínicas como a automação inteligente escala o consultório.
Seja direta, empática, profissional e perspicaz.
Quando o usuário quiser agendar uma consulta ou demonstração, chame a ferramenta agendarConsulta com nome, dia e horário.
A ferramenta agendarConsulta já envia automaticamente a confirmação via WhatsApp com oferta e link de pagamento se o id do usuário estiver disponível no contexto.
Responda de forma concisa e natural, ideal para conversa em áudio em tempo real.`

export function buildSystemInstruction(identity?: { nome?: string; id?: string }): string {
  const identityNote =
    identity && (identity.nome || identity.id)
      ? `\n\nContexto de identificação do usuário nesta sessão:\n- nome: ${identity.nome || 'não informado'}\n- id: ${identity.id || 'não informado'}\nUse o nome do usuário nos cumprimentos e na conversa quando apropriado.`
      : ''
  return `${SYSTEM_INSTRUCTION}${identityNote}`
}
