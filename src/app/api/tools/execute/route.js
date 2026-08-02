import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, args } = body;

    if (name === "agendarConsulta") {
      const { nome, dia, horario, tipoConsulta } = args || {};
      return NextResponse.json({
        status: "success",
        message: `Consulta de ${nome || "Paciente"} agendada com sucesso para ${dia || "esta semana"} às ${horario || "15:00"}.`,
        agendamento: {
          id: `b-${Date.now()}`,
          nome: nome || "Paciente",
          dia: dia || "Quinta-feira",
          horario: horario || "15:00",
          tipoConsulta: tipoConsulta || "Sessão de Acolhimento",
          status: "Confirmado via IA Live",
        },
      });
    }

    if (name === "explicarPlugin") {
      const { plugin } = args || {};
      return NextResponse.json({
        status: "success",
        message: `O plugin ${plugin || "selecionado"} automatiza a captação e atendimento de pacientes com máxima conformidade ética.`,
      });
    }

    return NextResponse.json({
      status: "success",
      message: `Ferramenta ${name} executada com sucesso.`,
      args,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Erro na execução da ferramenta",
      },
      { status: 500 }
    );
  }
}
