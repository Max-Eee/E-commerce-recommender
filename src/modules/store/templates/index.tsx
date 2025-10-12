import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import RecommendationsSection from "../components/recommendations-section"
import AllProductsGrid from "../components/all-products-grid"

const StoreTemplate = ({
  sortBy,
  page,
}: {
  sortBy?: SortOptions
  page?: string
}) => {
  const sort = sortBy || "price_asc"

  return (
    <div
      className="flex flex-col py-4 small:py-6 content-container"
      data-testid="category-container"
    >
      {/* Recommendations Section */}
      <div className="w-full mb-8 small:mb-12">
        <RecommendationsSection />
      </div>
      
      {/* Browse All Section with Sticky Sort */}
      <div className="flex flex-col small:flex-row small:items-start gap-0 small:gap-6">
        {/* Sticky Sort Panel */}
        <RefinementList sortBy={sort} />
        
        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 small:mb-8 pb-4 small:pb-6 border-b border-ui-border-base">
            <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1 small:mb-2">Browse All</p>
            <h1 className="text-xl small:text-2xl font-normal text-ui-fg-base" data-testid="store-page-title">
              All Products
            </h1>
          </div>
          
          <AllProductsGrid />
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
