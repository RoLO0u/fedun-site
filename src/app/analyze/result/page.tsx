"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import Analyzed from "@/components/analyzed";
import DefaultMain from "@/components/defaultMain";

import useFileStore from "@/lib/useFileStore";
import setupReader from "@/lib/parseFile";
import { chatSchema } from "@/lib/chatSchema";
import Loading from "./loading";

const AnalyzeResultPage = () => {
  const router = useRouter();
  const file = useFileStore((state) => state.file);
  const [reader, setReader] = useState<FileReader | null>(null);
  const initializedReader = useRef(false);
  const [json, setJson] = useState<z.infer<typeof chatSchema> | null>(null);
  
  useEffect(() => {
    if (!file) {
      console.warn("No file found in store");
      router.push("/analyze");
      return;
    }
    setReader(() => {
      if (!initializedReader.current) {
        const newReader = setupReader();
        newReader.onload = (event) => {
          const jsonString = event.target?.result as string;
          try {
            const parsedJson = JSON.parse(jsonString);
            const validatedJson = chatSchema.parse(parsedJson);
            setJson(validatedJson);
          } catch (error) {
            console.error("Invalid JSON file or schema validation failed:", error);
            router.push("/analyze");
            return;
          }
        };
        newReader.readAsText(file);
        initializedReader.current = true;
        return newReader;
      } return reader;
    });
  }, [file]);

  if (!file) {
    return <DefaultMain />;
  }

  return (
    <main className="text-center items-center flex flex-col gap-4 flex-grow">
      {json ? (
        <Suspense fallback={<Loading />}>
          <Analyzed json={json} />
        </Suspense>
      ) : (
        <Loading />
      )}
    </main>
  );
};

export default AnalyzeResultPage;
