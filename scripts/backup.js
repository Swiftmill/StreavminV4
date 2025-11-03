import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve('data');
const backupDir = path.join(__dirname, '..', 'backups');

async function createArchive() {
  await fs.promises.mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const destPath = path.join(backupDir, `data-backup-${timestamp}.tar.gz`);
  const output = fs.createWriteStream(destPath);
  const archive = zlib.createGzip();

  const tar = await import('tar-stream');
  const pack = tar.pack();

  const walk = async (dir, prefix = '') => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(prefix, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.isFile()) {
        const fileContent = await fs.promises.readFile(fullPath);
        pack.entry({ name: relPath }, fileContent);
      }
    }
  };

  await walk(dataDir);
  pack.finalize();

  await pipeline(pack, archive, output);
  console.log(`Backup created at ${destPath}`);
}

createArchive().catch((err) => {
  console.error(err);
  process.exit(1);
});
