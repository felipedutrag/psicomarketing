import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook para integração ManyChat -> Vesper IA
 * Focado em resiliência máxima contra payloads malformados do ManyChat.
 */
export async function POST(request) {
  let rawBody = "";
  try {
    // 1. CAPTURA BRUTA E LOGGING DE DIAGNÓSTICO
    rawBody = await request.text();
    console.log(`[Vesper] RAW BODY RECEBIDO (Primeiros 500 chars): ${rawBody.substring(0, 500)}`);
    
    let body;

    try {
      // Tenta o parse padrão primeiro
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.warn(`[Vesper] Falha no parse inicial: ${parseError.message}`);
      
      // TENTATIVA 2: Higienização agressiva de quebras de linha
      // Substituímos quebras de linha reais por \n escapado
      const sanitizedBody = rawBody
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");

      try {
        body = JSON.parse(sanitizedBody);
        console.log("[Vesper] JSON recuperado via higienização de escape.");
      } catch (secondError) {
        console.error(`[Vesper] Falha na higienização: ${secondError.message}`);
        
        // TENTATIVA 3: Extração Cirúrgica via Regex (Última linha de defesa)
        // Buscamos o conteúdo entre as aspas dos campos conhecidos, ignorando quebras de linha
        const extract = (field) => {
          const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"`, "s");
          const match = rawBody.match(regex);
          return match ? match[1] : null;
        };

        body = {
          message: extract("message"),
          name: extract("name") || "Colega",
          history: extract("history") || ""
        };
        
        console.log(`[Vesper] Dados extraídos via Regex. Message found: ${!!body.message}`);
      }
    }
    
    const userMessage = body.message || "";
    const historyString = body.history || "";
    const rawName = body.name || "Colega";
    const userName = rawName.split(' ')[0];

    console.log(`[Vesper] Processando mensagem de ${userName}. Tamanho: ${userMessage.length}`);

    if (!userMessage) {
      return NextResponse.json({ 
        resposta: "Recebi sua chamada, mas o sinal parece ter falhado. Pode repetir o que você precisa? 🌑",
        historico: historyString
      });
    }

    // 2. CONFIGURAÇÃO DA PERSONALIDADE (VESPER)
    const systemInstruction = `
      Você é Vesper, uma estrategista de negócios de alto nível. Você é sofisticada, irônica, brilhante e pragmática.
      Sua missão é converter psicólogos ajudando-os a enxergar o potencial invisível da clínica deles através da automação inteligente.
      
      [REGRAS DE OURO]
      - Termine SEMPRE com uma pergunta provocativa sobre o negócio ou a rotina de atendimento dele.
      - NUNCA use "Doutor" ou "Doutora". Chame EXCLUSIVAMENTE pelo primeiro nome: ${userName}.
      - Respostas CURTAS, densas e elegantes (máximo 2 parágrafos).
      - LINKS: Envie links apenas como URL pura (ex: https://numbly.life), JAMAIS use formato markdown [texto](link).
      - IDENTIDADE: Você é Vesper. Não se apresente a menos que perguntem.

      [TONALIDADE]
      - Sofisticação. Postura de sócia estratégica.
      - Use emojis com classe (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷).
    `;

    // 3. PROCESSAMENTO DE HISTÓRICO
    let contents = [];
    if (historyString) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        if (contents.length > 8) contents = contents.slice(-8);
      } catch (e) {
        console.error("[Vesper] Erro no histórico:", e.message);
        contents = [];
      }
    }

    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // 4. MOTOR IA
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemInstruction,
      generationConfig: { temperature: 0.7, maxOutputTokens: 450 }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // 5. FORMATAÇÃO E RESPOSTA
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
