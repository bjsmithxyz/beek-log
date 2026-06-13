// File + git side of the admin. Pure-ish: writeRollFiles takes an explicit
// repoRoot so it is testable against a temp directory.
import sharp from 'sharp';
import { mkdir, rm, rename, copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildRollMarkdown } from './lib.mjs';

const exec = promisify(execFile);
const MAX_EDGE = 2048;

// frames: [{ srcPath? , existing?: number, alt, caption?, location? }]
// New frames (srcPath) are sharp-processed; existing frames (number) are copied
// losslessly from the current roll dir. Everything is built in a temp dir and
// swapped in, so reorder/add/remove can't collide.
export async function writeRollFiles({ repoRoot, slug, meta, frames, body = '' }) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`invalid slug: ${slug}`);

  const photosDir = join(repoRoot, 'src/assets/photos', slug);
  const tmpDir = join(repoRoot, 'src/assets/photos', `.tmp-${slug}`);
  const contentDir = join(repoRoot, 'src/content/photos');
  const contentFile = join(contentDir, `${slug}.md`);

  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  const outPhotos = [];
  let n = 0;
  for (const f of frames) {
    n += 1;
    const outName = `${String(n).padStart(3, '0')}.jpg`;
    const outPath = join(tmpDir, outName);
    if (f.srcPath) {
      await sharp(f.srcPath)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(outPath);
    } else if (f.existing != null) {
      await copyFile(join(photosDir, `${String(f.existing).padStart(3, '0')}.jpg`), outPath);
    } else {
      throw new Error('frame has neither srcPath nor existing');
    }
    outPhotos.push({
      src: `../../assets/photos/${slug}/${outName}`,
      alt: f.alt,
      caption: f.caption,
      location: f.location,
    });
  }

  const md = buildRollMarkdown({ ...meta, photos: outPhotos, body });

  await rm(photosDir, { recursive: true, force: true });
  await rename(tmpDir, photosDir);
  await mkdir(contentDir, { recursive: true });
  await writeFile(contentFile, md, 'utf8');

  return {
    frameCount: n,
    photosDir: `src/assets/photos/${slug}`,
    contentFile: `src/content/photos/${slug}.md`,
  };
}

export async function gitPublish({ repoRoot, paths, message }) {
  const log = [];
  const run = async (args) => {
    const { stdout, stderr } = await exec('git', args, { cwd: repoRoot });
    log.push(`$ git ${args.join(' ')}`.trim());
    if (stdout.trim()) log.push(stdout.trim());
    if (stderr.trim()) log.push(stderr.trim());
  };
  await run(['add', ...paths]);
  await run(['commit', '-m', message]);
  await run(['push']);
  return log;
}
