import { z } from "zod";

const countSchema = z.record(
    z.string(),
    z.object({
        count: z.number(),
        from: z.string(),
    }),
);

type CountType = z.infer<typeof countSchema>;

const chartDataSchema = z.object({
  user_id: z.string(),
  count: z.number(),
  from: z.string(),
}).array();

type ChartDataType = z.infer<typeof chartDataSchema>;

export { countSchema, chartDataSchema };

export type { CountType, ChartDataType };