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
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                    User-Based Collaborative
                  </h3>
                  <p className="text-xs text-blue-600 font-medium">25% Weight (Multi-User)</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Finds similar users and recommends what they liked using engagement scoring.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  User similarity matching
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  Category interest overlap
                </li>
              </ul>
            </div>

            {/* Item-Based Collaborative Filtering */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                    Item-Based Collaborative
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium">20-40% Weight</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Analyzes user preferences to predict product affinity based on category and price patterns.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  Category preference profiling
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  Price range similarity
                </li>
              </ul>
            </div>

            {/* Content-Based Filtering */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                    Content-Based
                  </h3>
                  <p className="text-xs text-purple-600 font-medium">20-30% Weight</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Matches product attributes weighted by user engagement to find similar items.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  Category & tag matching
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  Price & description similarity
                </li>
              </ul>
            </div>

            {/* Context-Aware Rules */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                    Context-Aware
                  </h3>
                  <p className="text-xs text-pink-600 font-medium">20-30% Weight</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Applies behavioral signals, device context, and time-based rules for smarter recommendations.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">•</span>
                  Engagement-based scoring
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">•</span>
                  Device & time context
                </li>
              </ul>
            </div>

            {/* Category Popularity */}
            <div className="sm:col-span-2 lg:col-span-4 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                    Category Popularity
                  </h3>
                  <p className="text-xs text-amber-600 font-medium">15% Weight (Multi-User)</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                Recommends trending products in categories the user is interested in.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-ui-fg-subtle">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Popularity across users
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Category interest weighting
                </li>
              </ul>
            </div>
          </div>

          {/* AI-Powered Section - 2 columns with AI spanning 2 */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* AI-Powered Explanations - Spans 2 columns */}
            <div className="lg:col-span-2 bg-white border border-ui-border-base p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-medium text-ui-fg-base mb-1">
                    AI-Powered Explanations
                  </h3>
                  <p className="text-xs text-green-600 font-medium mb-2 md:mb-3">Powered by Google Gemini</p>
                  <p className="text-xs md:text-sm text-ui-fg-subtle mb-3 md:mb-4">
                    Personalized explanations for each recommendation with context and transparency.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <div className="text-xs md:text-sm text-ui-fg-subtle">Context-aware reasoning</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <div className="text-xs md:text-sm text-ui-fg-subtle">Natural language generation</div>
                    </div>
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
                  <p className="text-xs text-ui-fg-subtle">Transparent Results</p>
                </div>
                <div>
                  <p className="text-2xl font-medium text-ui-fg-base">AI</p>
                  <p className="text-xs text-ui-fg-subtle">Powered Insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Process Flow - Clean Horizontal */}
          <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-ui-border-base">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs text-ui-fg-muted mb-6 md:mb-10 uppercase tracking-wide text-center">
                Process Flow
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                {/* Step 1 */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-0 w-full sm:w-auto max-w-[200px] sm:max-w-none">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 sm:mb-4 border border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-sm sm:text-base font-medium text-ui-fg-base">1</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ui-fg-base mb-0.5 sm:mb-1">Input</p>
                    <p className="text-xs text-ui-fg-subtle">Data entry</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center pt-6">
                  <svg className="w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-0 w-full sm:w-auto max-w-[200px] sm:max-w-none">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 sm:mb-4 border border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-sm sm:text-base font-medium text-ui-fg-base">2</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ui-fg-base mb-0.5 sm:mb-1">Parse</p>
                    <p className="text-xs text-ui-fg-subtle">LLM processing</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center pt-6">
                  <svg className="w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-0 w-full sm:w-auto max-w-[200px] sm:max-w-none">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 sm:mb-4 border border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-sm sm:text-base font-medium text-ui-fg-base">3</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ui-fg-base mb-0.5 sm:mb-1">Analyze</p>
                    <p className="text-xs text-ui-fg-subtle">Hybrid algorithm</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center pt-6">
                  <svg className="w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Step 4 */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-0 w-full sm:w-auto max-w-[200px] sm:max-w-none">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 sm:mb-4 border border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-sm sm:text-base font-medium text-ui-fg-base">4</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ui-fg-base mb-0.5 sm:mb-1">Explain</p>
                    <p className="text-xs text-ui-fg-subtle">AI insights</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center pt-6">
                  <svg className="w-6 h-6 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Step 5 */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-0 w-full sm:w-auto max-w-[200px] sm:max-w-none">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 sm:mb-4 border border-ui-border-base flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-sm sm:text-base font-medium text-ui-fg-base">5</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ui-fg-base mb-0.5 sm:mb-1">Recommend</p>
                    <p className="text-xs text-ui-fg-subtle">Final results</p>
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
