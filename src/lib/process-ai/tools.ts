import { SchemaType } from '@google/generative-ai'

export type ToolDef = {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const TOOL_DEFS: ToolDef[] = [
  {
    name: 'get_lead_stage',
    description: 'Obtém a etapa atual do funil de vendas do lead (ex: f_interessado, f_reuniao_agendada, f_quebra_objecao, f_fechamento). Use para saber onde o lead está no funil.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'update_funnel_stage',
    description: 'Move o lead para uma nova etapa do funil. Etapas válidas: f_interessado (quando manifestar interesse no link/site), f_fechamento (quando fizer agendamento por voz ou demonstrar intenção de fechar), f_quebra_objecao (quando recusar após oferta pós agendamento). Use ao avançar ou desviar o lead no funil.',
    parameters: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          description: 'Nova etapa do funil (f_interessado, f_fechamento ou f_quebra_objecao).'
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
  },
  // send_message_with_buttons foi removida das tools da IA intencionalmente.
  // O botão só deve ser enviado via chamada programática explícita no código,
  // nunca por decisão autônoma do modelo. Veja tool-executors.ts para uso direto.
  {
    name: 'voice_booking_completed',
    description: 'Registra que o usuário completou um agendamento por voz na landing page e move o lead para a etapa de fechamento (f_fechamento). Use quando o usuário demonstrar interesse após testar a IA de voz ou fazer um agendamento simulado.',
    parameters: { type: 'object', properties: {} }
  }
]

// Formato OpenAI (Groq)
export const OPENAI_TOOLS = TOOL_DEFS.map(d => ({
  type: 'function' as const,
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
      case 'object': return SchemaType.OBJECT
      default: return SchemaType.STRING
    }
  }
  const convertProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      const p = v as {
        type?: string
        description?: string
        items?: Record<string, unknown>
        properties?: Record<string, unknown>
        required?: string[]
      }
      const propSchema: Record<string, unknown> = {
        type: p.type ? mapType(p.type) : SchemaType.STRING,
        ...(p.description ? { description: p.description } : {})
      }
      if (p.type === 'array' && p.items) {
        const itemType = (p.items.type as string) || 'string'
        if (itemType === 'object' && p.items.properties) {
          propSchema.items = {
            type: SchemaType.OBJECT,
            properties: convertProps(p.items.properties as Record<string, unknown>),
            ...(p.items.required ? { required: p.items.required } : {})
          }
        } else {
          propSchema.items = {
            type: mapType(itemType)
          }
        }
      } else if (p.type === 'object' && p.properties) {
        propSchema.properties = convertProps(p.properties as Record<string, unknown>)
        if (p.required) propSchema.required = p.required
      }
      out[k] = propSchema
    }
    return out
  }
  return {
    type: SchemaType.OBJECT,
    properties: convertProps(params.properties),
    ...(params.required ? { required: params.required } : {})
  }
}

export const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOL_DEFS.map(d => ({
      name: d.name,
      description: d.description,
      parameters: toGeminiSchema(d.parameters)
    }))
  }
] as unknown as Array<{ functionDeclarations: Array<{ name: string; description: string; parameters: unknown }> }>
