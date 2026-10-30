export async function generate(endpoint, payload) {
  let response;
  try {
    response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Тело ответа не JSON — например, сервер упал по таймауту.
  }
  if (!response.ok || !data) {
    throw new Error(data?.error || 'Сервер не ответил вовремя. Попробуйте ещё раз.');
  }
  return data;
}
