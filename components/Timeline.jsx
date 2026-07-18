import { activeEvents } from "@/lib/data";
import TimelineClient from "@/components/TimelineClient";
export default function Timeline() {
  const list = activeEvents().sort((a,b) => Number(a.year) - Number(b.year));
  return <TimelineClient events={list} />;
}
