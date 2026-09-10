import { mkdir, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Execute the production modules. Only framework authentication/cache are stubbed;
// Drizzle, Neon, transactions, ownership checks and calculations remain real.
export async function loadFinancialModules(paths) {
  const directory = await mkdtemp(join(process.cwd(), '.tmp-financial-tests-'));
  const key = `financial-tests-${crypto.randomUUID()}`;
  const state = { user: null, invalidations: [] };
  globalThis[key] = state;
  const seen = new Map();
  const cachePath = join(directory, 'cache.mjs');
  await writeFile(cachePath, `export const revalidatePath = (...args) => globalThis[${JSON.stringify(key)}].invalidations.push(args);`);
  async function compile(path) {
    path = resolve(path);
    if (seen.has(path)) return seen.get(path);
    const outputPath = join(directory, relative(process.cwd(), path)).replace(/\.ts$/, '.mjs');
    seen.set(path, outputPath);
    await mkdir(dirname(outputPath), { recursive: true });
    if (path.endsWith('/server/session.ts')) {
      await writeFile(outputPath, `export const getSessionUser = async () => globalThis[${JSON.stringify(key)}].user;`);
      return outputPath;
    }
    const source = await readFile(path, 'utf8');
    let output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
      fileName: path,
    }).outputText;
    const imports = [...output.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)];
    for (const match of imports.reverse()) {
      const specifier = match[1];
      let target;
      if (specifier === 'next/cache') target = cachePath;
      else if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        let dependency = specifier.startsWith('@/')
          ? resolve('src', specifier.slice(2)) : resolve(dirname(path), specifier);
        if (!dependency.endsWith('.ts')) {
          try { await access(`${dependency}.ts`); dependency += '.ts'; }
          catch { dependency = join(dependency, 'index.ts'); }
        }
        target = await compile(dependency);
      }
      if (target) {
        const start = match.index + match[0].indexOf(specifier);
        output = output.slice(0, start) + pathToFileURL(target).href + output.slice(start + specifier.length);
      }
    }
    await writeFile(outputPath, output);
    return outputPath;
  }
  try {
    const modules = {};
    for (const [name, path] of Object.entries(paths)) {
      modules[name] = await import(pathToFileURL(await compile(path)).href);
    }
    return { modules, state, cleanup: async () => { delete globalThis[key]; await rm(directory, { recursive: true, force: true }); } };
  } catch (error) {
    delete globalThis[key];
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

export const financialModulePaths = {
  schema: 'src/db/schema.ts',
  transaction: 'src/db/financial-transaction.ts',
  data: 'src/lib/server/year-data.ts',
  carry: 'src/lib/server/year-carry-over.ts',
  action: 'src/lib/server/actions/years.ts',
  years: 'src/app/api/years/route.ts',
  year: 'src/app/api/years/[year]/route.ts',
  prefill: 'src/app/api/years/[year]/prefill/route.ts',
  templates: 'src/app/api/years/[year]/recurring-expenses/route.ts',
  month: 'src/app/api/months/[monthId]/route.ts',
  entries: 'src/app/api/months/[monthId]/entries/route.ts',
  entry: 'src/app/api/months/[monthId]/entries/[entryId]/route.ts',
  group: 'src/app/api/months/[monthId]/entry-groups/[groupId]/route.ts',
  recurring: 'src/app/api/months/[monthId]/recurring-expenses/[entryId]/route.ts',
};
