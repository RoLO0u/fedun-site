"use client"; 

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CircleXIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type FormValues = {
  url: string;
  collectStats: boolean;
};

const formSchema = z.object({
  url: z.url({
      error: "Must be a link",
  }),
  collectStats: z.boolean()
});

const LinkPage = () => {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      collectStats: true,
    },
  });

  const [errorState, setErrorState] = React.useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    const url = values.url;
    const collectStats = values.collectStats;
    if (url) {
      const res = await fetch("/api/shortener/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.toString(), collectStats: collectStats }),
      });

      if (res.status === 401) {
        setErrorState("Unauthorized. Please log in as an admin to generate short links.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate short link");
      }

      if (data.shortUrl) {
        await navigator.clipboard.writeText(`${window.location.origin}/l/${data.shortUrl}`);
        router.push(`/l/${data.shortUrl}/dashboard?created=true`);
      } else {
        throw new Error("No short link was returned by the server");
      }
    }
  }

  return (
    <main className="flex gap-2 flex-col grow justify-center items-center h-full">
      <Card className="gap-4 sm:w-96 w-90 md:w-120">
        <CardHeader>
          <CardTitle>Simple URL Shortener</CardTitle>
          <CardDescription>
            Paste your link below to generate a short link. The short link will redirect to the original link when accessed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="url" className="flex flex-col gap-4">
            <FormField
              name="url"
              control={form.control}
              render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                <Input
                  type="text"
                  id="link-upload"
                  placeholder="https://example.com"
                  {...field}
                  value={field.value ?? ""}
                />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
                <FormControl>
                  <FieldGroup>
                    <Field orientation="horizontal" className="gap-2">
                      <Checkbox
                        id="terms"
                        className="flex gap-2"
                        checked={form.watch("collectStats")}
                        onCheckedChange={(value) => {
                          form.setValue("collectStats", !!value);
                        }}
                      />
                      <FieldLabel htmlFor="terms">
                        Collect viewing statistics
                      </FieldLabel>
                    </Field>
                  </FieldGroup>
                </FormControl>
              </FormItem>
            )}
          />
          </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="submit" form="url">
            Generate Short Link
          </Button>
          <div>
            <div className="text-right">
              <Popover>
                <PopoverTrigger className="text-right hover:cursor-help hover:underline">
                  Statistics we store
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  We store the number of times a short link is accessed, and the date and time of the last access. <br />
                  We do not store any information about the user accessing the link. The statistics are stored in a database on our server.
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-right">
              <Popover>
                <PopoverTrigger className="text-right hover:cursor-help hover:underline">
                  Privacy Policy
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  You can delete your short link and its statistics at any time by clicking on the "Delete" button next to the short link in your dashboard.
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardFooter>
      </Card>
      {errorState && (
        <Alert variant="destructive" className="max-w-96">
          <CircleXIcon/>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorState}</AlertDescription>
        </Alert>
      )}
    </main>
  );
};

export default LinkPage;