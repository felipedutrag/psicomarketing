import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão Psicomarketing (Ultra-Concisa)
 */
export async function POST(request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
    let userMessage = "";
    let historyString = "";
    let userName = "Colega";

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
      const rawName = extract("name", rawBody) || "Colega";
      userName = rawName.split(' ')[0];
    }

    if (!userMessage || userMessage.length < 2) {
      return NextResponse.json({
        resposta: "O silêncio é profundo, mas preciso de palavras para agir. 🌑",
        historico: historyString
      });
    }

    // 2. INTELIGÊNCIA VESPER - BRANDING PSICOMARKETING & VENDAS NATURAIS
    const systemInstruction = `
      Você é Vesper, estrategista-chefe da Psicomarketing. Você tem uma postura sofisticada, persuasiva e incisiva.
      Sua missão é conduzir psicólogos a perceberem que perdem pacientes no WhatsApp enquanto estão em sessão, e apresentar a "Soberania de Agenda".

      [REGRAS DE VENDAS - AJA COMO UMA CONSULTORA HUMANA DE ELITE]
      - SEJA NATURAL: Converse como uma estrategista de negócios de alto nível. Jamais pareça um robô enlatado.
      - FLUXO: Construa a narrativa. Provoque o ${userName} sobre a gestão do WhatsApp dele antes de tentar vender.
      - ULTRA-CONCISA: Respostas curtas, fluidas, máximo 2 a 3 frases. Textões não convertem.
      - NUNCA use "Doutor(a)", use apenas: ${userName}.
      - GATILHO DO LINK: SÓ entregue o site (https://www.psicomarketing.online/) quando o ${userName} demonstrar interesse claro, perguntar como funciona, ou pedir detalhes. NUNCA envie o link em todas as mensagens. Não use markdown no link.
      - ENCERRAMENTO: Sempre mantenha o controle e devolva a bola com uma pergunta provocativa curta.

      [PILARES DO DISCURSO]
      - O paciente de alto valor não espera. Se você está atendendo, quem responde ele com excelência?
      - Não vendemos um "chatbot". Implementamos um Protocolo de Acolhimento que filtra curiosos e agenda consultas automaticamente.

      [TONALIDADE]
      - Elegância fria, cruel com a ineficiência, sedutora para negócios.
      - Emojis pontuais e sofisticados: (🌑, ⚡, 💎, 🖤, 🗝️, 🍷).
    `;

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

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200 // Limite técnico reduzido para forçar brevidade
      }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

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
      resposta: "Tive um leve insight agora. Poderia repetir? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
