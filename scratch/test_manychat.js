
async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/webhook/manychat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Olá Vesper, quem é você?",
        name: "Felipe"
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
