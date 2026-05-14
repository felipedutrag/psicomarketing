import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão Estabilizada para ManyChat (Encode to JSON)
 */
export async function POST(request) {
  let rawBody = "";
  try {
    // 1. RECEBIMENTO DE DADOS
    rawBody = await request.text();
    console.log(`[Vesper] Requisicao recebida. Payload: ${rawBody.substring(0, 200)}...`);

    let userMessage = "";
    let historyString = "";
    let userName = "Colega";

    // TENTATIVA 1: Parse JSON Padrão (Ideal para "Encode to JSON" do ManyChat)
    try {
      const body = JSON.parse(rawBody);
      userMessage = body.message || "";
      historyString = body.history || "";
      userName = (body.name || "Colega").split(' ')[0];
      console.log("[Vesper] JSON parseado com sucesso.");
    } catch (parseError) {
      console.warn(`[Vesper] Falha no parse JSON: ${parseError.message}. Iniciando extração de emergência.`);
      
      // TENTATIVA 2: Extração Nuclear (Regex) - Caso o ManyChat ainda envie algo quebrado
      const extract = (field, text) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"(.*?)"(?=\\s*,|\\s*})`, "s");
        const match = text.match(regex);
        return match ? match[1] : null;
      };

      userMessage = extract("message", rawBody);
      historyString = extract("history", rawBody) || "";
      const rawName = extract("name", rawBody) || "Colega";
      userName = rawName.split(' ')[0];
      
      // Fallback final: se não achou mensagem via Regex, usa o corpo bruto
      if (!userMessage) userMessage = rawBody.substring(0, 1000);
    }

    if (!userMessage || userMessage.length < 2) {
      return NextResponse.json({ 
        resposta: "O silêncio é uma resposta profunda, mas para eu te ajudar, preciso de palavras. 🌑",
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
        console.error("[Vesper] Erro ao decodificar histórico:", e.message);
        contents = [];
      }
    }

    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // 4. MOTOR IA (GEMINI 3.1 FLASH LITE PREVIEW)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY ausente.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemInstruction,
      generationConfig: { temperature: 0.7, maxOutputTokens: 450 }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // 5. SANITIZAÇÃO E FORMATAÇÃO
    let formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();

    // 6. OTIMIZAÇÃO DO HISTÓRICO
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    const optimizedHistory = contents.slice(-6).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text.substring(0, 300) }]
    }));
    
    const historyBase64 = Buffer.from(JSON.stringify(optimizedHistory)).toString('base64');

    console.log(`[Vesper] Sucesso. Resposta enviada para ${userName}.`);

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal no Webhook:", error.message);
    return NextResponse.json({
      resposta: "Tive um leve insight agora que me distraiu do nosso assunto. Poderia repetir? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
