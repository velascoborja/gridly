import { redirect } from "next/navigation";

export default function Home() {
  const year = new Date().getFullYear();
  redirect(`/${year}/overview`);
}
