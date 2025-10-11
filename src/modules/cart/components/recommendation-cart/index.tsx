"use client"

import { useEffect, useState } from "react"
import { getCartItemsFromRecommendations, clearRecommendationData } from "@lib/util/recommendation-cookies"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface Product {
  id: string
  name: string
  category: string
  price: number
  description?: string
  tags?: string[]
  rating?: number
  image?: string
}

const ProductImage = ({ product }: { product: Product }) => {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImage = async () => {
      if (product.image && product.image.startsWith("http")) {
        setImageUrl(product.image)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/unsplash-image?query=${encodeURIComponent(product.name)}`
        )

        if (response.ok) {
          const data = await response.json()
          setImageUrl(data.url)
        } else {
          setImageUrl(
            `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=${encodeURIComponent(
              product.name
            )}`
          )
        }
      } catch (error) {
        setImageUrl(
          `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=${encodeURIComponent(
            product.name
          )}`
        )
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [product.name, product.image])

  if (loading) {
    return (
      <div className="w-24 h-24 bg-ui-bg-subtle animate-pulse rounded-md"></div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={product.name}
      className="w-24 h-24 object-cover rounded-md"
    />
  )
}

export default function RecommendationCart() {
  const [cartItems, setCartItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const handleClearCart = () => {
    clearRecommendationData()
  }

  useEffect(() => {
    const loadCartItems = () => {
      const items = getCartItemsFromRecommendations()
      console.log('\n📦 CART PAGE:')
      console.log('='.repeat(80))
      console.log(`Loaded ${items.length} items from recommendations`)
      if (items.length > 0) {
        items.forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. ${item.name} - $${item.price} (ID: ${item.id})`)
        })
      } else {
        console.log('❌ No items found in cart')
        // Log what's actually in the cookie for debugging
        const cookieData = require('@lib/util/recommendation-cookies').getRecommendationDataFromCookie()
        console.log('Cookie has data:', !!cookieData)
        if (cookieData) {
          console.log('Cookie has products:', !!cookieData.products)
          console.log('Cookie has recommendations:', !!cookieData.recommendations)
          console.log('User behavior cart items:', cookieData.userBehavior?.cartItems)
        }
      }
      console.log('='.repeat(80) + '\n')
      setCartItems(items)
      setLoading(false)
    }

    // Load immediately
    loadCartItems()

    // Listen for cart updates
    const handleCartUpdate = (event: any) => {
      console.log('📦 Cart update event received:', event.detail)
      loadCartItems()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', handleCartUpdate)
    }

    // Also reload when the component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Cart page became visible, reloading...')
        loadCartItems()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Reload after a short delay to catch any async cookie updates
    const timeoutId = setTimeout(() => {
      console.log('🔄 Delayed cart reload...')
      loadCartItems()
    }, 500)

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cartUpdated', handleCartUpdate)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(timeoutId)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-y-8 py-12">
        <div className="content-container">
          <div className="flex items-center justify-center py-12">
            <div className="text-ui-fg-subtle">Loading cart...</div>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col gap-y-8 py-12">
        <div className="content-container">
          <div className="flex flex-col items-center justify-center gap-y-4 py-12">
            <h1 className="text-2xl font-medium text-ui-fg-base">
              Your cart is empty
            </h1>
            <p className="text-ui-fg-subtle">
              Your cart will show items marked in your user behavior data.
            </p>
            <LocalizedClientLink
              href="/"
              className="mt-4 px-6 py-3 bg-ui-fg-base text-white rounded-md hover:bg-ui-fg-subtle transition-colors"
            >
              Get Recommendations
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="py-12">
      <div className="content-container">
        <h1 className="text-2xl font-medium text-ui-fg-base mb-8">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-8 gap-y-8">
          {/* Cart Items */}
          <div className="flex flex-col gap-y-4">
            <div className="text-sm text-ui-fg-subtle mb-2">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in cart (from user behavior data)
            </div>
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-x-4 p-4 border border-ui-border-base rounded-md bg-white"
              >
                <ProductImage product={item} />
                <div className="flex flex-col flex-1 gap-y-2">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-base font-medium text-ui-fg-base">
                        {item.name}
                      </h3>
                      <p className="text-sm text-ui-fg-subtle">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-base font-medium text-ui-fg-base">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-ui-fg-subtle line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="relative">
            <div className="flex flex-col gap-y-6 sticky top-12 p-6 border border-ui-border-base rounded-md bg-white">
              <h2 className="text-lg font-medium text-ui-fg-base">Summary</h2>
              
              <div className="flex flex-col gap-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ui-fg-subtle">Subtotal</span>
                  <span className="text-ui-fg-base">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ui-fg-subtle">Shipping</span>
                  <span className="text-ui-fg-base">Calculated at checkout</span>
                </div>
                <div className="h-px bg-ui-border-base my-2"></div>
                <div className="flex justify-between">
                  <span className="font-medium text-ui-fg-base">Total</span>
                  <span className="font-medium text-ui-fg-base">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                className="w-full px-6 py-3 bg-ui-fg-base text-white rounded-md hover:bg-ui-fg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                Checkout (Demo)
              </button>

              <button
                onClick={handleClearCart}
                className="w-full px-6 py-3 border border-ui-border-base text-ui-fg-base rounded-md hover:bg-ui-bg-subtle transition-colors"
              >
                Clear Cart
              </button>

              <p className="text-xs text-ui-fg-muted text-center">
                Items based on user behavior data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
