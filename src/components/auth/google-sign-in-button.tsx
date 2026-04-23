import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  className?: string;
  buttonClassName?: string;
};

export function GoogleSignInButton({ className, buttonClassName }: GoogleSignInButtonProps = {}) {
  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <form action={signInWithGoogle} className={className}>
      <Button 
        type="submit" 
        size="lg" 
        className={cn(
          "group relative flex h-10 items-center gap-3 rounded-[4px] bg-[#533afd] px-5 text-base font-normal text-white shadow-[0_15px_35px_-5px_rgba(50,50,93,0.15),0_5px_15px_-5px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-[#4434d4] hover:shadow-[0_18px_40px_-5px_rgba(50,50,93,0.2),0_8px_20px_-5px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-[#533afd] focus:ring-offset-2 active:transform active:scale-[0.98]",
          buttonClassName,
        )}
      >
        <svg 
          viewBox="0 0 24 24" 
          className="size-[18px] fill-current text-white/90 transition-transform duration-200 group-hover:scale-110"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" />
        </svg>
        <span className="tracking-tight">Continuar con Google</span>
      </Button>
    </form>
  );
}
