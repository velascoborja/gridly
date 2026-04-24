import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const filesToCheck = [
  'src/components/layout/app-shell.tsx',
  'src/components/landing/public-hero.tsx',
  'src/components/demo/public-demo-shell.tsx'
];

const requiredStrings = [
  'process.env.NODE_ENV === "development"',
  '<Badge',
  '>DEV</Badge>'
];

test('DEV indicator source verification', async (t) => {
  for (const file of filesToCheck) {
    await t.test(`checking ${file}`, () => {
      // Use process.cwd() or relative path. Since we run from root of worktree, relative is fine.
      const filePath = path.resolve(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      assert.ok(content.includes('process.env.NODE_ENV === "development"'), `File ${file} should contain: process.env.NODE_ENV === "development"`);
      assert.ok(content.includes('<Badge'), `File ${file} should contain: <Badge`);
      
      // Use regex to handle potential whitespace between tags
      const badgeWithDevRegex = /<Badge[^>]*>[\s\S]*?DEV[\s\S]*?<\/Badge>/;
      assert.ok(badgeWithDevRegex.test(content), `File ${file} should contain: >DEV</Badge> (with flexible whitespace)`);
    });
  }
});
