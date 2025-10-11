"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

// Mock data for when backend is not available
const MOCK_COLLECTIONS: HttpTypes.StoreCollection[] = [
  {
    id: "mock-collection-1",
    title: "Sample Collection",
    handle: "sample-collection",
    products: [],
  } as any,
]

const MOCK_MODE = !process.env.MEDUSA_BACKEND_URL

export const retrieveCollection = async (id: string) => {
  if (MOCK_MODE) {
    return MOCK_COLLECTIONS.find(c => c.id === id) || MOCK_COLLECTIONS[0]
  }

  const next = {
    ...(await getCacheOptions("collections")),
  }

  return sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`,
      {
        next,
        cache: "force-cache",
      }
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  if (MOCK_MODE) {
    return { collections: MOCK_COLLECTIONS, count: MOCK_COLLECTIONS.length }
  }

  const next = {
    ...(await getCacheOptions("collections")),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query: queryParams,
        next,
        cache: "force-cache",
      }
    )
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection> => {
  if (MOCK_MODE) {
    return MOCK_COLLECTIONS.find(c => c.handle === handle) || MOCK_COLLECTIONS[0]
  }

  const next = {
    ...(await getCacheOptions("collections")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "*products" },
      next,
      cache: "force-cache",
    })
    .then(({ collections }) => collections[0])
}
