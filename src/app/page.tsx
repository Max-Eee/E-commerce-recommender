import { Metadata } from "next"
import InputSection from "@modules/home/components/input-section"
import ApproachSection from "@modules/home/components/approach-section"
import Hero from "@modules/home/components/hero"

export const metadata: Metadata = {
  title: "E Product Recommender",
  description:
    "E-commerce Product Recommendation Engine with LLM-powered explanations using hybrid algorithms.",
}

export default async function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with CardSwap */}
      <Hero />

      {/* Input Section */}
      <InputSection />

      {/* Approach Section */}
      <ApproachSection />

    </div>
  )
}
