import { Metadata } from "next"
import RecommendationsDisplay from "@modules/recommendations/templates/recommendations-display"

export const metadata: Metadata = {
  title: "Product Recommendations | AI-Powered Recommender",
  description: "View your personalized product recommendations with AI-generated explanations",
}

export default function RecommendationsPage() {
  return <RecommendationsDisplay />
}
