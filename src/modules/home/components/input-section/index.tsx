"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveRecommendationDataToCookie, clearRecommendationData } from "@lib/util/recommendation-cookies"
import { toast } from "@medusajs/ui"

export default function InputSection() {
  const router = useRouter()
  const [inputMethod, setInputMethod] = useState<"text" | "json">("json")
  
  // Separate state for each input method
  const [jsonProductsInput, setJsonProductsInput] = useState("")
  const [jsonUserBehaviorInput, setJsonUserBehaviorInput] = useState("")
  const [textProductsInput, setTextProductsInput] = useState("")
  const [textUserBehaviorInput, setTextUserBehaviorInput] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStatus, setCurrentStatus] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const [targetUserId, setTargetUserId] = useState("")
  const [showUserSelection, setShowUserSelection] = useState(false)
  const [detectedUsers, setDetectedUsers] = useState<string[]>([])
  const [parsedProductsFromDetection, setParsedProductsFromDetection] = useState<any | null>(null)
  const [parsedUserBehaviorFromDetection, setParsedUserBehaviorFromDetection] = useState<any | null>(null)

  // Use the appropriate state based on input method
  const productsInput = inputMethod === "json" ? jsonProductsInput : textProductsInput
  const userBehaviorInput = inputMethod === "json" ? jsonUserBehaviorInput : textUserBehaviorInput
  
  const setProductsInput = (value: string) => {
    if (inputMethod === "json") {
      setJsonProductsInput(value)
    } else {
      setTextProductsInput(value)
    }
  }
  
  const setUserBehaviorInput = (value: string) => {
    if (inputMethod === "json") {
      setJsonUserBehaviorInput(value)
    } else {
      setTextUserBehaviorInput(value)
    }
  }

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
    
    // For JSON input, detect users immediately before parsing
    if (inputMethod === "json") {
      // Detect users from JSON input
      let users: string[] = []
      try {
        const parsed = JSON.parse(userBehaviorInput)
        if (Array.isArray(parsed)) {
          // Multiple user objects in array
          users = parsed.map((u: any) => u.userId).filter(Boolean)
        } else if (parsed.userId) {
          // Single user object
          users = [parsed.userId]
        }
      } catch (e) {
        // If parsing fails, continue without user detection
      }

      // If multiple users detected, show selection modal
      if (users.length > 1) {
        setDetectedUsers(users)
        setShowUserSelection(true)
        return
      } else if (users.length === 1) {
        setTargetUserId(users[0])
      }

      // Proceed with submission
      await executeSubmit(users.length === 1 ? users[0] : "")
    } else {
      // Natural language - need to parse first to detect users
      // The API will parse and return detected users
      await detectUsersFromNaturalLanguage()
    }
  }

  const detectUsersFromNaturalLanguage = async () => {
    setError("")
    setLoading(true)
    
    toast.info("Using AI to understand your data - detecting users...", {
      duration: 4000,
    })
    
    setCurrentStatus("Parsing with AI")

    try {
      const response = await fetch("/api/recommendations/detect-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productsInput,
          userBehaviorInput,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to detect users")
      }

      const users: string[] = data.users || []
      const parsedProducts = data.parsedProducts || null
      const parsedUserBehavior = data.parsedUserBehavior || null
      // store parsed payloads for reuse
      setParsedProductsFromDetection(parsedProducts)
      setParsedUserBehaviorFromDetection(parsedUserBehavior)
      
      setLoading(false)
      setCurrentStatus("")

      // If multiple users detected, show selection modal
      if (users.length > 1) {
        setDetectedUsers(users)
        setShowUserSelection(true)
        return
      } else if (users.length === 1) {
        setTargetUserId(users[0])
      }

  // Proceed with full recommendation generation, pass parsed payloads if available
  await executeSubmit(users.length === 1 ? users[0] : "", parsedProducts, parsedUserBehavior)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setCurrentStatus("")
    }
  }

  const executeSubmit = async (selectedUserId: string = "", parsedProducts: any = null, parsedUserBehavior: any = null) => {
    setError("")
    setLoading(true)
    setShowUserSelection(false)
    
    // Show different toast based on input method
    if (inputMethod === "json") {
      toast.info("Processing your data - trying manual parsing first, AI fallback if needed", {
        duration: 4000,
      })
    } else {
      toast.info("Generating personalized recommendations for selected user", {
        duration: 4000,
      })
    }
    
    // Clear previous recommendations before generating new ones
    console.log('\n🔄 Clearing previous recommendations')
    clearRecommendationData()
    
    setCurrentStatus("Generating recommendations")

    try {
      const inputType = inputMethod === "text" ? "natural" : "json"
      
      // Status messages
      if (inputMethod === "text") {
        setCurrentStatus("Running hybrid recommendation algorithm")
      } else {
        setCurrentStatus("Parsing JSON data")
      }
      
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productsInput,
          userBehaviorInput,
          inputType,
          targetUserId: selectedUserId || targetUserId, // Send the target user ID
          parsedProducts: parsedProducts || parsedProductsFromDetection,
          parsedUserBehavior: parsedUserBehavior || parsedUserBehaviorFromDetection,
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

      setCurrentStatus("Analyzing with hybrid algorithm")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCurrentStatus("Generating AI insights")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCurrentStatus("Finalizing recommendations")
      
      console.log('\n🔄 About to save to cookies')
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
      
      setCurrentStatus("Complete! Redirecting")
      
      // Navigate after a brief delay to show completion
      setTimeout(() => {
        router.push(`/store`)
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
        "I have 10 products in my catalog:\n\n1. A high-performance laptop for $1299 in Electronics category\n2. A wireless ergonomic mouse for $49 in Electronics\n3. A mechanical RGB keyboard for $129 in Electronics\n4. Noise-cancelling headphones for $349 in Electronics\n5. A 27-inch 4K monitor for $599 in Electronics\n6. An ergonomic office chair for $449 in Furniture\n7. A standing desk for $699 in Furniture\n8. LED desk lamp for $79 in Furniture\n9. Wireless webcam 1080p for $89 in Electronics\n10. USB-C docking station for $199 in Electronics"
      )
      setUserBehaviorInput(
        "Main user (user123) behavior:\n- Viewed: laptop, keyboard, monitor, mouse, and desk\n- Added to cart: laptop and monitor\n- Purchased: mouse (rated 5 stars)\n- Spent 3 minutes viewing the laptop, 2 minutes on monitor\n- Currently shopping for a home office setup\n- Searched for: work from home setup, ergonomic equipment\n\nOther users:\n- user456 purchased laptop and chair, viewed desk\n- user789 added keyboard and headphones to cart, purchased mouse\n- user101 viewed monitor and webcam, purchased desk lamp\n- user202 purchased standing desk and chair"
      )
    } else {
      setProductsInput(JSON.stringify([
        {
          id: "electronics-1",
          name: "Premium Laptop Pro",
          description: "High-performance laptop with 16GB RAM and 512GB SSD, perfect for professionals and creators",
          category: "Electronics",
          price: 1299,
          tags: ["laptop", "computer", "professional", "high-performance"]
        },
        {
          id: "electronics-2",
          name: "Wireless Ergonomic Mouse",
          description: "Comfortable wireless mouse with adjustable DPI and ergonomic design for long work sessions",
          category: "Electronics",
          price: 49,
          tags: ["mouse", "wireless", "ergonomic", "accessory"]
        },
        {
          id: "electronics-3",
          name: "Mechanical RGB Keyboard",
          description: "Mechanical keyboard with customizable RGB lighting and tactile switches",
          category: "Electronics",
          price: 129,
          tags: ["keyboard", "mechanical", "rgb", "gaming"]
        },
        {
          id: "electronics-4",
          name: "Noise Cancelling Headphones",
          description: "Premium wireless headphones with active noise cancellation and 30-hour battery life",
          category: "Electronics",
          price: 349,
          tags: ["headphones", "wireless", "noise-cancelling", "audio"]
        },
        {
          id: "electronics-5",
          name: "4K UHD Monitor 27-inch",
          description: "Professional 27-inch 4K monitor with HDR support and USB-C connectivity",
          category: "Electronics",
          price: 599,
          tags: ["monitor", "4k", "display", "professional"]
        },
        {
          id: "furniture-1",
          name: "Ergonomic Office Chair",
          description: "Premium office chair with lumbar support, adjustable armrests, and breathable mesh",
          category: "Furniture",
          price: 449,
          tags: ["chair", "ergonomic", "office", "furniture"]
        },
        {
          id: "furniture-2",
          name: "Electric Standing Desk",
          description: "Height-adjustable standing desk with memory presets and sturdy steel frame",
          category: "Furniture",
          price: 699,
          tags: ["desk", "standing", "adjustable", "furniture"]
        },
        {
          id: "furniture-3",
          name: "LED Desk Lamp",
          description: "Modern LED desk lamp with adjustable brightness, color temperature, and USB charging port",
          category: "Furniture",
          price: 79,
          tags: ["lamp", "led", "lighting", "desk"]
        },
        {
          id: "electronics-6",
          name: "HD Webcam 1080p",
          description: "Professional webcam with auto-focus, noise reduction, and wide-angle lens",
          category: "Electronics",
          price: 89,
          tags: ["webcam", "camera", "streaming", "video"]
        },
        {
          id: "electronics-7",
          name: "USB-C Docking Station",
          description: "Universal docking station with multiple ports, dual monitor support, and 100W power delivery",
          category: "Electronics",
          price: 199,
          tags: ["dock", "usb-c", "hub", "accessory"]
        }
      ], null, 2))
      setUserBehaviorInput(JSON.stringify([
        {
          userId: "user123",
          viewedProducts: ["electronics-1", "electronics-3", "electronics-5", "electronics-2", "furniture-2"],
          cartItems: ["electronics-1", "electronics-5"],
          purchasedProducts: ["electronics-2"],
          searchQueries: ["work from home setup", "ergonomic equipment", "4k monitor"],
          ratings: {
            "electronics-2": 5
          },
          productInteractions: {
            "electronics-1": {
              productId: "electronics-1",
              viewCount: 8,
              viewDuration: 180,
              interactions: {
                sizeSelected: false,
                colorSelected: true,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 3600000,
                timesAddedToCart: 2,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: false,
                completedPurchase: false,
                purchaseCount: 0
              },
              rating: null,
              timestamp: Date.now() - 7200000
            },
            "electronics-5": {
              productId: "electronics-5",
              viewCount: 5,
              viewDuration: 120,
              interactions: {
                sizeSelected: true,
                colorSelected: false,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 1800000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: false,
                completedPurchase: false,
                purchaseCount: 0
              },
              rating: null,
              timestamp: Date.now() - 3600000
            },
            "electronics-2": {
              productId: "electronics-2",
              viewCount: 3,
              viewDuration: 60,
              interactions: {
                sizeSelected: false,
                colorSelected: true,
                imageZoomed: false,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 172800000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: true,
                completedPurchase: true,
                purchaseCount: 1
              },
              rating: 5,
              timestamp: Date.now() - 259200000
            }
          },
          sessionDuration: 1800,
          deviceType: "desktop",
          timeOfDay: "afternoon"
        },
        {
          userId: "user456",
          viewedProducts: ["electronics-1", "furniture-1", "furniture-2"],
          cartItems: [],
          purchasedProducts: ["electronics-1", "furniture-1"],
          searchQueries: ["office furniture", "ergonomic chair"],
          ratings: {
            "electronics-1": 5,
            "furniture-1": 4
          },
          productInteractions: {
            "electronics-1": {
              productId: "electronics-1",
              viewCount: 6,
              viewDuration: 240,
              interactions: {
                sizeSelected: false,
                colorSelected: true,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 604800000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: true,
                completedPurchase: true,
                purchaseCount: 1
              },
              rating: 5,
              timestamp: Date.now() - 604800000
            },
            "furniture-1": {
              productId: "furniture-1",
              viewCount: 4,
              viewDuration: 150,
              interactions: {
                sizeSelected: true,
                colorSelected: false,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 518400000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: true,
                completedPurchase: true,
                purchaseCount: 1
              },
              rating: 4,
              timestamp: Date.now() - 518400000
            }
          },
          sessionDuration: 2400,
          deviceType: "desktop",
          timeOfDay: "morning"
        },
        {
          userId: "user789",
          viewedProducts: ["electronics-3", "electronics-4", "electronics-2"],
          cartItems: ["electronics-3", "electronics-4"],
          purchasedProducts: ["electronics-2"],
          searchQueries: ["gaming setup", "rgb keyboard", "headphones"],
          ratings: {
            "electronics-2": 5
          },
          productInteractions: {
            "electronics-3": {
              productId: "electronics-3",
              viewCount: 7,
              viewDuration: 200,
              interactions: {
                sizeSelected: false,
                colorSelected: true,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 86400000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: false,
                completedPurchase: false,
                purchaseCount: 0
              },
              rating: null,
              timestamp: Date.now() - 86400000
            },
            "electronics-4": {
              productId: "electronics-4",
              viewCount: 5,
              viewDuration: 180,
              interactions: {
                sizeSelected: false,
                colorSelected: true,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 43200000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: false,
                completedPurchase: false,
                purchaseCount: 0
              },
              rating: null,
              timestamp: Date.now() - 43200000
            }
          },
          sessionDuration: 1500,
          deviceType: "mobile",
          timeOfDay: "evening"
        },
        {
          userId: "user101",
          viewedProducts: ["electronics-5", "electronics-6", "furniture-3"],
          cartItems: [],
          purchasedProducts: ["furniture-3"],
          searchQueries: ["desk lamp", "monitor", "webcam"],
          ratings: {
            "furniture-3": 5
          },
          productInteractions: {
            "electronics-5": {
              productId: "electronics-5",
              viewCount: 3,
              viewDuration: 90,
              interactions: {
                sizeSelected: true,
                colorSelected: false,
                imageZoomed: true,
                descriptionRead: true,
                reviewsRead: false
              },
              cartActions: {
                addedToCart: null,
                timesAddedToCart: 0,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: false,
                completedPurchase: false,
                purchaseCount: 0
              },
              rating: null,
              timestamp: Date.now() - 432000000
            },
            "furniture-3": {
              productId: "furniture-3",
              viewCount: 2,
              viewDuration: 60,
              interactions: {
                sizeSelected: false,
                colorSelected: true,
                imageZoomed: false,
                descriptionRead: true,
                reviewsRead: true
              },
              cartActions: {
                addedToCart: Date.now() - 345600000,
                timesAddedToCart: 1,
                removedFromCart: null,
                timesRemovedFromCart: 0
              },
              checkoutActions: {
                proceededToCheckout: true,
                completedPurchase: true,
                purchaseCount: 1
              },
              rating: 5,
              timestamp: Date.now() - 345600000
            }
          },
          sessionDuration: 900,
          deviceType: "tablet",
          timeOfDay: "afternoon"
        }
      ], null, 2))
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
        <div className="flex justify-center gap-2 mb-6">
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
        </div>

        {/* Data Format Guide Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-ui-fg-base hover:text-ui-fg-subtle border border-ui-border-base hover:border-ui-fg-base transition-all bg-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showGuide ? "Hide" : "View"} Data Format Guide
          </button>
        </div>

        {/* Data Format Guide - Collapsible */}
        {showGuide && (
          <div className="mb-12 border-t border-b border-ui-border-base bg-white py-12">
            <div className="mb-10">
              <p className="text-xs text-ui-fg-muted uppercase tracking-wide mb-3">Documentation</p>
              <h3 className="text-2xl font-normal text-ui-fg-base mb-3">
                Data Format Guide
              </h3>
              <p className="text-ui-fg-subtle max-w-2xl">
                Learn how to structure your product catalog and user behavior data for optimal recommendations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Product Catalog Format */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-ui-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h4 className="text-base font-medium text-ui-fg-base">Product Catalog</h4>
                  </div>
                  <p className="text-sm text-ui-fg-subtle">
                    An array of product objects representing items in your catalog.
                  </p>
                </div>

                <div className="bg-ui-bg-base border border-ui-border-base p-4 mb-6">
                  <pre className="text-xs font-mono text-ui-fg-base overflow-x-auto">{`[
  {
    "id": "electronics-1",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse...",
    "category": "Electronics",
    "price": 29.99,
    "tags": ["mouse", "wireless", "tech"]
  }
]`}</pre>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-24 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">id</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Unique identifier (format: category-number)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">name</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Product display name</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">category</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Electronics, Furniture, Clothing, Kitchen, Sports, etc.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">price</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Numeric value (no currency symbols)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">tags</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Array of 3-5 descriptive keywords</p>
                  </div>
                </div>
              </div>

              {/* User Behavior Format */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-ui-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="text-base font-medium text-ui-fg-base">User Behavior</h4>
                  </div>
                  <p className="text-sm text-ui-fg-subtle">
                    Single user object or array of multiple users.
                  </p>
                </div>

                <div className="bg-ui-bg-base border border-ui-border-base p-4 mb-6">
                  <pre className="text-xs font-mono text-ui-fg-base overflow-x-auto">{`[
  {
    "userId": "user123",
    "viewedProducts": ["electronics-1"],
    "cartItems": ["electronics-2"],
    "purchasedProducts": ["electronics-3"]
  },
  {
    "userId": "user456",
    "viewedProducts": ["electronics-2"],
    "purchasedProducts": ["electronics-1"]
  }
]`}</pre>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-32 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">viewedProducts</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Product IDs the user viewed</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-32 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">cartItems</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Product IDs in shopping cart</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-32 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">purchasedProducts</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Product IDs user purchased</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-32 flex-shrink-0">
                      <code className="text-xs font-mono text-ui-fg-base">productInteractions</code>
                    </div>
                    <p className="text-xs text-ui-fg-subtle">Detailed engagement metrics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="border-t border-ui-border-base pt-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-ui-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-base font-medium text-ui-fg-base">Important Notes</h4>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <p className="text-sm font-medium text-ui-fg-base mb-1.5">Product IDs Must Match</p>
                  <p className="text-xs text-ui-fg-subtle">
                    All product IDs in user behavior (viewedProducts, cartItems, purchasedProducts) must exist in your product catalog.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ui-fg-base mb-1.5">Multiple Users Support</p>
                  <p className="text-xs text-ui-fg-subtle">
                    Provide multiple users as an array. You'll be prompted to select which user should receive recommendations.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ui-fg-base mb-1.5">JSON Format</p>
                  <p className="text-xs text-ui-fg-subtle">
                    Valid JSON is parsed manually for speed. Invalid JSON automatically falls back to AI parsing.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ui-fg-base mb-1.5">ID Format</p>
                  <p className="text-xs text-ui-fg-subtle">
                    Use the format "category-number" for product IDs (e.g., "electronics-1", "furniture-2").
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
            className="px-8 py-2.5 bg-ui-fg-base text-white hover:bg-ui-fg-subtle transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-ui-fg-base min-w-[240px] flex items-center justify-center gap-2"
          >
            <span>{loading ? currentStatus : "Generate Recommendations"}</span>
            {loading && (
              <span className="inline-block align-middle">
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-ui-bg-base border border-ui-border-base text-ui-fg-base text-center text-sm">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* User Selection Modal */}
        {showUserSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-ui-border-base max-w-md w-full mx-4 shadow-lg">
              <div className="p-6 border-b border-ui-border-base">
                <h3 className="text-lg font-medium text-ui-fg-base">Select Target User</h3>
                <p className="text-sm text-ui-fg-subtle mt-2">
                  Multiple users detected. Which user should receive personalized recommendations?
                </p>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {detectedUsers.map((userId) => (
                    <button
                      key={userId}
                      onClick={() => {
                        setTargetUserId(userId)
                        executeSubmit(userId)
                      }}
                      className="w-full px-4 py-3 border border-ui-border-base hover:border-ui-fg-base hover:bg-ui-bg-base transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-ui-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <p className="font-mono text-sm text-ui-fg-base">{userId}</p>
                          <p className="text-xs text-ui-fg-subtle">Generate recommendations for this user</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t border-ui-border-base flex justify-end">
                <button
                  onClick={() => {
                    setShowUserSelection(false)
                    setDetectedUsers([])
                  }}
                  className="px-4 py-2 border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-base transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
