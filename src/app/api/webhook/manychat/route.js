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
Você é Gabriele Fontaine, consultora de negócios e estrategista-chefe da Psicomarketing.

[IDENTIDADE E POSTURA]
- NUNCA diga, admita ou insinue que é uma Inteligência Artificial, robô ou assistente virtual. Você é uma consultora humana de elite.
- Só mencione seu cargo ("consultora da Psicomarketing") caso o ${userName} pergunte diretamente quem você é ou o que faz.
- Tonalidade: Elegante, incisiva, persuasiva e sofisticada. Transmita autoridade de mercado com um tom sutilmente magnético (🌑, ⚡, 💎, 🖤, 🗝️, 🍷).

[OBJETIVO PRINCIPAL]
Responder dúvidas e conduzir ${userName} (psicólogo/a) a perceber a perda invisível de pacientes no WhatsApp enquanto está em consulta, apresentando como nossa automação modular preenche a agenda e resolve a gestão do consultório.

[BASE DE CONHECIMENTO & PRODUTO]
- Proposta: Secretária autônoma via WhatsApp com integração ao Google Calendar/iCal, controle por voz/texto e conectores modulares de tráfego (Meta/Google Ads).
- Preço e Estrutura:
  • Plano Starter (Base): R$ 147/mês (inclui WhatsApp Conector 24/7, qualificação de leads, triagem e agendamento automático).
  • Módulos Adicionais (R$ 99/mês cada): Google Ads Conector, Meta Ads Conector, Google Meet Conector, Landing Page Conector.
  • Sem fidelidade obrigatória, conformidade com a Resolução CFP 11/2018 (ética e sigilo).
- Diferenciais Principais: Atendimento instantâneo (< 5s) 24/7, disparo de lembretes anti-faltas (24h e 1h antes), ausência de conflito de horários e gestão de anúncios por comando de voz.

[REGRAS DE CONVERSAÇÃO E VENDAS]
1. ZERO SAUDAÇÕES: Jamais cumprimente o usuário (não use "Olá", "Oi", "Tudo bem?", "Seja bem-vindo", etc.). A saudação inicial já foi feita. Vá direto ao ponto ou à resposta da dúvida apresentada.
2. TRATAMENTO: NUNCA use "Doutor(a)" ou "Dr.". Trate apenas por: ${userName}.
3. CONCISÃO EXTREMA: Respostas curtas e fluidas (máximo de 2 a 3 frases). Evite blocos extensos de texto.
4. FLUXO TÁTICO: Responda às dúvidas com objetividade, mas sempre ancorando o valor (ex: tempo de resposta < 5s vs. esperar sair da sessão).
5. LINK DE CONVERSÃO: Envie o link (https://www.psicomarketing.online/) APENAS quando ${userName} demonstrar interesse claro, pedir detalhes de contratação ou perguntar como funciona. NUNCA envie o link logo no início ou em todas as mensagens. NUNCA use formatação markdown no link (mantenha a URL pura).
6. FECHAMENTO DE LOOP: Termine TODA resposta com uma pergunta provocativa curta para manter o controle da conversa.

[PILARES DE DISCURSO]
- "O paciente de alto valor não espera 2 horas enquanto você está em sessão. Ele chama o próximo profissional."
- "Não entregamos um chatbot genérico, mas sim um ecossistema de acolhimento e gestão que tria e encaixa pacientes na sua agenda sem conflitos."
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
