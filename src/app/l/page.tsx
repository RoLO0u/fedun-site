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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleXIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { GoogleSignInButton } from "@/components/authButton";
import { LinksList } from "@/components/linksList";

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
      collectStats: false,
    },
  });
  const session = authClient.useSession();

  const [errorState, setErrorState] = React.useState<string | null>(null);
  const [statsConfirmationOpen, setStatsConfirmationOpen] = React.useState(false);

  const onSubmit = async (values: FormValues) => {
    const url = values.url;
    const collectStats = values.collectStats;
    if (url) {
      const res = await fetch("/api/shortener/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.toString(),
          collectStats: collectStats,
          author: session.data?.user?.id,
        }),
      });

      if (res.status === 401) {
        setErrorState("Unauthorized. Please verify your email before creating URLs.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate short link");
      }

      if (data.shortUrl) {
        try {
          await navigator.clipboard?.writeText(`${window.location.origin}/l/${data.shortUrl}`);
        } catch {}
        router.push(`/l/${data.shortUrl}/dashboard?created=true`);
      } else {
        throw new Error("No short link was returned by the server");
      }
    }
  }

  return (
    <main className="flex gap-2 flex-wrap grow justify-center content-center items-center h-full">
      <Card className="gap-4">
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
                        id="collect-stats"
                        className="flex gap-2"
                        checked={form.watch("collectStats")}
                        onCheckedChange={(value) => {
                          if (value === true) {
                            setStatsConfirmationOpen(true);
                          } else {
                            form.setValue("collectStats", false);
                          }
                        }}
                      />
                      <FieldLabel htmlFor="collect-stats">
                        Collect viewing statistics
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          aria-label="Privacy information about viewing statistics"
                          className="inline-flex size-6 items-center justify-center"
                        >
                          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
                        </PopoverTrigger>
                        <PopoverContent className="max-w-[calc(100vw-2rem)] text-sm">
                          When enabled, visitor IPs are used to estimate country. We store visit
                          counts and country totals, not raw click IPs. If you share this link,
                          you&apos;re responsible for any privacy notices required for your use.
                          When disabled, link statistics are not recorded.
                        </PopoverContent>
                      </Popover>
                    </Field>
                  </FieldGroup>
                </FormControl>
              </FormItem>
            )}
          />
          </form>
          </Form>
          <AlertDialog
            open={statsConfirmationOpen}
            onOpenChange={setStatsConfirmationOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enable viewing statistics?</AlertDialogTitle>
                <AlertDialogDescription>
                  Enabling statistics uses visitors&apos; IP addresses to estimate their country.
                  We store visit counts and country totals, not raw click IP addresses. If you
                  share a link with statistics enabled, you are responsible for providing any
                  privacy notices required for your use.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep disabled</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => form.setValue("collectStats", true)}
                >
                  Acknowledge and enable
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
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
                  When enabled, we use each visitor&apos;s IP address to estimate their country.
                  We store the total number of visits, the latest access time, and country-level
                  totals, but not raw click IP addresses. When disabled, link statistics are not
                  recorded. Hosting and account-security logs are separate.
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-right">
              <Popover>
                <PopoverTrigger className="text-right hover:cursor-help hover:underline">
                  Privacy Policy
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  You can delete your short link and its statistics at any time by clicking on
                  the &quot;Delete&quot; button next to the short link in your dashboard.
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardFooter>
      </Card>
      <div className="flex flex-col gap-2 items-center">
        {errorState && (
          <Alert variant="destructive" className="max-w-96">
            <CircleXIcon/>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorState}</AlertDescription>
          </Alert>
        )}
        { !session.isPending && !session.data?.user && (
          <Alert variant="destructive" className="max-w-100 h-fit">
            <CircleXIcon/>
            <AlertTitle>Unauthorized</AlertTitle>
            <AlertDescription>
              You must be logged in to create short links. Please log in or sign up to continue.
              <GoogleSignInButton callbackURL={window.location.href} className="mt-2 mb-1" shrink={false} />
              <Button onClick={() => {
                authClient.signIn.anonymous();
                router.refresh();
              }} className="mt-2">
                Continue as Guest
              </Button>
            </AlertDescription> 
          </Alert>
        )}
        <LinksList userId={session.data?.user?.id ?? ""} />
      </div>
    </main>
  );
};

export default LinkPage;