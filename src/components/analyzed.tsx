"use client";

import React from "react";
import { z } from "zod";

import { parseChartData } from "@/lib/parseData";
import { parseDate, parseNullish } from "@/lib/utils";
import { chatSchema } from "@/lib/chatSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { type ChartConfig } from "./ui/chart";
import { VerticalChart, TimeMessageChart } from "./ui/customChart";
import { Slider } from "./ui/slider";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  calculateMessagesOverTime,
} from "@/lib/calculateMessages";

interface AnalyzedProps {
  json: z.infer<typeof chatSchema>,
};

const chartConfig = {
  user: {
    label: "User",
    theme: {
      light: "#1111aa",
      dark: "#000090",
    }
  },
} satisfies ChartConfig;

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
};

const MemoizedVerticalChart = React.memo(VerticalChart);
const MemoizedTimeMessageChart = React.memo(TimeMessageChart);

const Analyzed: React.FC<AnalyzedProps> = ({ json }) => {
  const [minLength, setMinLength] = React.useState(1);
  const originalUserNames = React.useMemo(
    () =>
      Object.fromEntries(
      parseChartData(json.messages, 1).messagesPerUser.map((user) => [user.id, user.label])
      ),
    [json.messages]
  );
  const [userNames, setUserNames] = React.useState<Record<string, string>>(originalUserNames);
  const deferredUserNames = useDebouncedValue(userNames, 150);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const editedMessages = React.useMemo(
    () =>
      json.messages.map((message) => {
        const userId = String(parseNullish(message.from_id));
        const renamedUser = deferredUserNames[userId];

        return renamedUser === undefined
          ? message
          : { ...message, from: renamedUser };
      }),
    [deferredUserNames, json.messages]
  );
  const chartData = React.useMemo(
    () => parseChartData(editedMessages, minLength),
    [editedMessages, minLength]
  );
  const users = chartData.messagesPerUser.map((user) => user.label);
  const userOptions = ["All Users", ...users];
  const messagesOverTime = React.useMemo(
    () => calculateMessagesOverTime(editedMessages, selectedUser ?? undefined),
    [editedMessages, selectedUser]
  );

  React.useEffect(() => {
    if (selectedUser !== null && !users.includes(selectedUser)) {
      setSelectedUser(null);
    }
  }, [selectedUser, users]);

  const renameUser = (id: string, name: string) => {
    setUserNames((currentNames) => ({ ...currentNames, [id]: name }));
  };
  const renderUserRenameFields = () => (
    <div className="px-4 pb-4 text-left md:px-0 md:pb-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Update names used in the charts.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUserNames({ ...originalUserNames })}
        >
          Reset
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(userNames).map(([id, name], index) => (
          <label key={id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {originalUserNames[id] ?? `User ${index + 1}`}
            </span>
            <Input
              value={name}
              aria-label={`Rename ${originalUserNames[id] ?? `user ${index + 1}`}`}
              onChange={(event) => renameUser(id, event.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Analyze Result of &quot;{json.name}&quot;</h1>
      {json.messages.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="font-medium">No messages to analyze</p>
          <p className="text-sm text-muted-foreground">
            This chat export does not contain any messages.
          </p>
        </div>
      ) : (
        <>
          <div>
            <p>First message sent: {parseDate(json.messages[0].date)}</p>
            <p>
              Last message sent: {parseDate(json.messages[json.messages.length - 1].date)}
            </p>
          </div>
          <div className="flex justify-end">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline">Rename users</Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                  <SheetHeader className="text-left">
                    <SheetTitle>Rename users</SheetTitle>
                    <SheetDescription>
                      Choose the names displayed in the analysis charts.
                    </SheetDescription>
                  </SheetHeader>
                  {renderUserRenameFields()}
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden md:block">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">Rename users</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85dvh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Rename users</DialogTitle>
                    <DialogDescription>
                      Choose the names displayed in the analysis charts.
                    </DialogDescription>
                  </DialogHeader>
                  {renderUserRenameFields()}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="w-full flex flex-wrap justify-between gap-y-4">
            <div className="w-full xl:w-[49%] pb-2 xl:pb-8">
              <MemoizedVerticalChart
                title="Messages per user"
                chartConfig={chartConfig}
                chartData={chartData.messagesPerUser}
              />
            </div>
            <div className="w-full xl:w-[49%] pb-2">
              <MemoizedVerticalChart
                title="Characters per user"
                chartConfig={chartConfig}
                chartData={chartData.charactersPerUser}
              />
            </div>
            <div className="w-full xl:w-[49%]">
              <MemoizedVerticalChart
                title="Most used words"
                chartConfig={chartConfig}
                chartData={chartData.mostUsedWords}
                controls={
                  <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                    <p className="whitespace-nowrap">Minimum characters in word:</p>
                    <div className="flex w-full max-w-40 items-center justify-center gap-4">
                      <Slider
                        aria-label="Minimum characters in word"
                        min={1}
                        value={[minLength]}
                        max={10}
                        className="w-full"
                        onValueChange={(val) => setMinLength(val[0])}
                      />
                      <p>{minLength}</p>
                    </div>
                  </div>
                }
              />
            </div>
            <div className="w-full xl:w-[49%]">
              <MemoizedTimeMessageChart
                title="Messages over time"
                chartConfig={chartConfig}
                chartData={messagesOverTime}
                controls={
                  <div className="justify-self-center">
                    <Combobox
                      items={userOptions}
                      itemToStringValue={(item) => item ?? ""}
                      onValueChange={(value?: string | null) => {
                        setSelectedUser(value === "All Users" ? null : (value ?? null));
                      }}
                    >
                      <ComboboxInput
                        aria-label="Filter messages by user"
                        placeholder="Select user"
                        className="w-40"
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {(user: string) => (
                            <ComboboxItem key={user} value={user}>
                              {user === "All Users" ? <i>{user}</i> : user}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                }
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Analyzed;
