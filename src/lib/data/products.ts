"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

const MOCK_MODE = !process.env.MEDUSA_BACKEND_URL

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams
}> => {
  if (MOCK_MODE) {
    // In mock mode, try to get products from recommendation data stored in cookies
    const { getRecommendationDataFromCookie } = await import("@lib/util/recommendation-cookies")
    const recommendationData = getRecommendationDataFromCookie()
    
    if (recommendationData?.products && recommendationData.products.length > 0) {
      // Convert our Product type to StoreProduct type for display
      const mockProducts = recommendationData.products.map((p: any) => ({
        id: p.id,
        title: p.name,
        handle: p.id,
        description: p.description,
        thumbnail: p.image || null,
        variants: [{
          id: `${p.id}-variant`,
          title: 'Default',
          calculated_price: {
            calculated_amount: p.price * 100, // convert to cents
            original_amount: p.price * 100,
          },
          inventory_quantity: 10,
        }],
        categories: p.category ? [{ name: p.category }] : [],
        tags: p.tags?.map((t: string) => ({ value: t })) || [],
        metadata: {},
      })) as unknown as HttpTypes.StoreProduct[]
      
      // Apply pagination
      const limit = queryParams?.limit || 12
      const offset = pageParam > 1 ? (pageParam - 1) * limit : 0
      const paginatedProducts = mockProducts.slice(offset, offset + limit)
      const nextPage = mockProducts.length > offset + limit ? pageParam + 1 : null
      
      return {
        response: { products: paginatedProducts, count: mockProducts.length },
        nextPage,
        queryParams,
      }
    }
    
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }

  if (!countryCode && !regionId) {
    // Use default region if neither countryCode nor regionId is provided
    const { getDefaultRegion } = await import("./regions")
    const defaultRegion = await getDefaultRegion()
    if (defaultRegion) {
      regionId = defaultRegion.id
    }
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else if (regionId) {
    region = await retrieveRegion(regionId!)
  } else {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "price_asc",
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
