import fs from 'fs';
import path from 'path';

let cached = null;

export function loadKnowledgeBase() {
  if (cached !== null) return cached;

  const uploadsDir = path.join(process.cwd(), 'uploads');
  let files = [];
  try {
    files = fs.readdirSync(uploadsDir).filter((f) => f.toLowerCase().endsWith('.md'));
  } catch {
    files = [];
  }

  const docs = files.map((file) => {
    const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
    return `--- 문서: ${file} ---\n${content.trim()}`;
  });

  cached = docs.join('\n\n');
  return cached;
}
