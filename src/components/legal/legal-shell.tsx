import Image from "next/image";
import { Link } from "@/i18n/routing";

interface LegalShellProps {
  children: React.ReactNode;
}

export function LegalShell({ children }: LegalShellProps) {
  return (
    <div className="min-h-screen bg-[#fbfcff] text-foreground">
      <header className="border-b border-[#e5edf5] bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="group inline-flex items-center gap-2">
            <Image
              src="/gridly-wordmark.svg"
              alt="Gridly"
              width={216}
              height={64}
              className="h-9 w-[122px] transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {children}
      </main>
    </div>
  );
}
