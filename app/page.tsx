import { Analytics } from "@/components/analytics"
import { FadeIn } from "@/components/motion-wrapper";

export default function Home() {
  return (
    <FadeIn yOffset={50} duration={0.7}>
      <Analytics />
    </FadeIn>
  )
}
