import { Recommendation } from "../../../../types/recommendation"

export default function RecommendationCard({
  recommendation,
  rank,
}: {
  recommendation: Recommendation
  rank: number
}) {
  const { product, score, explanation, recommendationType } = recommendation

  const typeColors = {
    collaborative: "bg-blue-100 text-blue-700 border-blue-200",
    "content-based": "bg-purple-100 text-purple-700 border-purple-200",
    trending: "bg-pink-100 text-pink-700 border-pink-200",
    hybrid: "bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 border-blue-200",
  }

  const typeLabels = {
    collaborative: "Similar Users",
    "content-based": "Similar Products",
    trending: "Trending",
    hybrid: "Hybrid Match",
  }

  const typeIcons = {
    collaborative: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    "content-based": (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    trending: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    hybrid: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border-2 border-blue-200 relative">
      {/* Rank Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">#{rank}</span>
        </div>
      </div>

      {/* Score Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-full px-3 py-1 shadow-lg border border-gray-200">
          <span className="text-sm font-bold text-gray-900">
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Product Image */}
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-300 text-center p-8">
            <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium text-gray-400">{product.name}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Type Badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${typeColors[recommendationType]}`}>
            {typeIcons[recommendationType]}
            {typeLabels[recommendationType]}
          </span>
        </div>

        {/* Product Info */}
        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
            {product.category}
          </span>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AI Explanation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Why we recommend this:
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
          View Details
        </button>
      </div>
    </div>
  )
}
