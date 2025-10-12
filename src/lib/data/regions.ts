"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

// Mock data for when backend is not available
const MOCK_REGIONS: HttpTypes.StoreRegion[] = [
  {
    id: "mock-region-us",
    name: "United States",
    currency_code: "usd",
    countries: [
      { id: "us", iso_2: "us", iso_3: "usa", name: "United States", display_name: "United States" },
      { id: "ca", iso_2: "ca", iso_3: "can", name: "Canada", display_name: "Canada" },
    ],
  } as any,
  {
    id: "mock-region-eu",
    name: "Europe",
    currency_code: "eur",
    countries: [
      { id: "gb", iso_2: "gb", iso_3: "gbr", name: "United Kingdom", display_name: "United Kingdom" },
      { id: "de", iso_2: "de", iso_3: "deu", name: "Germany", display_name: "Germany" },
      { id: "fr", iso_2: "fr", iso_3: "fra", name: "France", display_name: "France" },
    ],
  } as any,
]

const MOCK_MODE = !process.env.MEDUSA_BACKEND_URL

export const listRegions = async () => {
  if (MOCK_MODE) {
    return MOCK_REGIONS
  }

  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  if (MOCK_MODE) {
    return MOCK_REGIONS.find(r => r.id === id) || MOCK_REGIONS[0]
  }

  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

export const getDefaultRegion = async () => {
  return getRegion(DEFAULT_REGION)
}

export const getRegion = async (countryCode: string) => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("us")

    return region
  } catch (e: any) {
    return null
  }
}
