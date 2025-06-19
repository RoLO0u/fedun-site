import { z } from "zod";

const countSchema = z.record(
    z.string(),
    z.object({
        count: z.number(),
        from: z.string(),
    }),
);

type CountType = z.infer<typeof countSchema>;

const GenericChartSchema = z.object({
  label: z.string(),
  count: z.number(),
  id: z.string(),
}).array();

const ChartDataSchema = z.object({
  messagesPerUser: GenericChartSchema,
  charactersPerUser: GenericChartSchema,
  mostUsedWords: GenericChartSchema,
})

type ChartDataType = z.infer<typeof ChartDataSchema>;
type GenericChartType = z.infer<typeof GenericChartSchema>;

export { countSchema, ChartDataSchema, GenericChartSchema };

export type { CountType, ChartDataType, GenericChartType };