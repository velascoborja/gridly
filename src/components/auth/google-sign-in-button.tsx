import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  async function signInWithGoogle() {
    "use server";

    await signIn("google", { redirectTo: "/" });
  }

  return (
    <form action={signInWithGoogle}>
      <Button type="submit" size="lg" className="h-11 rounded-xl px-5 text-sm font-semibold shadow-[0_18px_32px_-20px_rgba(83,58,253,0.75)]">
        Continuar con Google
      </Button>
    </form>
  );
}
