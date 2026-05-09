export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  const safe = JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safe }} />
  );
}
