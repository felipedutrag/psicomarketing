import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    let body = {};

    try {
      // Tenta o parse civilizado primeiro
      body = JSON.parse(bodyText);
    } catch (e) {
      console.warn("[Vesper] JSON estilhaçado detectado. Iniciando extração cirúrgica de campos na força bruta.");
      
      const extractField = (key) => {
        const search = `"${key}":`;
        const idx = bodyText.indexOf(search);
        if (idx === -1) return null;
        const start = bodyText.indexOf('"', idx + search.length) + 1;
        
        // Marcadores de fim de campo que o ManyChat costuma usar
        const endMarkers = ['","name"', '", "name"', '","history"', '", "history"', '"}', '"}'];
        let end = -1;
        for (let marker of endMarkers) {
          let mIdx = bodyText.indexOf(marker, start);
          if (mIdx !== -1) {
            end = mIdx;
            break;
          }
        }
        if (end === -1) {
          // Se não achou marcador, procura a última aspa antes do bracelete de fechamento ou o fim
          const lastBrace = bodyText.lastIndexOf('}');
          end = bodyText.lastIndexOf('"', lastBrace !== -1 ? lastBrace : bodyText.length);
        }
        
        if (end <= start) return null;
        return bodyText.substring(start, end);
      };

      body = {
        message: extractField('message'),
        name: extractField('name'),
        history: extractField('history')
      };
    }

    const userMessage = body.message || bodyText;
    const historyString = body.history || "";
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

    // MOTOR PRINCIPAL: Gemini 2.5 SDK
    try {
      if (!geminiApiKey) throw new Error("Chave GEMINI_API_KEY não encontrada");

      const startTime = Date.now();

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        }
      });

      const response = await model.generateContent({ contents: contents });
      const endTime = Date.now();

      console.log(`[Vesper] Gemini 2.5 SDK Status: OK (${endTime - startTime}ms)`);

      if (response && response.response) {
        aiReply = response.response.text();
      } else {
        throw new Error("Resposta vazia da SDK do Gemini");
      }

    } catch (err) {
      console.error("[Vesper] Erro na IA (Gemini):", err.message);
      aiReply = `Eu estava refletindo sobre como o tempo é precioso, ${userName}. O que exatamente impede sua clínica de avançar agora? 🌑`;
    }

    // Limpeza e Formatação Extrema para WhatsApp/ManyChat
    contents.push({ role: "model", parts: [{ text: aiReply || "" }] });

    let formattedReply = (aiReply || "")
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Negrito WhatsApp
      .replace(/\[.*?\]\((https?:\/\/.*?)\)/g, '$1') // URL pura
      .replace(/\r?\n|\r/g, ' ') // Remove TODA quebra de linha (ManyChat safe)
      .replace(/\s{2,}/g, ' ') // Remove espaços duplos
      .trim();

    // TRUNCAMENTO DE SEGURANÇA: WhatsApp suporta 4096, ManyChat ~2000. Limite elevado para 1800.
    if (formattedReply.length > 1800) {
      formattedReply = formattedReply.substring(0, 1797) + "...";
    }

    // COMPRESSÃO BRUTAL DO HISTÓRICO: Evita o estouro do limite de Custom Fields no ManyChat
    // Mantemos as últimas 4 mensagens e esmagamos o texto para no máximo 250 caracteres por balão.
    const optimizedHistory = contents.slice(-4).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts && msg.parts[0] && msg.parts[0].text ? msg.parts[0].text.substring(0, 250) : "" }]
    }));
    const historyBase64 = Buffer.from(JSON.stringify(optimizedHistory)).toString('base64');

    console.log(`[Vesper] Resposta Sanitizada (Tamanho: ${formattedReply.length}): "${formattedReply.substring(0, 100)}..."`);

    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal no Webhook:", error);
    // IMPORTANTE: Retorna 200 com mensagem padrão para forçar o ManyChat a atualizar a variável.
    // Se retornar 500, o ManyChat ignora a resposta e repete a última mensagem salva no Custom Field.
    return NextResponse.json({
      resposta: "Estou processando muita informação ao mesmo tempo. Pode repetir de forma mais direta? 🌑",
      historico: ""
    }, { status: 200 });
  }
}
