import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("month-overview.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect = "";
let create = "";
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "useEffect" && node.getText(ast).includes('fetch("/api/tags")')) {
    effect = node.arguments[0].getText(ast);
  }
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "handleCreateTag") {
    create = node.initializer!.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);

type Tag = { id: number; name: string; color: string };

// Exercise the actual owner callbacks without a browser or a live database.
function harness(fetcher: typeof fetch, readOnly = false) {
  assert.ok(effect && create);
  let tags: Tag[] = [];
  const setTags = (update: (current: Tag[]) => Tag[]) => { tags = update(tags); };
  const compiled = ts.transpileModule(`return { load: ${effect}, create: ${create} };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const callbacks = new Function("fetch", "readOnly", "setTags", compiled)(fetcher, readOnly, setTags);
  return { ...callbacks, tags: () => tags };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const first = { id: 1, name: "Food", color: "amber" };
const second = { id: 2, name: "Travel", color: "blue" };

test("monthly subtrees receive one shared catalog and creation callback", () => {
  for (const file of ["additional-entries-card", "recurring-expenses-list"]) {
    const child = readFileSync(new URL(`./${file}.tsx`, import.meta.url), "utf8");
    assert.doesNotMatch(child, /fetch\("\/api\/tags"/);
    assert.match(child, /onCreateTag: handleCreateTag/);
  }
  assert.match(source, /<FixedExpensesCard\s+tags=\{tags\}\s+onCreateTag=\{handleCreateTag\}/);
  assert.match(source, /<AdditionalEntriesCard\s+tags=\{tags\}\s+onCreateTag=\{handleCreateTag\}/);
  const fixed = readFileSync(new URL("./fixed-expenses-card.tsx", import.meta.url), "utf8");
  assert.match(fixed, /<RecurringExpensesList\s+tags=\{tags\}\s+onCreateTag=\{onCreateTag\}/);
});

test("one initial GET and successful creation update the shared catalog", async () => {
  const methods: string[] = [];
  const owner = harness(async (_url, options) => {
    methods.push(options?.method ?? "GET");
    return Response.json(options?.method === "POST" ? second : [first]);
  });
  owner.load();
  await tick();
  assert.deepEqual(owner.tags(), [first]);
  assert.deepEqual(await owner.create("Travel", "blue"), second);
  assert.deepEqual(owner.tags(), [first, second]);
  assert.deepEqual(methods, ["GET", "POST"]);
});

test("a late initial response preserves a newly created tag without duplicates", async () => {
  let finish!: (response: Response) => void;
  const owner = harness(async (_url, options) => options?.method === "POST"
    ? Response.json(second)
    : new Promise<Response>((resolve) => { finish = resolve; }));
  owner.load();
  await owner.create("Travel", "blue");
  finish(Response.json([first]));
  await tick();
  assert.deepEqual(owner.tags(), [first, second]);
  await owner.create("Travel", "blue");
  assert.deepEqual(owner.tags(), [first, second]);
});

test("read-only views skip loading; cleanup ignores pending responses", async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => { requests++; return Response.json([first]); };
  harness(fetcher, true).load();
  assert.equal(requests, 0);
  const owner = harness(fetcher);
  owner.load()();
  await tick();
  assert.deepEqual(owner.tags(), []);
});

test("failed loading is non-blocking and failed creation preserves the catalog", async () => {
  const owner = harness(async () => { throw new Error("Offline"); });
  owner.load();
  await tick();
  await assert.rejects(owner.create("Food", "amber"), /Offline/);
  assert.deepEqual(owner.tags(), []);
  const rejected = harness(async (_url, options) => options?.method === "POST"
    ? new Response(null, { status: 500 }) : Response.json([first]));
  rejected.load();
  await tick();
  await assert.rejects(rejected.create("Travel", "blue"), /Failed to create tag/);
  assert.deepEqual(rejected.tags(), [first]);
});
