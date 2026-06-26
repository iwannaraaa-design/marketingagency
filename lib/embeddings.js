const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function createEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('서버에 OPENAI_API_KEY가 설정되어 있지 않아요.');
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`임베딩 API 오류 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!embedding) throw new Error('임베딩 응답이 비어 있어요.');
  return embedding;
}
