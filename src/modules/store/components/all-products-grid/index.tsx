"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getRecommendationDataFromCookie } from "@lib/util/recommendation-cookies"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  image?: string
  tags?: string[]
}

type SortOptions = "price_asc" | "price_desc"

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
            `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(
              product.name
            )}`
          )
        }
      } catch (error) {
        setImageUrl(
          `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(
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
      <div className="w-full h-full bg-ui-bg-subtle animate-pulse"></div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={product.name}
      className="w-full h-full object-cover"
    />
  )
}

export default function AllProductsGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const sortBy = (searchParams?.get("sortBy") as SortOptions) || "price_asc"

  useEffect(() => {
    const loadProducts = () => {
      const data = getRecommendationDataFromCookie()
      
      console.log('\n📦 ALL PRODUCTS GRID:')
      console.log('='.repeat(80))
      console.log('Cookie data:', data ? 'Found ✅' : 'Not found ❌')
      
      if (data) {
        console.log('Full cookie structure:', Object.keys(data))
        console.log('Has products?', !!data.products)
        console.log('Products type:', typeof data.products)
        console.log('Products value:', data.products)
      }
      
      if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
        console.log(`✅ Total products in cookie: ${data.products.length}`)
        let sortedProducts = [...data.products]
        
        // Apply sorting
        if (sortBy === "price_asc") {
          sortedProducts.sort((a, b) => a.price - b.price)
          console.log(`✅ Sorted ${sortedProducts.length} products by price (Low to High)`)
        } else if (sortBy === "price_desc") {
          sortedProducts.sort((a, b) => b.price - a.price)
          console.log(`✅ Sorted ${sortedProducts.length} products by price (High to Low)`)
        }
        
        setProducts(sortedProducts)
        setLoading(false)
      } else {
        console.log('❌ No products found in cookies')
        console.log('Reason:', !data ? 'No cookie data' : 
                    !data.products ? 'data.products is missing' :
                    !Array.isArray(data.products) ? 'data.products is not an array' :
                    data.products.length === 0 ? 'data.products is empty' : 'Unknown')
        setProducts([])
        setLoading(false)
      }
      
      console.log('='.repeat(80) + '\n')
    }

    loadProducts()

    // Listen for cart updates (when recommendations are generated)
    const handleCartUpdate = () => {
      console.log('🔄 Cart updated event received, reloading products...')
      loadProducts()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', handleCartUpdate)
    }

    // Reload when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, reloading products...')
        loadProducts()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Retry loading after a delay if no products found initially
    const retryTimer = setTimeout(() => {
      const currentData = getRecommendationDataFromCookie()
      if (!currentData?.products || currentData.products.length === 0) {
        console.log('🔄 Retrying to load products after 1s...')
        loadProducts()
      }
    }, 1000)

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cartUpdated', handleCartUpdate)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(retryTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy])

  if (loading) {
    return (
      <div className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-6 small:gap-x-6 small:gap-y-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-ui-bg-subtle mb-2 small:mb-3"></div>
            <div className="h-3 small:h-4 bg-ui-bg-subtle mb-2"></div>
            <div className="h-2 small:h-3 bg-ui-bg-subtle w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 small:py-12">
        <p className="text-sm small:text-base text-ui-fg-subtle mb-2 small:mb-4">No products available</p>
        <p className="text-xs text-ui-fg-muted">
          Generate recommendations to see products
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-6 small:gap-x-6 small:gap-y-8">
      {products.map((product) => (
        <li key={product.id}>
          <div className="group relative">
            <div className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle border border-ui-border-base mb-2 small:mb-3">
              <ProductImage product={product} />
            </div>
            <div className="flex flex-col gap-0.5 small:gap-1">
              <h3 className="text-xs small:text-sm text-ui-fg-base group-hover:text-ui-fg-subtle transition-colors line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-baseline gap-1 small:gap-2">
                <span className="text-xs small:text-sm font-medium text-ui-fg-base">
                  ${product.price.toFixed(2)}
                </span>
                {product.category && (
                  <span className="text-[10px] small:text-xs text-ui-fg-muted truncate">
                    {product.category}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-[10px] small:text-xs text-ui-fg-subtle mt-0.5 small:mt-1 line-clamp-2 hidden xsmall:block">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
