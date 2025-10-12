"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { getCartItemsFromRecommendations, clearRecommendationData } from "@lib/util/recommendation-cookies"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = () => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(undefined)
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const loadCartItems = () => {
      const items = getCartItemsFromRecommendations()
      setCartItems(items)
    }

    loadCartItems()
    window.addEventListener('cartUpdated', loadCartItems)
    // Only hide cart on mobile devices (<= 768px)
    const mq = window.matchMedia('(max-width: 768px)')
    const onMenuOpen = (e: any) => {
      if (mq.matches) {
        setMenuOpen(Boolean(e?.detail))
      } else {
        setMenuOpen(false)
      }
    }
    window.addEventListener('nav-menu-open', onMenuOpen)

    // Ensure we restore cart visibility when resizing to desktop
    const onResize = () => {
      if (!mq.matches) setMenuOpen(false)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('cartUpdated', loadCartItems)
      window.removeEventListener('nav-menu-open', onMenuOpen)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const handleClearCart = () => {
    clearRecommendationData()
  }

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems = cartItems.length
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0)

  const openAndCancel = () => {
    if (activeTimer) clearTimeout(activeTimer)
    open()
  }

  const pathname = usePathname()

  return (
    // Hide the cart when the side menu is open to avoid interfering with menu interactions
    <div className="h-full z-50" onMouseEnter={openAndCancel} onMouseLeave={close}>
      {menuOpen ? null : (
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="hover:text-ui-fg-base"
            href="/cart"
          >{`Cart (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition show={cartDropdownOpen} as={Fragment}>
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white border-x border-b border-gray-200 w-[420px] text-ui-fg-base"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">Cart</h3>
            </div>
            {cartItems.length > 0 ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                  {cartItems.map((item) => (
                    <div className="grid grid-cols-[122px_1fr] gap-x-4" key={item.id}>
                      <div className="w-24 h-24 bg-ui-bg-subtle rounded-md flex items-center justify-center text-xs">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col justify-between flex-1">
                        <h3 className="text-base-regular">{item.name}</h3>
                        <div className="flex items-end justify-between">
                          <span>Qty: 1</span>
                          <span>${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 flex flex-col gap-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <LocalizedClientLink href="/cart" className="flex-1">
                      <button className="w-full bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors">
                        Go to cart
                      </button>
                    </LocalizedClientLink>
                    <button 
                      onClick={handleClearCart}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      title="Clear all items and recommendations"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                <div className="bg-gray-900 flex items-center justify-center w-6 h-6 rounded-full text-white">
                  <span>0</span>
                </div>
                <span>Your shopping bag is empty.</span>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
      )}
    </div>
  )
}

export default CartDropdown
