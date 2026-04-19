import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

interface Props {
  email?: string | null;
  name?: string | null;
}

export function UserMenu({ email, name }: Props) {
  async function handleSignOut() {
    "use server";

    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden min-w-0 text-right md:block">
        <p className="truncate text-sm font-medium text-foreground">{name ?? "Cuenta"}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <form action={handleSignOut}>
        <Button type="submit" variant="outline" size="sm" className="rounded-full border-border/70 bg-background/85">
          Salir
        </Button>
      </form>
    </div>
  );
}
