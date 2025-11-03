import { promises as fsp } from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';

const dataDir = path.resolve('data');

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function withLock(filePath, fn) {
  await ensureDir(path.dirname(filePath));
  const release = await lockfile.lock(filePath, {
    retries: {
      retries: 5,
      factor: 1.5,
      minTimeout: 50,
      maxTimeout: 200
    },
    realpath: false
  }).catch(async (err) => {
    if (err && err.code === 'ENOENT') {
      await fsp.writeFile(filePath, '', { flag: 'a' });
      return lockfile.lock(filePath, {
        retries: 5,
        realpath: false
      });
    }
    throw err;
  });

  try {
    return await fn();
  } finally {
    await release();
  }
}

async function readJson(relativePath, defaultValue = null) {
  const filePath = path.join(dataDir, relativePath);
  await ensureDir(path.dirname(filePath));
  try {
    const content = await fsp.readFile(filePath, 'utf8');
    if (!content) {
      return defaultValue;
    }
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      if (defaultValue !== null) {
        await writeJson(relativePath, defaultValue);
        return defaultValue;
      }
      return null;
    }
    throw err;
  }
}

async function writeJson(relativePath, data) {
  const filePath = path.join(dataDir, relativePath);
  await ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp`;
  const json = JSON.stringify(data, null, 2);
  await withLock(filePath, async () => {
    await fsp.writeFile(tempPath, json, 'utf8');
    await fsp.rename(tempPath, filePath);
  });
}

async function updateJson(relativePath, updater, defaultValue = null) {
  const filePath = path.join(dataDir, relativePath);
  await ensureDir(path.dirname(filePath));
  return withLock(filePath, async () => {
    let current;
    try {
      const content = await fsp.readFile(filePath, 'utf8');
      current = content ? JSON.parse(content) : defaultValue;
    } catch (err) {
      if (err.code === 'ENOENT') {
        current = defaultValue;
      } else {
        throw err;
      }
    }
    const updated = await updater(current);
    const json = JSON.stringify(updated, null, 2);
    await fsp.writeFile(`${filePath}.tmp`, json, 'utf8');
    await fsp.rename(`${filePath}.tmp`, filePath);
    return updated;
  });
}

export { readJson, writeJson, updateJson, ensureDir };
