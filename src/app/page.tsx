import { lastUpdatedType } from "@/lib/db/lastUpdatedTypes";
import { getAllLastUpdated } from "@/lib/db/lastUpdatedActions";
import HomePage from "@/components/homePage";

export default async function Home() {
  const lastUpdated = await getAllLastUpdated() as lastUpdatedType[];
  return <HomePage lastUpdatedData={lastUpdated} />;
}
