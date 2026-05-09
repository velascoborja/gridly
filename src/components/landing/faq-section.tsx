import { useTranslations } from "next-intl";

export function FAQSection() {
  const t = useTranslations("FAQ");
  const items = t.raw("items") as Array<{ question: string; answer: string }>;

  return (
    <section className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-2xl font-light tracking-[-0.03em] text-[#061b31]">
        {t("title")}
      </h2>
      <dl className="divide-y divide-[#e5edf5]">
        {items.map((item, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-normal tracking-[-0.01em] text-[#061b31] [&::-webkit-details-marker]:hidden">
              {item.question}
              <svg
                className="h-4 w-4 shrink-0 text-[#64748d] transition-transform duration-200 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </summary>
            <p className="mt-3 text-sm font-light leading-7 text-[#64748d]">
              {item.answer}
            </p>
          </details>
        ))}
      </dl>
    </section>
  );
}
