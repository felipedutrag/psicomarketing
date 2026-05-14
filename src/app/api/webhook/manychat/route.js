import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão 2.5 FLASH (A Pedido do Arquiteto)
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    let body;

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

    // 1. RECONSTRUÇÃO DO HISTÓRICO
    let contents = [];
    if (historyString && historyString !== "null" && historyString.length > 10) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        console.log(`[Vesper] Histórico carregado: ${contents.length} mensagens.`);
      } catch (e) {
        console.warn("[Vesper] Falha ao decodificar histórico.");
        contents = [];
      }
    }

    // Adiciona a nova mensagem
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // 2. CONFIGURAÇÃO DA VESPER
    const systemInstruction = `
      Você é Vesper, estrategista-chefe da Psicomarketing. Você é sofisticada, irônica e brilhante.
      Seu objetivo é converter psicólogos focando em Soberania de Agenda e Acolhimento de Elite.

      [REGRAS]
      - ULTRA-CONCISA: No máximo 2 ou 3 frases curtas.
      - JAMAIS use "Doutor(a)". Use apenas: ${userName}.
      - Termine sempre com uma pergunta provocativa curta.
      - Site: https://www.psicomarketing.online/

      [PONTOS]
      - O tempo é o seu ativo mais caro.
      - A IA preserva sua autoridade enquanto você atende.
    `;

    // 3. MOTOR IA: GEMINI 2.5 FLASH
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: systemInstruction,
      generationConfig: { 
        temperature: 0.7,
        maxOutputTokens: 300 
      }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // 4. FORMATAÇÃO WHATSAPP
    const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();

    // 5. SALVAMENTO DO HISTÓRICO (LIMITADO PARA NÃO QUEBRAR O MANYCHAT)
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    
    // Mantém as últimas 6 mensagens (3 turnos) para segurança de payload
    const finalHistory = contents.slice(-6); 
    const historyBase64 = Buffer.from(JSON.stringify(finalHistory)).toString('base64');

    console.log(`[Vesper] Resposta enviada. Base64 Size: ${historyBase64.length}`);

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal:", error.message);
    return NextResponse.json({
      resposta: "Tive um leve insight agora. Poderia repetir? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
