import { loadKnowledgeBase } from './knowledge.js';

const BOT_NAME = 'JYS메이트';
const MAX_HISTORY = 10;

function buildSystemPrompt() {
  const kb = loadKnowledgeBase();
  return `당신은 "${BOT_NAME}"라는 이름의 JYS마케팅 랜딩페이지 상담 챗봇입니다.

[답변 규칙]
1. 자기소개나 일반적인 대화(이름, 역할을 묻는 질문 등)에는 "${BOT_NAME}"로서 자연스럽고 친근하게 답변하세요.
2. JYS마케팅의 서비스·정책·가격·강점·프로세스 등에 대한 질문은 아래 [참고 문서] 내용만을 근거로 답변하세요.
   문서에 그 정보가 없다면 절대로 지어내지 말고 "정확한 안내를 위해 무료 상담을 신청해 주세요!"라고 안내하세요.
3. JYS마케팅과 무관한 질문(날씨, 일반 상식, 다른 회사 등)에는 "죄송하지만 저는 JYS마케팅 서비스 관련 질문에만 답변할 수 있어요."라고 안내하세요.
4. 항상 한국어로, 짧고 친절하게 답변하세요.

[참고 문서]
${kb || '(현재 등록된 문서가 없습니다)'}`;
}

export async function getChatReply(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('서버에 OPENAI_API_KEY가 설정되어 있지 않아요.');
  }

  const trimmed = Array.isArray(messages) ? messages.slice(-MAX_HISTORY) : [];
  const safeMessages = trimmed
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    messages: [{ role: 'system', content: buildSystemPrompt() }, ...safeMessages],
    temperature: 0.4,
    max_completion_tokens: 600
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI API 오류 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('OpenAI 응답이 비어 있어요.');
  return reply;
}
