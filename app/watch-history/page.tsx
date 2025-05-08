import { WatchHistoryAnalytics } from "@/components/watch-history-analytics";
import { FadeIn } from "@/components/motion-wrapper";

export default function WatchHistoryPage() {
  return (
    <FadeIn yOffset={20} duration={0.5}>
      <WatchHistoryAnalytics />
    </FadeIn>
  )
}