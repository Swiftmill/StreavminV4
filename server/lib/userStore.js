import fs from 'fs';
import bcrypt from 'bcryptjs';
import path from 'path';
import { nanoid } from 'nanoid';
import { readJson, updateJson } from './fileStorage.js';

const USERS_FILE = 'users/users.json';
const AUDIT_FILE = 'audit.log';

const defaultAdmin = {
  username: 'admin',
  role: 'admin',
  passHash: bcrypt.hashSync('admin123', 10),
  disabled: false
};

async function bootstrap() {
  await updateJson(USERS_FILE, async (users = []) => {
    if (!Array.isArray(users)) {
      return [defaultAdmin];
    }
    const hasAdmin = users.some((user) => user.username === 'admin');
    if (!hasAdmin) {
      return [...users, defaultAdmin];
    }
    return users;
  }, []);
}

async function listUsers() {
  const users = await readJson(USERS_FILE, []);
  return users;
}

async function findUser(username) {
  const users = await listUsers();
  return users.find((u) => u.username === username);
}

async function saveUsers(users) {
  await updateJson(USERS_FILE, async () => users, []);
}

async function createUser(actor, { username, password, role = 'user' }) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  if (!['admin', 'user'].includes(role)) {
    throw new Error('Invalid role');
  }
  const users = await listUsers();
  if (users.some((u) => u.username === username)) {
    const error = new Error('User already exists');
    error.status = 409;
    throw error;
  }
  const passHash = await bcrypt.hash(password, 10);
  const newUser = { username, role, passHash, disabled: false, id: nanoid(8) };
  users.push(newUser);
  await saveUsers(users);
  await appendAudit(actor, `created user ${username}`);
  return newUser;
}

async function updateUser(actor, username, changes) {
  const users = await listUsers();
  const idx = users.findIndex((u) => u.username === username);
  if (idx === -1) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  const user = users[idx];
  if (changes.password) {
    user.passHash = await bcrypt.hash(changes.password, 10);
  }
  if (changes.role) {
    if (!['admin', 'user'].includes(changes.role)) {
      throw new Error('Invalid role');
    }
    user.role = changes.role;
  }
  if (typeof changes.disabled === 'boolean') {
    user.disabled = changes.disabled;
  }
  users[idx] = user;
  await saveUsers(users);
  await appendAudit(actor, `updated user ${username}`);
  return user;
}

async function disableUser(actor, username, disabled = true) {
  return updateUser(actor, username, { disabled });
}

async function authenticate(username, password) {
  const user = await findUser(username);
  if (!user || user.disabled) {
    return null;
  }
  const match = await bcrypt.compare(password, user.passHash);
  return match ? user : null;
}

async function appendAudit(actor, action) {
  const line = `${new Date().toISOString()}\t${actor || 'system'}\t${action}\n`;
  const fsPath = path.join('data', AUDIT_FILE);
  await fs.promises.mkdir(path.dirname(fsPath), { recursive: true });
  await fs.promises.appendFile(fsPath, line, 'utf8');
}

export { bootstrap, listUsers, findUser, createUser, updateUser, disableUser, authenticate, appendAudit };
