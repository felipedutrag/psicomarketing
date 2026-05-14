const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../data/psicologos_leads.json');
const rootDestPath = path.join(__dirname, '../../data/psicologos_leads.json');

function recoverUTF8(str) {
    if (!str) return '';
    try {
        // Tenta recuperar se for double-encoded ou mal interpretado
        let recovered = Buffer.from(str, 'binary').toString('utf8');
        
        // Limpeza manual de mojibake residual
        return recovered
            .replace(/Ã³/g, 'ó')
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ã­/g, 'í')
            .replace(/Ã\*/g, 'í')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã£/g, 'ã')
            .replace(/Ãµ/g, 'õ')
            .replace(/Ã§/g, 'ç')
            .replace(/Â/g, '')
            .replace(/\uFFFD/g, ''); // Remove o caractere de substituição ()
    } catch (e) {
        return str;
    }
}

try {
    if (!fs.existsSync(sourcePath)) {
        console.error('Arquivo de leads não encontrado.');
        process.exit(1);
    }

    const rawData = fs.readFileSync(sourcePath, 'utf8');
    const leads = JSON.parse(rawData);

    const cleanLeads = leads.map(l => {
        let name = recoverUTF8(l.nome || l.name || 'Colega');
        
        // Limpeza radical de títulos
        name = name
            .replace(/\bPsic[^\s]*\b/gi, '')
            .replace(/\bNeuro[^\s]*\b/gi, '')
            .replace(/\bPsican[^\s]*\b/gi, '')
            .replace(/\bDra?\.?\b/gi, '')
            .replace(/em\sSantos.*/gi, '')
            .replace(/atendimento\ssomente\sparticular/gi, '')
            .replace(/Clinica/gi, '')
            .replace(/Espaço do Ser/gi, 'Equipe')
            .replace(/[\(\)\|].*/, '')
            .replace(/-.*/, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!name || name.length < 3) name = "Colega";
        const firstName = name.split(' ')[0];

        const mensagem = `Olá, ${firstName}. Enquanto você entrega o seu melhor em sessão, quem acolhe a urgência de quem acaba de chegar no seu WhatsApp? O silêncio no primeiro contato é o maior ponto de perda de pacientes particulares hoje. Sua autoridade clínica merece um portal de entrada à altura. 

Responda *teste* aqui mesmo e veja em tempo real como minha IA acolhe, tria e agenda seus pacientes no piloto automático. 🌑🖤`;

        const phone = (l.whatsapp || l.phone || '').replace(/\D/g, '');
        const fullPhone = phone.length <= 11 ? '55' + phone : phone;

        const waLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent(mensagem)}`;

        return {
            nome: name,
            whatsapp: fullPhone,
            website: l.website || 'N/A',
            mensagem_inicial: mensagem,
            wa_link: waLink
        };
    });

    const validLeads = cleanLeads.filter(l => l.whatsapp.length >= 10);

    const jsonOutput = JSON.stringify(validLeads, null, 2);
    fs.writeFileSync(sourcePath, jsonOutput, 'utf8');
    
    const rootDataDir = path.dirname(rootDestPath);
    if (!fs.existsSync(rootDataDir)) fs.mkdirSync(rootDataDir, { recursive: true });
    fs.writeFileSync(rootDestPath, jsonOutput, 'utf8');

    console.log(`--- SISTEMA DE CODIFICAÇÃO CORRIGIDO ---`);
    console.log(`Leads: ${validLeads.length}`);
    validLeads.slice(0, 5).forEach(l => console.log(`- ${l.nome}`));

} catch (e) {
    console.error('ERRO:', e.message);
}
