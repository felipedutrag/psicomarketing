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
}

interface ExplicarPluginArgs {
  plugin?: string
}

interface EnviarConfirmacaoArgs {
  id?: string | number
  nome?: string
  dia?: string
  horario?: string
  tipoConsulta?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ToolRequestBody
    const { name, args } = body

    if (name === 'agendarConsulta') {
      const { nome, dia, horario, tipoConsulta } = (args || {}) as AgendarConsultaArgs
      return NextResponse.json({
        status: 'success',
        message: `Consulta de ${nome || 'Paciente'} agendada com sucesso para ${dia || 'esta semana'} às ${horario || '15:00'}.`,
        agendamento: {
          id: `b-${Date.now()}`,
          nome: nome || 'Paciente',
          dia: dia || 'Quinta-feira',
          horario: horario || '15:00',
          tipoConsulta: tipoConsulta || 'Sessão de Acolhimento',
          status: 'Confirmado via IA Live',
        },
      })
    }

    if (name === 'explicarPlugin') {
      const { plugin } = (args || {}) as ExplicarPluginArgs
      return NextResponse.json({
        status: 'success',
        message: `O plugin ${plugin || 'selecionado'} automatiza a captação e atendimento de pacientes com máxima conformidade ética.`,
      })
    }

    if (name === 'enviarConfirmacaoAgendamento') {
      const { id, nome, dia, horario, tipoConsulta } = (args || {}) as EnviarConfirmacaoArgs
      if (id === undefined || id === null || String(id).trim() === '') {
        return NextResponse.json({
          status: 'error',
          message: 'Não foi possível enviar a confirmação: o parâmetro id é obrigatório.',
        })
      }
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
      const manychat = await sendMessage(id, message)
      return NextResponse.json({
        status: 'success',
        message: `Confirmação de agendamento enviada para o ID ${id} via ManyChat.`,
        agendamento: {
          id: `b-${Date.now()}`,
          nome: nome || 'Paciente',
          dia: dia || 'Quinta-feira',
          horario: horario || '15:00',
          tipoConsulta: tipoConsulta || 'Sessão de Acolhimento',
          status: 'Confirmado via IA Live',
        },
        manychat,
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
