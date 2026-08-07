"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Loader2 } from "lucide-react";
import Analyzed from "@/components/analyzed";
import DefaultMain from "@/components/defaultMain";

import useFileStore from "@/lib/useFileStore";
import { chatSchema } from "@/lib/chatSchema";

const AnalyzeResultPage = () => {
  const router = useRouter();
  const file = useFileStore((state) => state.file);
  const [json, setJson] = useState<z.infer<typeof chatSchema> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!file) {
      console.warn("No file found in store");
      router.push("/analyze");
      return;
    }
    let cancelled = false;

    const analyzeFile = async () => {
      try {
        const jsonString = await file.text();
        const parsedJson = JSON.parse(jsonString);
        const validatedJson = chatSchema.parse(parsedJson);

        if (!cancelled) {
          setJson(validatedJson);
        }
      } catch (error) {
        console.error("Invalid JSON file or schema validation failed:", error);

        if (!cancelled) {
          setError(
            error instanceof SyntaxError
              ? "The selected file is not valid JSON."
              : "The selected file does not match the expected chat export schema."
          );
        }
      }
    };

    analyzeFile();

    return () => {
      cancelled = true;
    };
  }, [file, router]);

  if (!file) {
    return <DefaultMain />;
  }

  if (error) {
    return (
      <main className="text-center items-center justify-center flex flex-col gap-4 grow px-4">
        <p className="text-sm text-red-500">{error}</p>
        <p className="text-sm text-muted-foreground">
          Check that the export is complete and has not been edited or truncated.
        </p>
      </main>
    );
  }

  return (
    <main className="text-center items-center justify-center flex flex-col gap-4 grow">
      {json ? (
        <Suspense fallback={<Loader2 className="animate-spin" />}>
          <Analyzed json={json} />
        </Suspense>
      ) : (
        <Loader2 className="animate-spin" />
      )}
    </main>
  );
};

export default AnalyzeResultPage;
