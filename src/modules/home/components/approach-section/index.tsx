export default function ApproachSection() {
  return (
    <div className="py-12 md:py-16 bg-ui-bg-subtle">
      <div className="content-container">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-8 md:mb-12">
            <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
              Methodology
            </p>
            <h2 className="text-2xl md:text-3xl font-normal text-ui-fg-base mb-3">
              Hybrid Recommendation Approach
            </h2>
            <p className="text-sm md:text-base text-ui-fg-subtle max-w-2xl">
              Adaptive algorithm combining 3-5 methods based on available data, powered by AI explanations for transparent, personalized suggestions.
            </p>
          </div>

          {/* Algorithm Cards - Adaptive Grid Layout */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* User-Based Collaborative Filtering */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
                25% Weight (Multi-User)
              </p>
              <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                User-Based Collaborative
              </h3>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Finds similar users and recommends what they liked using engagement scoring.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-center gap-2">
                  <span>-</span>
                  User similarity matching
                </li>
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Category interest overlap
                </li>
              </ul>
            </div>

            {/* Item-Based Collaborative Filtering */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
                20-40% Weight
              </p>
              <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                Item-Based Collaborative
              </h3>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Analyzes user preferences to predict product affinity based on category and price patterns.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Category preference profiling
                </li>
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Price range similarity
                </li>
              </ul>
            </div>

            {/* Content-Based Filtering */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
                20-30% Weight
              </p>
              <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                Content-Based
              </h3>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Matches product attributes weighted by user engagement to find similar items.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Category & tag matching
                </li>
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Price & description similarity
                </li>
              </ul>
            </div>

            {/* Context-Aware Rules */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
                20-30% Weight
              </p>
              <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                Context-Aware
              </h3>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Applies behavioral signals, device context, and time-based rules for smarter recommendations.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Engagement-based scoring
                </li>
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Device & time context
                </li>
              </ul>
            </div>

            {/* Category Popularity */}
            <div className="sm:col-span-2 lg:col-span-4 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
                15% Weight (Multi-User)
              </p>
              <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                Category Popularity
              </h3>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Recommends trending products in categories the user is interested in.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Popularity across users
                </li>
                <li className="flex items-center gap-2">
                  <span>-</span>
                  Category interest weighting
                </li>
              </ul>
            </div>
          </div>

          {/* AI-Powered Section - 2 columns with AI spanning 2 */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* AI-Powered Explanations - Spans 2 columns */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
                  POWERED BY GOOGLE GEMINI
                </p>
                <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                  AI-Powered Explanations
                </h3>
                <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                  Personalized explanations for each recommendation with context and transparency.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm text-ui-fg-subtle">
                  <div className="flex items-center gap-2">
                    <span>-</span>
                    Context-aware reasoning
                  </div>
                  <div className="flex items-center gap-2">
                    <span>-</span>
                    Natural language generation
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="lg:col-span-1 bg-ui-bg-base border border-ui-border-base p-4 md:p-6">
              <p className="text-xs text-ui-fg-muted mb-3 md:mb-4 uppercase tracking-wide">System Overview</p>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-medium text-ui-fg-base">3-5</p>
                  <p className="text-xs text-ui-fg-subtle">Adaptive Algorithms</p>
                </div>
                <div>
                  <p className="text-2xl font-medium text-ui-fg-base">100%</p>
                  <p className="text-xs text-ui-fg-subtle">Dynamic Recommendations</p>
                </div>
                <div>
                  <p className="text-2xl font-medium text-ui-fg-base">AI</p>
                  <p className="text-xs text-ui-fg-subtle">Powered Insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Process Flow - Mobile-Optimized */}
          <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-ui-border-base">
            <div className="max-w-5xl mx-0 sm:mx-auto">
              <p className="text-xs text-ui-fg-muted mb-8 md:mb-10 uppercase tracking-wide text-left sm:text-center">
                Process Flow
              </p>
              
              {/* Mobile: Vertical Layout, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-0 sm:gap-6">
                {/* Step 1 */}
                <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mb-4 border-2 border-ui-border-base flex items-center justify-center bg-white flex-shrink-0 relative">
                    <span className="text-base sm:text-lg font-medium text-ui-fg-base">1</span>
                  </div>
                  <div className="flex-1 sm:text-center">
                    <p className="text-base sm:text-sm text-ui-fg-base font-medium mb-1">Input</p>
                    <p className="text-sm sm:text-xs text-ui-fg-subtle">Data entry</p>
                  </div>
                </div>

                {/* Connector */}
                <div className="w-12 h-6 sm:w-auto sm:h-auto flex items-center justify-center sm:block">
                  <div className="w-0.5 h-full sm:w-auto sm:h-auto bg-ui-border-base sm:bg-transparent">
                    <svg className="hidden sm:block w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mb-4 border-2 border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-base sm:text-lg font-medium text-ui-fg-base">2</span>
                  </div>
                  <div className="flex-1 sm:text-center">
                    <p className="text-base sm:text-sm text-ui-fg-base font-medium mb-1">Parse</p>
                    <p className="text-sm sm:text-xs text-ui-fg-subtle">LLM processing</p>
                  </div>
                </div>

                {/* Connector */}
                <div className="w-12 h-6 sm:w-auto sm:h-auto flex items-center justify-center sm:block">
                  <div className="w-0.5 h-full sm:w-auto sm:h-auto bg-ui-border-base sm:bg-transparent">
                    <svg className="hidden sm:block w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mb-4 border-2 border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-base sm:text-lg font-medium text-ui-fg-base">3</span>
                  </div>
                  <div className="flex-1 sm:text-center">
                    <p className="text-base sm:text-sm text-ui-fg-base font-medium mb-1">Analyze</p>
                    <p className="text-sm sm:text-xs text-ui-fg-subtle">Hybrid algorithm</p>
                  </div>
                </div>

                {/* Connector */}
                <div className="w-12 h-6 sm:w-auto sm:h-auto flex items-center justify-center sm:block">
                  <div className="w-0.5 h-full sm:w-auto sm:h-auto bg-ui-border-base sm:bg-transparent">
                    <svg className="hidden sm:block w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mb-4 border-2 border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-base sm:text-lg font-medium text-ui-fg-base">4</span>
                  </div>
                  <div className="flex-1 sm:text-center">
                    <p className="text-base sm:text-sm text-ui-fg-base font-medium mb-1">Explain</p>
                    <p className="text-sm sm:text-xs text-ui-fg-subtle">AI insights</p>
                  </div>
                </div>

                {/* Connector */}
                <div className="w-12 h-6 sm:w-auto sm:h-auto flex items-center justify-center sm:block">
                  <div className="w-0.5 h-full sm:w-auto sm:h-auto bg-ui-border-base sm:bg-transparent">
                    <svg className="hidden sm:block w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mb-4 border-2 border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-base sm:text-lg font-medium text-ui-fg-base">5</span>
                  </div>
                  <div className="flex-1 sm:text-center">
                    <p className="text-base sm:text-sm text-ui-fg-base font-medium mb-1">Recommend</p>
                    <p className="text-sm sm:text-xs text-ui-fg-subtle">Final results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
