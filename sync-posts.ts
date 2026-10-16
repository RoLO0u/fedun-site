import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { db } from '@/db/drizzle';
import { posts } from '@/db/schema';

const DRAFTS_DIR = path.join(process.cwd(), '_drafts');

async function sync() {
  const files = fs.readdirSync(DRAFTS_DIR).filter(fn => fn.endsWith('.mdx'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    await db.insert(posts).values({
      id: frontmatter.id,
      title: frontmatter.title,
      content: content,
    }).onConflictDoUpdate({
      target: posts.id,
      set: { title: frontmatter.title, content: content }
    });
    
    console.log(`Synced: ${frontmatter.id}`);
  }
}
sync();