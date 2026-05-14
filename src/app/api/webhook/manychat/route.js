import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão Nuclear
 * Designado para ser imune a JSONs malformados e quebras de linha brutas do ManyChat.
 */
export async function POST(request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
    
    // LOG DE DIAGNÓSTICO (Para sabermos exatamente o que o ManyChat está aprontando)
    console.log(`[Vesper] RAW PAYLOAD: ${rawBody.substring(0, 300)}...`);

    let userMessage = "";
    let historyString = "";
    let userName = "Colega";

    // TENTATIVA 1: Parse Civilizado
    try {
      const body = JSON.parse(rawBody);
      userMessage = body.message || "";
      historyString = body.history || "";
      userName = (body.name || "Colega").split(' ')[0];
    } catch (e) {
      // TENTATIVA 2: Extração Nuclear via Regex (Ignora a sintaxe do JSON e busca o conteúdo)
      console.warn("[Vesper] JSON Inválido. Iniciando extração nuclear via Regex.");
      
      const extractField = (field, text) => {
        // Busca o campo, pula as aspas e captura tudo até a aspa final que precede um , ou }
        // O flag 's' permite que o '.' capture quebras de linha (o culpado do erro)
        const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"(?=\\s*,\\s*"|\\s*})`, "s");
        const match = text.match(regex);
        return match ? match[1] : null;
      };

      userMessage = extractField("message", rawBody) || "";
      historyString = extractField("history", rawBody) || "";
      const rawName = extractField("name", rawBody) || "Colega";
      userName = rawName.split(' ')[0];
      
      // Se a regex falhou em pegar a mensagem, tenta pegar tudo que estiver no campo message até o fim
      if (!userMessage) {
        userMessage = rawBody.match(/"message"\s*:\s*"(.*)"/s)?.[1] || "";
      }
    }

    if (!userMessage) {
      console.error("[Vesper] Falha total na captura da mensagem.");
      return NextResponse.json({ 
        resposta: "Minha conexão com seus pensamentos oscilou. Poderia repetir a última frase? 🌑",
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
      - TONALIDADE: Sofisticação. Emojis (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷).
    `;

    // 3. PROCESSAMENTO DE HISTÓRICO
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

    // 5. FORMATAÇÃO
    let formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();

    // 6. OTIMIZAÇÃO DO HISTÓRICO
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
