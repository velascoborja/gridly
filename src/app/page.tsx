import {redirect} from 'next/navigation';
import { auth } from "@/auth";

export default async function RootPage() {
  const session = await auth();
  const locale = session?.user?.language || "es";
  redirect(`/${locale}`);
}
