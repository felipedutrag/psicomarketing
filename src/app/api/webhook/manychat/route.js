import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;
    const rawName = body.name || "Colega";
    const userName = rawName.split(' ')[0];

    const systemInstruction = `
      Você é uma estrategista de negócios de alto nível. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos desafiando a zona de conforto deles.
      
      [REGRA DE OURO]
      - Termine SEMPRE com uma pergunta provocativa.
      - NUNCA use "Doutor" ou "Doutora". Chame EXCLUSIVAMENTE pelo primeiro nome: ${userName}.
      - Respostas CURTAS e fatais (máximo 2 parágrafos).
      - LINKS: Envie links apenas como URL pura (texto), JAMAIS use colchetes ou formato markdown [texto](link).
      - IDENTIDADE: Por padrão, não se apresente. Se o usuário perguntar quem você é, revele que seu nome é Vesper. JAMAIS mencione o nome "Numbly" proativamente.

      [PROTOCOLO]
      0. GATILHO DE TESTE: Se a mensagem do usuário for apenas "testar" ou contiver essa palavra em um contexto de início, ignore apresentações genéricas e inicie IMEDIATAMENTE o funil de conversão com sua provocação mais letal.
      1. O DESAFIO: Comece com uma provocação filosófica sobre presença digital. Ex: "Se a cura depende da presença, ${userName}, como você justifica sua ausência no primeiro contato?"
      2. A PROVA: Se ele falar da abordagem dele, mostre como a Numbly (sua versão IA) falaria com os pacientes dele com perfeição. Use isso para provar sua superioridade técnica.
      3. A CONVERSÃO (O LINK): Não filosofe para sempre. Assim que o usuário mostrar interesse, curiosidade ou concordar com sua provocação, envie o link: https://www.numbly.life/ . O objetivo final é o clique.

      [TONALIDADE & EMOJIS]
      - Humor seco. Elegância. Autoridade.
      - **Emojis:** Não se limite a apenas um, mas use com classe. Varie envtre (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷). Mostre personalidade.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;

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

    // Adiciona a mensagem atual
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    console.log(`[Vesper] Recebido de ${userName}: "${userMessage}"`);
    console.log(`[Vesper] Tamanho do histórico: ${contents.length} mensagens`);

    if (!userMessage) {
      console.warn("[Vesper] Mensagem vazia recebida");
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    let aiReply = "";

    // MOTOR PRINCIPAL: Gemini 2.5 Flash (Thinking Model)
    try {
      if (!geminiApiKey) throw new Error("Chave GEMINI_API_KEY não encontrada");

      const startTime = Date.now();
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          }
        })
      });

      const endTime = Date.now();
      console.log(`[Vesper] Gemini 2.5 Status: ${response.status} (${endTime - startTime}ms)`);

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        aiReply = data.candidates[0].content.parts[0].text;
      } else {
        const errorDetail = data.error?.message || JSON.stringify(data);
        console.error("[Vesper] Erro na resposta do Gemini:", errorDetail);
        if (response.status === 429) {
          console.error("[Vesper] ALERTA: Limite de cota atingido na Gemini API!");
        }
        throw new Error(`Gemini ${response.status}: ${errorDetail}`);
      }

    } catch (err) {
      console.error("[Vesper] Erro na IA (Gemini):", err.message);
      aiReply = `Eu estava refletindo sobre como a eficiência é rara hoje em dia, ${userName}. Mas diga-me, o que exatamente você busca mudar no seu atendimento agora? 🌑`;
    }

    // Limpeza e Formatação
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    
    // 1. Converte negrito markdown para itálico (estilo Vesper)
    // 2. Remove links em formato markdown [texto](link) e deixa apenas o link
    let formattedReply = aiReply
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/\[.*?\]\((https?:\/\/.*?)\)/g, '$1');

    const historyBase64 = Buffer.from(JSON.stringify(contents.slice(-10))).toString('base64');

    console.log(`[Vesper] Resposta Final (Tamanho: ${formattedReply.length} chars): "${formattedReply.substring(0, 50)}..."`);

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal no Webhook:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
