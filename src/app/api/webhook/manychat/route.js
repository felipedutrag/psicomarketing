import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    let body;

    // Tenta parsear o JSON. Se falhar, usa Regex.
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      const extract = (field) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"`, "s");
        const match = rawBody.match(regex);
        return match ? match[1] : null;
      };
      body = {
        message: extract("message") || rawBody,
        name: extract("name") || "Colega",
        history: extract("history") || ""
      };
    }

    const userMessage = body.message || "";
    const historyString = body.history || "";
    const userName = (body.name || "Colega").split(' ')[0];

    // Reconstrução do histórico
    let contents = [];
    if (historyString && historyString !== "null") {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
      } catch (e) {
        console.warn("[Vesper] Erro ao decodificar histórico.");
        contents = [];
      }
    }

    // Adiciona a mensagem atual
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    const systemInstruction = `
      Você é Vesper, estrategista-chefe da Psicomarketing. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos focando em Soberania de Agenda e Acolhimento de Elite.

      [REGRAS]
      - Respostas curtas e impactantes (máximo 3 frases).
      - JAMAIS use "Doutor(a)". Use apenas: ${userName}.
      - Termine sempre com uma pergunta provocativa.
      - Site: https://www.psicomarketing.online/

      [PILARES]
      - O tempo é o ativo mais caro de um terapeuta.
      - A IA da Psicomarketing preserva sua autoridade enquanto você atende.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction,
      generationConfig: { 
        temperature: 0.7,
        maxOutputTokens: 500 // Aumentado para evitar cortes
      }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // Formatação para WhatsApp
    const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();

    // Salva o histórico (mantém os últimos 4 turnos para não estourar o limite do ManyChat)
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    const finalHistory = contents.slice(-8); // 4 turnos = 8 mensagens
    const historyBase64 = Buffer.from(JSON.stringify(finalHistory)).toString('base64');

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro:", error.message);
    return NextResponse.json({
      resposta: "Tive um leve insight agora. Poderia repetir? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
