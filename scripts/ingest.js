import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const { getSupabaseClient } = await import('../lib/supabaseClient.js');
const { createEmbedding } = await import('../lib/embeddings.js');

function chunkText(text, maxLen = 1000) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if (current && (current.length + p.length + 2) > maxLen) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function main() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않아요. .env를 확인해 주세요.');
    process.exit(1);
  }

  const uploadsDir = path.join(root, 'uploads');
  const files = fs.readdirSync(uploadsDir).filter((f) => f.toLowerCase().endsWith('.md'));

  if (files.length === 0) {
    console.log('uploads/ 폴더에 .md 문서가 없어요.');
    return;
  }

  for (const file of files) {
    const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
    const chunks = chunkText(content);
    console.log(`[ingest] ${file}: ${chunks.length}개 청크`);

    const { error: deleteError } = await supabase.from('documents').delete().eq('source', file);
    if (deleteError) {
      console.error(`[ingest] ${file} 기존 청크 삭제 실패:`, deleteError.message);
    }

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);
      const { error } = await supabase.from('documents').insert({
        source: file,
        chunk_index: i,
        content: chunks[i],
        embedding
      });
      if (error) {
        console.error(`[ingest]   chunk ${i} 저장 실패:`, error.message);
      } else {
        console.log(`[ingest]   chunk ${i} 저장 완료`);
      }
    }
  }

  console.log('[ingest] 완료');
}

main().catch((err) => {
  console.error('[ingest] 실패:', err);
  process.exit(1);
});
