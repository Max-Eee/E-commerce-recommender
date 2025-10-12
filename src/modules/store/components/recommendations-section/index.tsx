"use client"

import { useEffect, useState, useRef } from "react"
import { getRecommendationDataFromCookie } from "@lib/util/recommendation-cookies"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@modules/common/components/carousel"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  attributes?: Record<string, any>
  image?: string
  tags?: string[]
}

interface Recommendation {
  productId: string
  score: number
  explanation?: string
}

interface UserBehavior {
  userId: string
  viewedProducts: string[]
  purchasedProducts: string[]
  cartItems: string[]
  searchQueries: string[]
  ratings: Record<string, number>
}

// Global image cache to prevent duplicate fetches across re-renders
const globalImageCache: Record<string, string> = {}
const pendingRequests: Record<string, Promise<string>> = {}

export default function RecommendationsSection() {
  const [data, setData] = useState<{
    recommendations: Recommendation[]
    products: Product[]
    userBehavior: UserBehavior
  } | null>(null)
  const [imageCache, setImageCache] = useState<Record<string, string>>(globalImageCache)
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false)
  const fetchedProducts = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Get recommendation data from cookies (with sessionStorage fallback)
    const cookieData = getRecommendationDataFromCookie()
    if (cookieData) {
      console.log("Loaded recommendation data from cookies:", cookieData)
      setData(cookieData)
      
      // Prefetch all unique product images in batch
      const uniqueProducts = Array.from(
        new Map(cookieData.products.map((p: Product) => [p.id, p])).values()
      ) as Product[]
      uniqueProducts.forEach((product) => {
        if (!globalImageCache[product.name.toLowerCase()]) {
          fetchProductImage(product)
        }
      })
      return
    }

    // Legacy fallback: try sessionStorage
    const stored = sessionStorage.getItem("recommendationResults")
    if (!stored) {
      console.log("No recommendation data found in cookies or sessionStorage")
      return
    }

    try {
      const parsed = JSON.parse(stored)
      console.log("Loaded recommendation data from sessionStorage:", parsed)
      setData(parsed)
      
      // Prefetch images for sessionStorage data too
      if (parsed.products) {
        const uniqueProducts = Array.from(
          new Map(parsed.products.map((p: Product) => [p.id, p])).values()
        ) as Product[]
        uniqueProducts.forEach((product) => {
          if (!globalImageCache[product.name.toLowerCase()]) {
            fetchProductImage(product)
          }
        })
      }
    } catch (error) {
      console.error("Failed to parse results:", error)
    }
  }, [])

  // Fetch image from our API endpoint with rate limiting and deduplication
  const fetchProductImage = async (product: Product): Promise<string> => {
    // Check if product already has a valid image
    if (product.image && product.image.startsWith('http')) {
      return product.image
    }

    const cacheKey = product.name.toLowerCase()
    
    // Check global cache first
    if (globalImageCache[cacheKey]) {
      return globalImageCache[cacheKey]
    }

    // Check if request is already pending (deduplication)
    const pending = pendingRequests[cacheKey]
    if (pending) {
      return pending
    }

    // Create and store the pending request
    const requestPromise = (async () => {
      try {
        const response = await fetch(`/api/unsplash-image?query=${encodeURIComponent(product.name)}`)
        
        if (response.status === 429) {
          setRateLimitExceeded(true)
          const fallbackUrl = `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(product.name)}`
          globalImageCache[cacheKey] = fallbackUrl
          return fallbackUrl
        }

        const data = await response.json()
        const imageUrl = data.url || `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(product.name)}`
        
        // Cache the result globally
        globalImageCache[cacheKey] = imageUrl
        setImageCache({ ...globalImageCache })
        
        return imageUrl
      } catch (error) {
        console.error("Error fetching image:", error)
        const fallbackUrl = `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(product.name)}`
        globalImageCache[cacheKey] = fallbackUrl
        return fallbackUrl
      } finally {
        // Clean up pending request
        delete pendingRequests[cacheKey]
      }
    })()

    pendingRequests[cacheKey] = requestPromise
    return requestPromise
  }

  // Component to handle async image loading
  const ProductImage = ({ product }: { product: Product }) => {
    const [imageSrc, setImageSrc] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      let mounted = true
      
      fetchProductImage(product).then(url => {
        if (mounted) {
          setImageSrc(url)
          setLoading(false)
        }
      })

      return () => {
        mounted = false
      }
    }, [product.id])

    if (loading) {
      return (
        <div className="w-full h-full bg-ui-bg-subtle animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }

    return (
      <img
        src={imageSrc}
        alt={product.name}
        className="w-full h-full object-cover"
      />
    )
  }

  if (!data) {
    return null
  }

  const { recommendations, products, userBehavior } = data

  // Ensure userBehavior has required arrays (normalize)
  const normalizedUserBehavior = {
    ...userBehavior,
    viewedProducts: userBehavior.viewedProducts || [],
    purchasedProducts: userBehavior.purchasedProducts || [],
    cartItems: userBehavior.cartItems || [],
  }

  // Get unique, valid cart items (filter out duplicates and non-existent products)
  const uniqueCartItemIds = Array.from(new Set(normalizedUserBehavior.cartItems))
  const validCartItems = products.filter(p => uniqueCartItemIds.includes(p.id))
  const actualCartCount = validCartItems.length

  // Debug logging
  console.log('🛒 Activity Summary Cart Debug:', {
    rawCartItems: normalizedUserBehavior.cartItems.length,
    uniqueCartItemIds: uniqueCartItemIds.length,
    validCartItems: actualCartCount,
    cartItemIds: normalizedUserBehavior.cartItems,
    validProductIds: validCartItems.map(p => p.id)
  })

  // Get products that were interacted with
  const interactedProductIds = new Set([
    ...normalizedUserBehavior.viewedProducts,
    ...normalizedUserBehavior.purchasedProducts,
    ...normalizedUserBehavior.cartItems,
  ])

  const browsedProducts = products.filter(p => interactedProductIds.has(p.id))

  return (
    <>
      {/* Rate Limit Notice */}
      {rateLimitExceeded && (
        <div className="mb-6 small:mb-8 bg-ui-bg-subtle border border-ui-border-base p-3 small:p-4">
          <div className="flex items-start gap-2 small:gap-3">
            <svg className="w-4 h-4 small:w-5 small:h-5 text-ui-fg-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs small:text-sm text-ui-fg-base font-medium mb-1">Image Rate Limit Reached</p>
              <p className="text-[10px] small:text-xs text-ui-fg-subtle">
                You've reached the maximum of 50 product images per 24 hours. Placeholder images will be shown instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Products Section */}
      {recommendations.length > 0 && (
        <div className="mb-12 small:mb-16">
          <div className="mb-6 small:mb-8 pb-4 small:pb-5 border-b border-ui-border-base">
            <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-2">Curated For You</p>
            <h2 className="text-2xl small:text-3xl font-normal text-ui-fg-base">
              Recommended Products
            </h2>
            <p className="text-sm text-ui-fg-subtle mt-2">
              Personalized picks based on your browsing and preferences
            </p>
          </div>
          
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: false,
                slidesToScroll: 1,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 small:-ml-4">
                {recommendations.map((rec, index) => {
                const product = products.find(p => p.id === rec.productId)
                if (!product) return null
                
                return (
                  <CarouselItem key={rec.productId} className="pl-3 small:pl-4 basis-[45%] xsmall:basis-[40%] small:basis-1/3 medium:basis-1/4 large:basis-1/5">
                    <div className="group/item h-full">
                      <div className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle border border-ui-border-base mb-3 small:mb-4 transition-all duration-300 hover:shadow-lg hover:border-ui-border-strong">
                        <ProductImage product={product} />
                        {index < 3 && (
                          <div className="absolute top-2 left-2 small:top-3 small:left-3 bg-ui-fg-base text-white px-2 py-1 small:px-2.5 small:py-1.5 text-xs font-medium rounded-sm shadow-md">
                            #{index + 1}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 small:p-3 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 small:w-4 small:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs small:text-sm text-white font-medium">
                              {Math.round(rec.score * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 small:gap-1.5">
                        <h3 className="text-sm small:text-base text-ui-fg-base group-hover/item:text-blue-600 transition-colors line-clamp-2 leading-snug font-medium">
                          {product.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base small:text-lg font-semibold text-ui-fg-base">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-ui-fg-muted line-through">
                            ${(product.price * 1.2).toFixed(2)}
                          </span>
                        </div>
                        {rec.explanation && (
                          <p className="text-xs text-ui-fg-subtle mt-1 line-clamp-2 leading-relaxed">
                            {rec.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          </div>
        </div>
      )}

      {/* Recently Viewed Section */}
      {browsedProducts.length > 0 && (
        <div className="mb-8 small:mb-12">
          <div className="mb-6 small:mb-8 pb-4 small:pb-5 border-b border-ui-border-base">
            <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-2">Continue Shopping</p>
            <h2 className="text-2xl small:text-3xl font-normal text-ui-fg-base">
              Recently Viewed
            </h2>
            <p className="text-sm text-ui-fg-subtle mt-2">
              Pick up where you left off
            </p>
          </div>
          
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: false,
                slidesToScroll: 1,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 small:-ml-4">
                {browsedProducts.map((product) => (
                <CarouselItem key={product.id} className="pl-3 small:pl-4 basis-[45%] xsmall:basis-[40%] small:basis-1/3 medium:basis-1/4 large:basis-1/5">
                  <div className="group/item h-full">
                    <div className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle border border-ui-border-base mb-3 small:mb-4 transition-all duration-300 hover:shadow-lg hover:border-ui-border-strong">
                      <ProductImage product={product} />
                      <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors duration-300" />
                    </div>
                    <div className="flex flex-col gap-1 small:gap-1.5">
                      <h3 className="text-sm small:text-base text-ui-fg-base group-hover/item:text-purple-600 transition-colors line-clamp-2 leading-snug font-medium">
                        {product.name}
                      </h3>
                      <span className="text-base small:text-lg font-semibold text-ui-fg-base">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.category && (
                        <span className="text-xs text-ui-fg-muted">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          </div>
        </div>
      )}
    </>
  )
}
