import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão "Invisível"
 * Projetada para aceitar payloads de texto bruto (text/plain) e burlar validadores de JSON.
 */
export async function POST(request) {
  let rawBody = "";
  try {
    // 1. CAPTURA TOTAL
    // Lemos como texto para evitar que o Next.js tente validar o JSON antes da hora
    rawBody = await request.text();
    
    // Log IMEDIATO para garantir que a requisição chegou
    console.log(`[Vesper] Requisicao recebida. Tamanho bruto: ${rawBody.length} bytes.`);

    let userMessage = "";
    let historyString = "";
    let userName = "Colega";

    // EXTRAÇÃO CIRÚRGICA (Regex)
    // Buscamos os valores mesmo que o JSON esteja sem aspas, com quebras de linha ou caracteres ilegais.
    const extract = (field, text) => {
      // Procura pelo nome do campo e pega tudo entre as próximas aspas, permitindo quebras de linha (. com flag s)
      const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"(?=\\s*,\\s*"|\\s*})`, "s");
      const match = text.match(regex);
      return match ? match[1] : null;
    };

    userMessage = extract("message", rawBody);
    historyString = extract("history", rawBody) || "";
    const rawName = extract("name", rawBody) || "Colega";
    userName = rawName.split(' ')[0];

    // Se a Regex falhar (ex: ManyChat enviou sem aspas em algum campo), tenta o parse tradicional como backup
    if (!userMessage) {
      try {
        const body = JSON.parse(rawBody);
        userMessage = body.message;
        historyString = body.history || "";
        userName = (body.name || "Colega").split(' ')[0];
      } catch (e) {
        // Se tudo falhar, assume que o corpo todo é a mensagem (fallback extremo)
        userMessage = userMessage || rawBody.substring(0, 1000);
      }
    }

    console.log(`[Vesper] Dados extraídos. Nome: ${userName}, Msg: ${userMessage.substring(0, 50)}...`);

    if (!userMessage || userMessage.length < 2) {
      return NextResponse.json({ 
        resposta: "O silêncio é uma resposta profunda, mas para eu te ajudar, preciso de palavras. 🌑",
        historico: historyString
      });
    }

    // 2. CONFIGURAÇÃO IA (VESPER)
    const systemInstruction = `
      Você é Vesper, uma estrategista de negócios de alto nível. Você é sofisticada, irônica, brilhante e pragmática.
      Sua missão é converter psicólogos ajudando-os a enxergar o potencial invisível da clínica deles através da automação inteligente.
      
      [REGRAS DE OURO]
      - Termine SEMPRE com uma pergunta provocativa sobre o negócio ou a rotina de atendimento dele.
      - NUNCA use "Doutor" ou "Doutora". Chame EXCLUSIVAMENTE pelo primeiro nome: ${userName}.
      - Respostas CURTAS, densas e elegantes.
      - LINKS: Envie links apenas como URL pura (ex: https://numbly.life).
      - TONALIDADE: Sofisticação. Emojis (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷).
    `;

    // 3. MOTOR IA
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemInstruction,
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    });

    let contents = [];
    if (historyString) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        if (contents.length > 8) contents = contents.slice(-8);
      } catch (e) {
        contents = [];
      }
    }
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // 4. FORMATAÇÃO E HISTÓRICO
    let formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    const optimizedHistory = contents.slice(-6).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text.substring(0, 300) }]
    }));
    const historyBase64 = Buffer.from(JSON.stringify(optimizedHistory)).toString('base64');

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Crítico:", error.message);
    return NextResponse.json({
      resposta: "Tive um leve insight agora que me distraiu do nosso assunto. Poderia repetir? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
