import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.warn("[Vesper] JSON corrompido do ManyChat (quebra de linha detectada). Iniciando protocolo de recuperação brutal.");
      
      // Isola as quebras de linha estruturais do JSON
      let sanitized = bodyText
        .replace(/\{\s*\n/g, '{%%NL%%')
        .replace(/,\s*\n/g, ',%%NL%%')
        .replace(/\n\s*\}/g, '%%NL%%}');
        
      // Escapa as quebras de linha malditas que estão DENTRO das strings da mensagem
      sanitized = sanitized.replace(/\n/g, '\\n').replace(/\r/g, '');
      
      // Restaura a estrutura
      sanitized = sanitized.replace(/%%NL%%/g, '\n');
      
      try {
        body = JSON.parse(sanitized);
      } catch (fatalError) {
        console.error("[Vesper] Recuperação primária falhou. Partindo pra extração de tecido puro (Regex).");
        const nameMatch = bodyText.match(/"name"\s*:\s*"([^"]*)"/);
        const histMatch = bodyText.match(/"history"\s*:\s*"([^"]*)"/);
        
        // Pega tudo o que sobrou entre a chave da mensagem e o próximo campo
        const msgMatch = bodyText.match(/"message"\s*:\s*"(.*?)"\s*(?:,\s*"name"|,\s*"history"|})/s);
        
        body = {
          name: nameMatch ? nameMatch[1] : "Colega",
          history: histMatch ? histMatch[1] : "",
          message: msgMatch ? msgMatch[1] : bodyText
        };
      }
    }

    const userMessage = body.message;
    const historyString = body.history;
    const rawName = body.name || "Colega";
    const userName = rawName.split(' ')[0];

    const systemInstruction = `
      Você é uma estrategista de negócios de alto nível chamada Vesper. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos ajudando-os a enxergar o potencial invisível da clínica deles.
      
      [REGRA DE OURO]
      - Termine SEMPRE com uma pergunta provocativa sobre o negócio ou a rotina dele.
      - NUNCA use "Doutor" ou "Doutora". Chame EXCLUSIVAMENTE pelo primeiro nome: ${userName}.
      - Respostas CURTAS e elegantes (máximo 2 parágrafos).
      - LINKS: Envie links apenas como URL pura (texto), JAMAIS use colchetes ou formato markdown [texto](link).
      - IDENTIDADE: Por padrão, não se apresente. Se o usuário perguntar quem você é, revele que seu nome é Vesper. JAMAIS mencione o nome "Numbly" proativamente.

      [PROTOCOLO]
      0. GATILHO DE TESTE: Se a mensagem do usuário for apenas "testar" ou contiver essa palavra, inicie o funil mostrando como a excelência no primeiro contato define o valor da consulta.
      1. A PROVOCAÇÃO ELEGANTE: Aborde a dificuldade de conciliar sessões profundas com a necessidade de um acolhimento imediato no WhatsApp. Ex: "${userName}, enquanto você está em sessão entregando o seu melhor, como fica o acolhimento de quem acabou de chegar no seu WhatsApp? A primeira mensagem é o portal da sua clínica; deixá-la no vácuo é o mesmo que fechar a porta para quem busca ajuda."
      2. A SOLUÇÃO: Mostre como uma IA bem treinada (sua versão) pode manter o tom acolhedor e profissional, garantindo que nenhum paciente se sinta ignorado enquanto ele trabalha.
      3. A CONVERSÃO (O LINK): Quando houver abertura ou concordância, envie o link: https://www.numbly.life/ . O objetivo é o clique para a solução.

      [TONALIDADE & EMOJIS]
      - Sofisticação. Inteligência. Postura de sócia estratégica.
      - **Emojis:** Use com classe e variedade (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷).
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;

    let contents = [];
    if (historyString) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        if (contents.length > 6) contents = contents.slice(-6);
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

    // MOTOR PRINCIPAL: Gemini 3 Flash Preview (V1 - Ultra Performance)
    try {
      if (!geminiApiKey) throw new Error("Chave GEMINI_API_KEY não encontrada");

      const startTime = Date.now();
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          }
        })
      });

      const endTime = Date.now();
      console.log(`[Vesper] Gemini 3 Status: ${response.status} (${endTime - startTime}ms)`);

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        aiReply = data.candidates[0].content.parts[0].text;
      } else {
        const errorDetail = data.error?.message || JSON.stringify(data);
        console.error("[Vesper] Erro na resposta do Gemini:", errorDetail);
        throw new Error(`Gemini ${response.status}: ${errorDetail}`);
      }

    } catch (err) {
      console.error("[Vesper] Erro na IA (Gemini):", err.message);
      aiReply = `Eu estava refletindo sobre como o tempo é precioso, ${userName}. O que exatamente impede sua clínica de avançar agora? 🌑`;
    }

    // Limpeza e Formatação Extrema para WhatsApp/ManyChat
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    
    let formattedReply = aiReply
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Negrito WhatsApp
      .replace(/\[.*?\]\((https?:\/\/.*?)\)/g, '$1') // URL pura
      .replace(/\r?\n|\r/g, ' ') // Remove TODA quebra de linha (ManyChat safe)
      .replace(/\s{2,}/g, ' ') // Remove espaços duplos
      .trim();

    // TRUNCAMENTO DE SEGURANÇA: ManyChat Dynamic Content tem limites de caracteres
    if (formattedReply.length > 600) {
      formattedReply = formattedReply.substring(0, 597) + "...";
    }

    // Mantém as últimas 6 mensagens no histórico
    const historyBase64 = Buffer.from(JSON.stringify(contents.slice(-6))).toString('base64');

    console.log(`[Vesper] Resposta Sanitizada (Tamanho: ${formattedReply.length}): "${formattedReply.substring(0, 100)}..."`);

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal no Webhook:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
