const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/psicologos_leads.json');

try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const leads = JSON.parse(rawData);

    const cleanLeads = leads.map(l => {
        let name = l.nome || l.name;
        
        // Remoção radical de títulos (remove qualquer palavra que comece com esses prefixos)
        name = name
            .replace(/\bPsic[^\s]*\b/gi, '')
            .replace(/\bNeuro[^\s]*\b/gi, '')
            .replace(/\bPsican[^\s]*\b/gi, '')
            .replace(/\bDra?\.?\b/gi, '')
            .replace(/em\sSantos.*/gi, '')
            .replace(/atendimento\ssomente\sparticular/gi, '')
            .replace(/Clinica/gi, '')
            .replace(/[\(\)\|].*/, '')
            .replace(/-.*/, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Se o nome ficou vazio ou estranho, usa um fallback
        if (!name || name.length < 3) name = "Colega";

        // Pegar primeiro nome
        const firstName = name.split(' ')[0];

        const mensagem = `Olá, ${firstName}. Enquanto você entrega o seu melhor em sessão, seu WhatsApp pode estar sendo o ralo de novos pacientes. A primeira mensagem é o portal da sua clínica; deixá-la no vácuo é fechar a porta para quem busca ajuda. 

Responda **'teste'** aqui mesmo e veja em tempo real como minha IA assume seu atendimento e agenda consultas no piloto automático. 🌑🖤`;

        return {
            nome: name,
            whatsapp: (l.whatsapp || l.phone).replace(/\D/g, ''),
            website: l.website || 'N/A',
            mensagem_inicial: mensagem
        };
    });

    fs.writeFileSync(jsonPath, JSON.stringify(cleanLeads, null, 2));
    console.log(`--- LIMPEZA RADICAL CONCLUÍDA: ${cleanLeads.length} leads. ---`);
    console.log('Amostra Final:');
    cleanLeads.slice(0, 10).forEach(l => console.log(`- ${l.nome}`));
} catch (e) {
    console.error('Erro:', e.message);
}
