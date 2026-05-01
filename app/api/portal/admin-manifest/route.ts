import fs from 'fs';
import path from 'path';

export async function GET() {
  const file = fs.readFileSync(
    path.join(process.cwd(), 'public/admin-manifest.json'),
    'utf-8',
  );
  return new Response(file, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
