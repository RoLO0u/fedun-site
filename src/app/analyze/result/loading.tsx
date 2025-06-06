import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="text-center items-center p-8 flex flex-col gap-4 flex-grow">
      <Skeleton className="h-8 w-1/2" />
      <div className="flex flex-col w-full items-center gap-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-[50vh] w-1/2" />
    </main>
  );
}
