import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { action } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY não configurada no ambiente.",
      }, { status: 500 });
    }

    if (action === "get-session-config") {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

      return NextResponse.json({
        success: true,
        wsUrl,
        model: "models/gemini-2.0-flash-exp",
        systemInstruction: `Você é a assistente de IA em tempo real do Psicomarketing. Você atende em nome do consultório de psicologia e explica nosso ecossistema de agentes e plugins de IA.
Sua missão é explicar os plugins (Google Ads, Meta Ads, Voz Nativa, Agendamento em Agenda, E-mail Marketing) e realizar o agendamento de consultas ativamente.
Quando o usuário demonstrar interesse em agendar, chame a função agendarConsulta com nome, dia e horário.`,
        tools: [
          {
            functionDeclarations: [
              {
                name: "agendarConsulta",
                description: "Realiza o agendamento automático da consulta do paciente na agenda do psicólogo.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    nome: { type: "STRING", description: "Nome do paciente ou cliente" },
                    dia: { type: "STRING", description: "Dia da semana ou data desejada (ex: Quinta-feira)" },
                    horario: { type: "STRING", description: "Horário da consulta (ex: 14:00)" },
                    tipoConsulta: { type: "STRING", description: "Tipo de sessão (ex: Primeira Consulta, Retorno, Acolhimento)" },
                  },
                  required: ["nome", "dia", "horario"],
                },
              },
              {
                name: "explicarPlugin",
                description: "Explica em detalhes os benefícios e funcionamento de um plugin do ecossistema.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    plugin: { type: "STRING", description: "Nome do plugin (Google Ads, Meta Ads, Voz Nativa, Agendamento, Email)" },
                  },
                  required: ["plugin"],
                },
              },
            ],
          },
        ],
      });
    }

    return NextResponse.json({ success: true, message: "Ação realizada" });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro no servidor de IA",
    }, { status: 500 });
  }
}
