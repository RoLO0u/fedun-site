import { z } from "zod";

const countSchema = z.record(
    z.string(),
    z.object({
        count: z.number(),
        from: z.string(),
    }),
);

type CountType = z.infer<typeof countSchema>;

const timeCountSchema = z.array(
  z.object({
    date: z.string(),
    count: z.number(),
  })
);

type TimeCountType = z.infer<typeof timeCountSchema>;

const GenericChartSchema = z.object({
  label: z.string(),
  count: z.number(),
  id: z.string(),
}).array();

const ChartDataSchema = z.object({
  messagesPerUser: GenericChartSchema,
  charactersPerUser: GenericChartSchema,
  mostUsedWords: GenericChartSchema,
  messagesOverTime: GenericChartSchema,
})

type ChartDataType = z.infer<typeof ChartDataSchema>;
type GenericChartType = z.infer<typeof GenericChartSchema>;

export { countSchema, ChartDataSchema, GenericChartSchema, timeCountSchema };

export type { CountType, ChartDataType, GenericChartType, TimeCountType };