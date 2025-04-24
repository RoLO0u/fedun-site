"use client"

import React, { useState, useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import useFileStore from "@/lib/useFileStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Form, 
  FormControl, 
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

const formSchema = z.object({
  files: z
    .instanceof(File, {
      message: "File is required.",})
    .refine(
      (file) => file.type === "application/json",
      {
        message: "File must be a JSON file",
      }),
});

const AnalyzePage = () => {

  const setFile = useFileStore((state) => state.setFile);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onInput(values: z.infer<typeof formSchema>) {
    const file = values.files;
    console.log("File selected:", values.files);
    
    if (!file) {
      form.setError("files", {
        type: "manual",
        message: "No file selected",
      });
      return;
    }
    setFile(file);
    router.push("/analyze/result");
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 1) {
        const file = acceptedFiles[0];
        form.setValue("files", file);
        form.clearErrors("files"); 
        onInput({ files: file });
      } else {
        form.setError("files", {
          type: "manual",
          message: "Please upload only one file",
        });
      }
    },
    [form]
  );

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  return (
    <main className="flex flex-col flex-grow justify-center items-center h-full">
      <Card className="gap-4 sm:w-96 w-90 md:w-120">
        <CardHeader>
          <CardTitle>Telegram Group Chat Analyzer</CardTitle>
          <CardDescription>
            Show activity of users in any group chat, their best messages, and
            more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
          <form>
            <FormField
              name="files"
              control={form.control}
              render={({ field, fieldState }) => (
              <FormItem {...getRootProps()}>
                <FormControl>
                <p
                  className="flex flex-col gap-3 justify-center items-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition text-gray-500 dark:text-gray-400 px-3 cursor-pointer w-full h-25"
                  >
                  {isDragActive
                    ? "Drop the files here ..."
                    : "Drag and drop, or click to browse"}
                <Input
                  type="file"
                  {...getInputProps()}
                  id="file-upload"
                  accept="application/json"
                  onChange={(e) => {
                    const file = e.target?.files?.[0];
                    if (file) {
                      field.onChange(file);
                      form.setValue("files", file); // Update form state
                      form.clearErrors("files"); // Clear errors
                      onInput({ files: file }); // Trigger input handler
                    }
                  }}
                />
                </p>
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
              )}
            />
          </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-end">
          <div className="text-right">
            <Popover>
              <PopoverTrigger className="text-right hover:cursor-help hover:underline">
                Where can I find my chat history?
              </PopoverTrigger>
              <PopoverContent className="w-96">
                Select the group chat you want to analyze, then click on the
                three dots in the top right corner. <br />
                Select "Export chat history" and choose the format "JSON".
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-right">
            <Popover>
              <PopoverTrigger className="text-right hover:cursor-help hover:underline">
                Where is my data stored?
              </PopoverTrigger>
              <PopoverContent className="w-96">
                Your data is not stored on our servers. <br />
                We do not collect any information about you or your group chat.{" "}
                <br />
                The analysis is done locally in your browser.
              </PopoverContent>
            </Popover>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
};

export default AnalyzePage;
