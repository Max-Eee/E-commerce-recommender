"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ProductCard from "../../components/product-card"
import RecommendationCard from "../../components/recommendation-card"
import { Product, Recommendation, UserBehavior } from "../../../../types/recommendation"

export default function RecommendationsDisplay() {
  const router = useRouter()
  const [data, setData] = useState<{
    recommendations: Recommendation[]
    products: Product[]
    userBehavior: UserBehavior
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem("recommendationResults")
    if (!stored) {
      router.push("/us")
      return
    }

    try {
      const parsed = JSON.parse(stored)
      setData(parsed)
    } catch (error) {
      console.error("Failed to parse results:", error)
      router.push("/us")
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-base">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-base mx-auto mb-4"></div>
          <p className="text-ui-fg-subtle">Loading recommendations...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { recommendations, products, userBehavior } = data

  // Get products that were interacted with
  const interactedProductIds = new Set([
    ...(userBehavior.viewedProducts || []),
    ...(userBehavior.purchasedProducts || []),
    ...(userBehavior.cartItems || []),
  ])

  const browsedProducts = products.filter(p => interactedProductIds.has(p.id))
  const otherProducts = products.filter(
    p => !interactedProductIds.has(p.id) && 
    !recommendations.find(r => r.productId === p.id)
  )

  return (
    <div className="bg-ui-bg-base">
      {/* Header with Back Button */}
      <div className="border-b border-ui-border-base bg-ui-bg-subtle">
        <div className="content-container py-6">
          <button
            onClick={() => router.push("/us")}
            className="mb-4 text-ui-fg-subtle hover:text-ui-fg-base flex items-center gap-2 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div>
            <h1 className="text-3xl font-normal text-ui-fg-base mb-2">
              Your Recommendations
            </h1>
            <p className="text-ui-fg-subtle">
              Personalized suggestions based on AI analysis
            </p>
          </div>
        </div>
      </div>

      <div className="content-container py-12">
        {/* For You Section - Featured Recommendations */}
        <div className="mb-16">
          <div className="mb-8 pb-6 border-b border-ui-border-base">
            <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-2">Curated For You</p>
            <h2 className="text-2xl font-normal text-ui-fg-base">
              Recommended Products
            </h2>
          </div>
          
          <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
            {recommendations.map((rec, index) => {
              const product = products.find(p => p.id === rec.productId)
              if (!product) return null
              
              return (
                <li key={rec.productId}>
                  <div className="group">
                    <div className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle border border-ui-border-base mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {index < 3 && (
                        <div className="absolute top-2 left-2 bg-ui-fg-base text-white px-2 py-1 text-xs">
                          Top {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm text-ui-fg-base group-hover:text-ui-fg-subtle transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-ui-fg-base">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-ui-fg-muted">
                          {Math.round(rec.score * 100)}% match
                        </span>
                      </div>
                      {rec.explanation && (
                        <p className="text-xs text-ui-fg-subtle mt-2 line-clamp-2">
                          {rec.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Previously Browsed - Store Style */}
        {browsedProducts.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 pb-6 border-b border-ui-border-base">
              <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-2">Continue Shopping</p>
              <h2 className="text-2xl font-normal text-ui-fg-base">
                Recently Viewed
              </h2>
            </div>
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
              {browsedProducts.map((product) => (
                <li key={product.id}>
                  <div className="group">
                    <div className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle border border-ui-border-base mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm text-ui-fg-base group-hover:text-ui-fg-subtle transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-sm font-medium text-ui-fg-base">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All Products - Store Style */}
        {otherProducts.length > 0 && (
          <div>
            <div className="mb-8 pb-6 border-b border-ui-border-base">
              <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-2">Browse All</p>
              <h2 className="text-2xl font-normal text-ui-fg-base">
                All Products
              </h2>
            </div>
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
              {otherProducts.map((product) => (
                <li key={product.id}>
                  <div className="group">
                    <div className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle border border-ui-border-base mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm text-ui-fg-base group-hover:text-ui-fg-subtle transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-sm font-medium text-ui-fg-base">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
