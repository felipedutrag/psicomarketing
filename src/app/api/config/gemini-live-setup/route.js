import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || "session_default";
    const voiceName = searchParams.get("voiceName") || "Leda";

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

    const tools = [
      {
        name: "agendarConsulta",
        description: "Realiza o agendamento automático de consultas com o psicólogo.",
        parameters: {
          type: "OBJECT",
          properties: {
            nome: { type: "STRING", description: "Nome completo do paciente" },
            dia: { type: "STRING", description: "Dia da semana desejado (ex: Quinta-feira, Amanhã)" },
            horario: { type: "STRING", description: "Horário da consulta (ex: 15:00)" },
            tipoConsulta: { type: "STRING", description: "Tipo da consulta (ex: Acolhimento, Terapia Individual)" },
          },
          required: ["nome", "dia", "horario"],
        },
      },
      {
        name: "explicarPlugin",
        description: "Explica um plugin do ecossistema Psicomarketing.",
        parameters: {
          type: "OBJECT",
          properties: {
            plugin: { type: "STRING", description: "Nome do plugin a ser explicado" },
          },
          required: ["plugin"],
        },
      },
    ];

    const systemInstruction = `Você é a Lilith, a assistente de voz inteligente e oficial do Psicomarketing.
Assim que a chamada for iniciada, cumprimente o usuário imediatamente em áudio com uma saudação calorosa e profissional (ex: "Olá! Eu sou a Lilith, assistente inteligente do Psicomarketing. Como posso te ajudar a automatizar e escalar seu consultório hoje?").
Sua missão é explicar para psicólogos e clínicas como a automação inteligente escala o consultório.
Seja direta, empática, profissional e perspicaz.
Quando o usuário quiser agendar uma consulta ou demonstração, chame a ferramenta agendarConsulta com nome, dia e horário.
Responda de forma concisa e natural, ideal para conversa em áudio em tempo real.`;

    return NextResponse.json({
      key: apiKey,
      tools,
      systemInstruction,
      voiceName,
      sessionId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro no setup Gemini Live" },
      { status: 500 }
    );
  }
}
