"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveRecommendationDataToCookie, clearRecommendationData } from "@lib/util/recommendation-cookies"
import { toast } from "@medusajs/ui"

export default function InputSection({ countryCode }: { countryCode: string }) {
  const router = useRouter()
  const [inputMethod, setInputMethod] = useState<"text" | "json">("text")
  const [productsInput, setProductsInput] = useState("")
  const [userBehaviorInput, setUserBehaviorInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStatus, setCurrentStatus] = useState("")

  const handleFileUpload = (file: File, type: "products" | "userBehavior") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (type === "products") {
        setProductsInput(content)
      } else {
        setUserBehaviorInput(content)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    
    // Show toast notification about LLM parsing
    toast.info("LLM parsing is being used - this might take a minute to convert the data into a valid format", {
      duration: 5000,
    })
    
    // Clear previous recommendations before generating new ones
    console.log('\n🔄 Clearing previous recommendations...')
    clearRecommendationData()
    
    setCurrentStatus("Processing input...")

    try {
      const inputType = inputMethod === "text" ? "natural" : "json"
      
      setCurrentStatus("Parsing data with LLM...")
      
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productsInput,
          userBehaviorInput,
          inputType,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to generate recommendations")
      }

      console.log('\n✅ API RESPONSE RECEIVED:')
      console.log('='.repeat(80))
      console.log(`📊 Data structure:`, {
        recommendations: data.data.recommendations?.length || 0,
        products: data.data.products?.length || 0,
        cartItems: data.data.userBehavior?.cartItems?.length || 0,
      })
      console.log('Cart Item IDs:', data.data.userBehavior?.cartItems)
      console.log('Full user behavior:', data.data.userBehavior)
      console.log('='.repeat(80) + '\n')

      setCurrentStatus("Analyzing with hybrid algorithm...")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCurrentStatus("Generating AI insights...")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCurrentStatus("Finalizing recommendations...")
      
      console.log('\n🔄 About to save to cookies...')
      console.log('Data being saved:', {
        recommendations: data.data.recommendations?.length,
        products: data.data.products?.length,
        userBehavior: data.data.userBehavior,
      })
      
      // Store results in cookies and sessionStorage
      saveRecommendationDataToCookie(data.data)
      
      console.log('\n✅ Data saved! Verifying...')
      // Verify the data was saved
      const { getRecommendationDataFromCookie } = await import("@lib/util/recommendation-cookies")
      const verified = getRecommendationDataFromCookie()
      console.log('Verified cookie data:', {
        hasData: !!verified,
        cartItemsCount: verified?.userBehavior?.cartItems?.length || 0,
        cartItems: verified?.userBehavior?.cartItems,
      })
      
      setCurrentStatus("Complete! Redirecting...")
      
      // Navigate after a brief delay to show completion
      setTimeout(() => {
        router.push(`/${countryCode}/store`)
      }, 500)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setCurrentStatus("")
    }
  }

  const loadSampleData = () => {
    if (inputMethod === "text") {
      setProductsInput(
        "I have 5 products: A laptop for $999, a wireless mouse for $29, a mechanical keyboard for $89, a laptop bag for $49, and a USB-C hub for $39. All are tech accessories."
      )
      setUserBehaviorInput(
        "User1 viewed the laptop and keyboard, added the mouse to cart, and purchased a similar laptop last month. User2 viewed the mouse and USB-C hub, added the keyboard to cart, but did not purchase anything."
      )
    } else {
      setProductsInput(JSON.stringify([
        {
          id: "laptop-1",
          name: "Professional Laptop",
          description: "High-performance laptop for professionals",
          category: "Electronics",
          price: 999,
          tags: ["laptop", "computer", "tech"]
        },
        {
          id: "mouse-1",
          name: "Wireless Mouse",
          description: "Ergonomic wireless mouse",
          category: "Electronics",
          price: 29,
          tags: ["mouse", "accessory", "wireless"]
        },
        {
          id: "keyboard-1",
          name: "Mechanical Keyboard",
          description: "RGB mechanical keyboard",
          category: "Electronics",
          price: 89,
          tags: ["keyboard", "accessory", "gaming"]
        },
        {
          id: "headphones-1",
          name: "Noise Cancelling Headphones",
          description: "Premium wireless headphones with active noise cancellation",
          category: "Electronics",
          price: 299,
          tags: ["headphones", "audio", "wireless"]
        },
        {
          id: "monitor-1",
          name: "4K Monitor",
          description: "27-inch 4K UHD monitor for professionals",
          category: "Electronics",
          price: 449,
          tags: ["monitor", "display", "4k"]
        },
        {
          id: "webcam-1",
          name: "HD Webcam",
          description: "1080p webcam for video calls and streaming",
          category: "Electronics",
          price: 79,
          tags: ["webcam", "camera", "streaming"]
        },
        {
          id: "desk-lamp-1",
          name: "LED Desk Lamp",
          description: "Adjustable LED desk lamp with multiple brightness levels",
          category: "Furniture",
          price: 59,
          tags: ["lamp", "lighting", "desk"]
        },
        {
          id: "chair-1",
          name: "Ergonomic Office Chair",
          description: "Premium ergonomic chair with lumbar support",
          category: "Furniture",
          price: 399,
          tags: ["chair", "furniture", "office"]
        }
      ], null, 2))
      setUserBehaviorInput(JSON.stringify({
        userId: "user123",
        productInteractions: {
          "laptop-1": {
            productId: "laptop-1",
            viewDuration: 180,
            viewCount: 5,
            interactions: {
              sizeSelected: false,
              colorSelected: true,
              imageZoomed: true,
              descriptionRead: true,
              reviewsRead: true
            },
            cartActions: {
              addedToCart: Date.now() - 3600000,
              timesAddedToCart: 3,
              removedFromCart: Date.now() - 1800000,
              timesRemovedFromCart: 1
            },
            checkoutActions: {
              proceededToCheckout: true,
              completedPurchase: false,
              purchaseCount: 0
            },
            rating: 4,
            timestamp: Date.now() - 7200000
          },
          "mouse-1": {
            productId: "mouse-1",
            viewDuration: 45,
            viewCount: 2,
            interactions: {
              sizeSelected: false,
              colorSelected: true,
              imageZoomed: false,
              descriptionRead: true,
              reviewsRead: false
            },
            cartActions: {
              addedToCart: Date.now() - 86400000,
              timesAddedToCart: 1,
              removedFromCart: null,
              timesRemovedFromCart: 0
            },
            checkoutActions: {
              proceededToCheckout: true,
              completedPurchase: true,
              purchaseCount: 2
            },
            rating: 5,
            timestamp: Date.now() - 172800000
          },
          "keyboard-1": {
            productId: "keyboard-1",
            viewDuration: 90,
            viewCount: 3,
            interactions: {
              sizeSelected: false,
              colorSelected: false,
              imageZoomed: true,
              descriptionRead: true,
              reviewsRead: true
            },
            cartActions: {
              addedToCart: null,
              timesAddedToCart: 0
            },
            checkoutActions: {
              proceededToCheckout: false,
              completedPurchase: false,
              purchaseCount: 0
            },
            timestamp: Date.now() - 14400000
          },
          "monitor-1": {
            productId: "monitor-1",
            viewDuration: 120,
            viewCount: 4,
            interactions: {
              sizeSelected: true,
              colorSelected: false,
              imageZoomed: true,
              descriptionRead: true,
              reviewsRead: true
            },
            cartActions: {
              addedToCart: Date.now() - 1800000,
              timesAddedToCart: 1
            },
            checkoutActions: {
              proceededToCheckout: false,
              completedPurchase: false,
              purchaseCount: 0
            },
            timestamp: Date.now() - 3600000
          }
        },
        sessionDuration: 1200,
        deviceType: "desktop",
        timeOfDay: "evening",
        searchQueries: ["laptop accessories", "work from home setup", "ergonomic mouse"],
        viewedProducts: ["laptop-1", "keyboard-1", "headphones-1", "monitor-1"],
        purchasedProducts: ["mouse-1"],
        cartItems: ["monitor-1", "laptop-1"],
        ratings: {
          "mouse-1": 5,
          "laptop-1": 4
        }
      }, null, 2))
    }
  }

  return (
    <div className="content-container py-16 bg-ui-bg-base">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-ui-fg-muted text-xs mb-3 tracking-wide uppercase">
            Data Input
          </p>
          <h2 className="text-3xl font-normal text-ui-fg-base mb-3">
            Input Your Data
          </h2>
          <p className="text-ui-fg-subtle max-w-2xl">
            Provide your product catalog and user behavior data using natural language, 
            JSON format, or file upload.
          </p>
        </div>

        {/* Input Method Selection */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setInputMethod("text")}
            className={`px-6 py-2.5 border font-medium transition-all text-sm ${
              inputMethod === "text"
                ? "bg-ui-fg-base text-white border-ui-fg-base"
                : "bg-white text-ui-fg-base border-ui-border-base hover:border-ui-fg-subtle"
            }`}
          >
            Natural Language
          </button>
          <button
            onClick={() => setInputMethod("json")}
            className={`px-6 py-2.5 border font-medium transition-all text-sm ${
              inputMethod === "json"
                ? "bg-ui-fg-base text-white border-ui-fg-base"
                : "bg-white text-ui-fg-base border-ui-border-base hover:border-ui-fg-subtle"
            }`}
          >
            JSON / Upload Files
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Products Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-ui-border-base">
              <h3 className="text-base font-medium text-ui-fg-base">
                Product Catalog
              </h3>
              {inputMethod === "json" && (
                <label className="px-4 py-1.5 border border-ui-border-base bg-white text-ui-fg-base cursor-pointer hover:border-ui-fg-subtle transition-colors text-sm">
                  Upload JSON
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "products")
                    }}
                  />
                </label>
              )}
            </div>
            <textarea
              value={productsInput}
              onChange={(e) => setProductsInput(e.target.value)}
              placeholder={
                inputMethod === "text"
                  ? "Describe your products in natural language...\nExample: I have 5 products: A laptop for $999, a mouse for $29..."
                  : 'Enter JSON array of products or upload a JSON file...\n[{"id": "1", "name": "Laptop", "price": 999, ...}]'
              }
              className="w-full h-64 p-4 border border-ui-border-base bg-white focus:outline-none focus:border-ui-fg-subtle font-mono text-sm text-ui-fg-base placeholder:text-ui-fg-muted"
            />
          </div>

          {/* User Behavior Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-ui-border-base">
              <h3 className="text-base font-medium text-ui-fg-base">
                User Behavior
              </h3>
              {inputMethod === "json" && (
                <label className="px-4 py-1.5 border border-ui-border-base bg-white text-ui-fg-base cursor-pointer hover:border-ui-fg-subtle transition-colors text-sm">
                  Upload JSON
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "userBehavior")
                    }}
                  />
                </label>
              )}
            </div>
            <textarea
              value={userBehaviorInput}
              onChange={(e) => setUserBehaviorInput(e.target.value)}
              placeholder={
                inputMethod === "text"
                  ? "Describe user behavior in natural language...\nExample: User viewed laptop and mouse, added keyboard to cart..."
                  : 'Enter JSON object or upload a JSON file...\n{"userId": "123", "viewedProducts": ["1"], ...}'
              }
              className="w-full h-64 p-4 border border-ui-border-base bg-white focus:outline-none focus:border-ui-fg-subtle font-mono text-sm text-ui-fg-base placeholder:text-ui-fg-muted"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={loadSampleData}
            className="px-6 py-2.5 border border-ui-border-base bg-white text-ui-fg-base hover:border-ui-fg-subtle transition-colors text-sm font-medium"
          >
            Load Sample Data
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !productsInput || !userBehaviorInput}
            className="px-8 py-2.5 bg-ui-fg-base text-white hover:bg-ui-fg-subtle transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-ui-fg-base min-w-[240px]"
          >
            {loading ? currentStatus : "Generate Recommendations"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-ui-bg-base border border-ui-border-base text-ui-fg-base text-center text-sm">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
      </div>
    </div>
  )
}
