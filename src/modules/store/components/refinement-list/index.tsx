"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"

import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  'data-testid'?: string
}

const RefinementList = ({ sortBy, 'data-testid': dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
    setIsOpen(false) // Close mobile dropdown after selection
  }

  return (
    <>
      {/* Mobile: Dropdown Button */}
      <div className="small:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-3 bg-ui-bg-subtle border border-ui-border-base hover:bg-ui-bg-base transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span className="text-sm font-medium text-ui-fg-base">Sort & Filter</span>
          </div>
          <svg 
            className={`w-5 h-5 text-ui-fg-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Mobile Dropdown Content */}
        {isOpen && (
          <div className="mt-2 p-4 bg-ui-bg-subtle border border-ui-border-base">
            <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
          </div>
        )}
      </div>

      {/* Desktop: Sticky Sidebar */}
      <div className="hidden small:block sticky top-20 self-start min-w-[240px] max-w-[240px]">
        <div className="py-4">
          <div className="flex items-center gap-2 mb-4 pb-3">
            <svg className="w-4 h-4 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <h3 className="text-sm font-medium text-ui-fg-base uppercase tracking-wide">Filters</h3>
          </div>
          <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
        </div>
      </div>
    </>
  )
}

export default RefinementList
