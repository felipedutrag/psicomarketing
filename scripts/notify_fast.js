const fs = require('fs');
const notifier = require('node-notifier');
const path = require('path');

async function main() {
    const errorLogPath = path.join(__dirname, '../hook_error.log');

    try {
        // Lê o input do stdin (histórico da CLI)
        const input = fs.readFileSync(0, 'utf8');
        if (!input) {
            process.stdout.write(JSON.stringify({ status: "skipped", reason: "no input" }) + '\n');
            return;
        }

        const state = JSON.parse(input);
        let summary = "Nova resposta da Lilith entregue.";

        // No AfterAgent, a resposta está em prompt_response
        if (state.prompt_response) {
            summary = state.prompt_response
                .replace(/[#*`]/g, '')
                .replace(/\n/g, ' ')
                .trim();
        } else if (state.history && Array.isArray(state.history) && state.history.length > 0) {
            const lastMsg = state.history[state.history.length - 1];
            const content = lastMsg.content || lastMsg.text || "";
            if (content) {
                summary = content
                    .replace(/[#*`]/g, '')
                    .replace(/\n/g, ' ')
                    .trim();
            }
        }

        if (summary.length > 150) {
            summary = summary.substring(0, 147) + "...";
        }

        // Envia notificação usando node-notifier
        notifier.notify({
            title: 'Lilith 🔥',
            message: summary,
            icon: path.join(__dirname, '../img/lilith.jpg'),
            appID: 'Gemini CLI',
            sound: true,
            wait: false
        }, (err) => {
            if (err) {
                fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] Notifier Error: ${err.message}\n`);
            }
            process.exit(0);
        });

        // Retorno JSON obrigatório para a CLI
        process.stdout.write(JSON.stringify({ status: "success" }) + '\n');
        
        // Se em 2 segundos não sair pelo callback, força a saída
        setTimeout(() => process.exit(0), 2000);

    } catch (e) {
        fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] Catch Error: ${e.message}\n`);
        process.stdout.write(JSON.stringify({ status: "error", message: e.message }) + '\n');
        process.exit(0);
    }
}

main();
