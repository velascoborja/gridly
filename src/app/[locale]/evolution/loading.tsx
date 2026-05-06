import { Skeleton } from "@/components/ui/skeleton";

export default function EvolutionLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-56 w-full rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
