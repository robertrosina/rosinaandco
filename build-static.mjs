import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, 'dist');
const publicEntries = [
  'index.html',
  'contact.html',
  'repertoire.html',
  'favicon.ico',
  'assets',
];

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });

for (const entry of publicEntries) {
  cpSync(path.join(projectRoot, entry), path.join(outputDirectory, entry), {
    recursive: true,
  });
}

