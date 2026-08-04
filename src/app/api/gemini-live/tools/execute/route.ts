import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/manychat'

interface ToolRequestBody {
  name: string
  args?: Record<string, unknown>
}

interface AgendarConsultaArgs {
  nome?: string
  dia?: string
  horario?: string
  tipoConsulta?: string
  contextId?: string
}

interface ExplicarPluginArgs {
  plugin?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ToolRequestBody
    const { name, args } = body

    if (name === 'agendarConsulta') {
      const { nome, dia, horario, tipoConsulta } = (args || {}) as AgendarConsultaArgs
      
      // Tentar obter id dos parâmetros de contexto da URL
      const contextId = args?.contextId as string | undefined
      
      // Criar o objeto de agendamento
      const agendamento = {
        id: `b-${Date.now()}`,
        nome: nome || 'Paciente',
        dia: dia || 'Quinta-feira',
        horario: horario || '15:00',
        tipoConsulta: tipoConsulta || 'Sessão de Acolhimento',
        status: 'Confirmado via IA Live',
      }
      
      // Enviar confirmação via WhatsApp se o id estiver disponível
      let manychatResult = null
      if (contextId) {
        try {
          const message = [
            `✅ Confirmação de Agendamento (simulado)`,
            ``,
            `Olá, ${nome || 'paciente'}! Sua consulta foi agendada pela Lilith:`,
            `• Tipo: ${tipoConsulta || 'Sessão de Acolhimento'}`,
            `• Dia: ${dia || 'Quinta-feira'}`,
            `• Horário: ${horario || '15:00'}`,
            ``,
            `Se precisar remarcar ou cancelar, é só chamar a Lilith. 😉`,
          ].join('\n')
          manychatResult = await sendMessage(contextId, message)
        } catch (err) {
          console.error('[agendarConsulta] Erro ao enviar confirmação WhatsApp:', err)
        }
      }
      
      return NextResponse.json({
        status: 'success',
        message: `Consulta de ${nome || 'Paciente'} agendada com sucesso para ${dia || 'esta semana'} às ${horario || '15:00'}.`,
        agendamento,
        manychat: manychatResult ? { enviado: true } : { enviado: false, motivo: 'ID não disponível' }
      })
    }

    if (name === 'explicarPlugin') {
      const { plugin } = (args || {}) as ExplicarPluginArgs
      return NextResponse.json({
        status: 'success',
        message: `O plugin ${plugin || 'selecionado'} automatiza a captação e atendimento de pacientes com máxima conformidade ética.`,
      })
    }

    return NextResponse.json({
      status: 'success',
      message: `Ferramenta ${name} executada com sucesso.`,
      args,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro na execução da ferramenta',
      },
      { status: 500 }
    )
  }
}
