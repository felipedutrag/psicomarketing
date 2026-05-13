import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Webhook para integração ManyChat -> Vesper IA
 * Focado em JSON puro (sem form-data) para máxima estabilidade.
 */
export async function POST(request) {
  try {
    // 1. RECEBIMENTO DE DADOS (JSON PURO)
    const body = await request.json();
    
    const userMessage = body.message || "";
    const historyString = body.history || "";
    const rawName = body.name || "Colega";
    const userName = rawName.split(' ')[0];

    if (!userMessage) {
      console.warn("[Vesper] Mensagem vazia recebida do ManyChat.");
      return NextResponse.json({ 
        resposta: "Eu adoraria ouvir o que você tem a dizer, mas o silêncio não constrói clínicas de sucesso. O que houve? 🌑",
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

      [PROTOCOLO ESTRATÉGICO]
      - Foque na dor da 'Escravidão da Agenda': Enquanto o psicólogo atende, quem acolhe o novo paciente? 
      - Mostre que o 'vácuo' no primeiro contato é a maior causa de perda de faturamento em clínicas de SP.
      - Posicione a IA não como um robô, mas como uma extensão da excelência dele(a).

      [TONALIDADE]
      - Sofisticação. Postura de sócia estratégica.
      - Use emojis com classe (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷).
    `;

    // 3. PROCESSAMENTO DE HISTÓRICO (BASE64)
    let contents = [];
    if (historyString) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        // Limita a memória recente para não estourar o contexto ou o ManyChat
        if (contents.length > 8) contents = contents.slice(-8);
      } catch (e) {
        console.error("[Vesper] Erro ao decodificar histórico:", e.message);
        contents = [];
      }
    }

    // Adiciona a nova mensagem do usuário
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // 4. MOTOR IA (GEMINI 3.1 FLASH LITE PREVIEW)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurada no ambiente.");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 450,
      }
    });

    const result = await model.generateContent({ contents });
    const aiReply = result.response.text();

    // 5. SANITIZAÇÃO E FORMATAÇÃO (WHATSAPP SAFE)
    // Converte negritos markdown para negritos WhatsApp
    let formattedReply = aiReply
      .replace(/\*\*(.*?)\*\*/g, '*$1*') 
      .trim();

    // 6. OTIMIZAÇÃO DO HISTÓRICO PARA O MANYCHAT (LIMITE DE 2KB)
    // Adiciona a resposta da IA ao histórico
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    
    // Mantém apenas os últimos 4 turnos (8 mensagens) e encurta textos longos
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
    console.error("[Vesper] Erro Crítico no Webhook:", error.message);
    
    // Fallback elegante para não quebrar o fluxo do usuário no WhatsApp
    return NextResponse.json({
      resposta: "Tive um leve insight agora que me distraiu do nosso assunto. Poderia repetir o que você disse? 🌑",
      historico: ""
    }, { status: 200 }); // Retornamos 200 para o ManyChat não dar erro de requisição
  }
}
