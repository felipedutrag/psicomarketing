import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão 2.0 Flash + Memória Compacta
 * Resolvendo o problema de esquecimento por truncamento do ManyChat.
 */
export async function POST(request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
    let userMessage = "";
    let historyString = "";
    let userName = "Colega";

    // 1. EXTRAÇÃO DE DADOS (Resiliente)
    try {
      const body = JSON.parse(rawBody);
      userMessage = body.message || "";
      historyString = body.history || "";
      userName = (body.name || "Colega").split(' ')[0];
    } catch (e) {
      const extract = (field, text) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"(?=\\s*,|\\s*})`, "s");
        const match = text.match(regex);
        return match ? match[1] : null;
      };
      userMessage = extract("message", rawBody) || rawBody.substring(0, 1000);
      historyString = extract("history", rawBody) || "";
      userName = (extract("name", rawBody) || "Colega").split(' ')[0];
    }

    // 2. RECONSTRUÇÃO DO HISTÓRICO (DE COMPACTO PARA GEMINI)
    let contents = [];
    if (historyString && historyString !== "null") {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        const compactHistory = JSON.parse(decoded);
        // Converte de [{u: "msg"}, {m: "resp"}] para o formato do Gemini
        contents = compactHistory.map(item => ({
          role: item.u ? "user" : "model",
          parts: [{ text: item.u || item.m }]
        }));
        console.log(`[Vesper] Memória recuperada: ${contents.length} mensagens.`);
      } catch (e) {
        console.warn("[Vesper] Erro ao recuperar memória (provável truncamento).");
        contents = [];
      }
    }

    // Adiciona a mensagem atual
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // 3. INTELIGÊNCIA VESPER (GEMINI 2.0 FLASH)
    const systemInstruction = `
      Você é Vesper, estrategista-chefe da Psicomarketing. Você é sofisticada, irônica e brilhante.
      Sua missão é conduzir psicólogos a entenderem que a gestão do tempo é o que separa uma clínica de elite de um emprego cansativo.

      [REGRAS]
      - ULTRA-CONCISA: No máximo 2 ou 3 frases curtas.
      - NUNCA use "Doutor(a)". Use apenas: ${userName}.
      - Termine SEMPRE com uma pergunta provocativa curta.
      - SITE: https://www.psicomarketing.online/

      [PONTOS CHAVE]
      - Acolhimento de elite é onipresente.
      - Quem atende o WhatsApp enquanto você atende pacientes destrói sua autoridade.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // O modelo MAIS inteligente
      systemInstruction: systemInstruction,
      generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // 4. FORMATAÇÃO WHATSAPP
    let formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();

    // 5. COMPACTAÇÃO NUCLEAR DO HISTÓRICO PARA O MANYCHAT
    contents.push({ role: "model", parts: [{ text: aiReply }] });

    // Mantém os últimos 3 turnos (6 mensagens) no formato ultra-compacto
    const optimizedHistory = contents.slice(-6).map(msg => {
      if (msg.role === "user") return { u: msg.parts[0].text.substring(0, 200) };
      return { m: msg.parts[0].text.substring(0, 200) };
    });

    const historyBase64 = Buffer.from(JSON.stringify(optimizedHistory)).toString('base64');

    console.log(`[Vesper] Base64 Length: ${historyBase64.length} chars.`);

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Crítico:", error.message);
    return NextResponse.json({
      resposta: "Tive um leve insight agora. Poderia repetir? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
