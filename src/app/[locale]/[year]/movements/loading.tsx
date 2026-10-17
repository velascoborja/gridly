import { BaseAppShell } from "@/components/layout/base-app-shell";
import { YearViewLoading } from "@/components/year/year-view-loading";

export default function MovementsLoading() {
  return <BaseAppShell><YearViewLoading view="movements" /></BaseAppShell>;
}
