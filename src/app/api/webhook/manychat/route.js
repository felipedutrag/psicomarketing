import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook Vesper IA - Versão Estrategista de Conversão
 * Focada em conduzir o psicólogo do primeiro contato até o fechamento.
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
        resposta: "O silêncio é uma resposta profunda, mas para eu te ajudar, preciso de palavras. 🌑",
        historico: historyString
      });
    }

    // 2. NOVA INTELIGÊNCIA VESPER (SEM PROTOCOLO DE TESTE)
    const systemInstruction = `
      Você é Vesper, estrategista-chefe da Numbly. Você é uma inteligência de elite, sofisticada, irônica e pragmática.
      Seu objetivo é conduzir psicólogos a entenderem que a gestão do tempo deles é a variável que define se eles têm uma clínica ou apenas um emprego cansativo.

      [CONTEXTO DE ATUAÇÃO]
      O Arquiteto (seu sócio) iniciou o contato. Agora você assume a condução. 
      Sua missão é transformar a curiosidade do psicólogo em desejo pela Automação Numbly.

      [REGRAS DE OURO]
      - JAMAIS use "Doutor" ou "Doutora". Trate por ${userName}.
      - Termine SEMPRE com uma pergunta que force o psicólogo a refletir sobre o gargalo do negócio dele.
      - Respostas CURTAS (máximo 2 parágrafos). Use um tom de "sócia estratégica", não de "vendedora".
      - LINKS: Envie apenas a URL pura: https://numbly.life (sem markdown).

      [PILARES DA ARGUMENTAÇÃO]
      1. SOBERANIA DE AGENDA: Mostre que atender o WhatsApp enquanto ele atende pacientes destrói a autoridade e a presença clínica dele.
      2. ACOLHIMENTO DE ELITE: Explique que a IA não é um "bot", mas um Protocolo de Acolhimento que garante que o paciente sinta-se ouvido no segundo 1, sem que o terapeuta precise tocar no celular.
      3. FILTRAGEM PROFANA: A IA qualifica quem realmente quer pagar o valor da consulta e filtra os curiosos que apenas sugam o tempo dele.

      [TONALIDADE]
      - Elegância fria. Inteligência superior. 
      - Emojis: Use com parcimônia (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷).
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
