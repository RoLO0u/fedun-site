import { LucideFrown } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-grow flex-col gap-2 items-center justify-center">
      <LucideFrown className="w-16 h-16 mb-1"/>
      <div className="text-2xl font-bold">
        404 - Page Not Found
      </div>
      <div>
        The page you are looking for does not exist.
      </div>
    </main>
  );
}