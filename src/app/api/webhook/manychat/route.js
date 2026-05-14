import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão Híbrida (JSON + Form-Encoded)
 * Criada para ser resiliente a mensagens gigantes e quebras de linha.
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let userMessage = "";
    let historyString = "";
    let userName = "Colega";

    // 1. PARSE INTELIGENTE BASEADO NO CONTENT-TYPE
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Caso o ManyChat envie como Formulário (Mais estável para textos longos)
      const formData = await request.formData();
      userMessage = formData.get('message') || "";
      historyString = formData.get('history') || "";
      userName = (formData.get('name') || "Colega").split(' ')[0];
      console.log("[Vesper] Dados recebidos via Form-Encoded.");
    } else {
      // Caso o ManyChat envie como JSON (ou texto que parece JSON)
      const rawBody = await request.text();
      try {
        const body = JSON.parse(rawBody);
        userMessage = body.message || "";
        historyString = body.history || "";
        userName = (body.name || "Colega").split(' ')[0];
        console.log("[Vesper] Dados recebidos via JSON.");
      } catch (e) {
        // Fallback Nuclear: Regex se o JSON vier quebrado pelo ManyChat
        console.warn("[Vesper] JSON malformado. Usando extração via Regex.");
        const extract = (field, text) => {
          const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"(?=\\s*,|\\s*})`, "s");
          const match = text.match(regex);
          return match ? match[1] : null;
        };
        userMessage = extract("message", rawBody) || rawBody.substring(0, 1000);
        historyString = extract("history", rawBody) || "";
        const rawName = extract("name", rawBody) || "Colega";
        userName = rawName.split(' ')[0];
      }
    }

    console.log(`[Vesper] Payload capturado. Origem: ${userName}. Tamanho: ${userMessage.length}`);

    if (!userMessage || userMessage.length < 2) {
      return NextResponse.json({ 
        resposta: "Estou pronta para ouvir, mas suas palavras não chegaram até aqui. O que você gostaria de dizer? 🌑",
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
      - Respostas CURTAS e elegantes.
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
