const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';
const eventTypeId = 4565935;

async function checkSlots() {
    const from = new Date();
    from.setDate(from.getDate() + 3);
    const to = new Date();
    to.setDate(to.getDate() + 21);

    const url = `https://api.cal.com/v2/slots?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}&eventTypeId=${eventTypeId}`;
    
    console.log('Consultando slots a partir de:', from.toISOString());
    
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'cal-api-version': '2024-09-04'
            }
        });
        const data = await res.json();
        console.log('Resposta status:', res.status);
        if (data.data) {
            const days = Object.keys(data.data);
            console.log('Dias com slots:', days);
            if (days.length > 0) {
                console.log('Primeiro slot do primeiro dia:', data.data[days[0]][0]);
            }
        } else {
            console.log('Nenhum dado retornado:', JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}

checkSlots();
