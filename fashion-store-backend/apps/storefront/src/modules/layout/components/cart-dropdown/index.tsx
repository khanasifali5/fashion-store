"use client"

import {
  addToCart,
  deleteLineItem,
} from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { createPortal } from "react-dom"

type VariantOptionLike = {
  value?: string | null
  option?: {
    title?: string | null
  } | null
}

type ImageLike = {
  id?: string | null
  url?: string | null
}

type VariantWithImages = {
  images?: ImageLike[] | null
}

type ProductWithImages = {
  images?: ImageLike[] | null
}

type CartItemWithProduct =
  HttpTypes.StoreCartLineItem & {
    product?: ProductWithImages | null
  }

type OptimisticCartItem = {
  optimisticId: string
  variantId: string
  title: string
  productHandle?: string | null
  image?: string
  color?: string
  size?: string
  quantity: number
  unitPrice: number
  currencyCode: string
}

type SavedItem = {
  key: string
  variantId: string
  title: string
  productHandle?: string | null
  image?: string
  color?: string
  size?: string
  unitPrice: number
  quantity: number
  currencyCode: string
}

type OptimisticAddEvent = {
  optimisticId: string
  variantId: string
  title: string
  productHandle?: string | null
  image?: string
  color?: string
  size?: string
  quantity: number
  unitPrice: number
  currencyCode: string
}

type ServerSyncEvent = {
  optimisticId: string
  cart: HttpTypes.StoreCart
}

const SAVED_ITEMS_KEY =
  "safafi_saved_for_later_v1"

const normalize = (
  value?: string | null
) =>
  value?.trim().toLowerCase() ?? ""

const getCartItemImage = (
  item: HttpTypes.StoreCartLineItem
) => {
  const cartItem =
    item as CartItemWithProduct

  const variant =
    item.variant as
      | (typeof item.variant &
          VariantWithImages)
      | null
      | undefined

  const variantImages =
    (variant?.images ?? []).filter(
      (image) =>
        typeof image.url ===
          "string" &&
        image.url.trim().length > 0
    )

  const variantImageUrls =
    new Set(
      variantImages
        .map((image) => image.url)
        .filter(
          (url): url is string =>
            typeof url === "string"
        )
    )

  const firstVariantImageInGallery =
    cartItem.product?.images?.find(
      (image) =>
        typeof image.url ===
          "string" &&
        variantImageUrls.has(
          image.url
        )
    )?.url

  return (
    firstVariantImageInGallery ||
    variantImages[0]?.url ||
    item.thumbnail ||
    undefined
  )
}

const getVariantDetails = (
  item: HttpTypes.StoreCartLineItem
) => {
  const options =
    (item.variant?.options ??
      []) as VariantOptionLike[]

  const findOption = (
    names: string[]
  ) =>
    options.find((entry) =>
      names.includes(
        normalize(
          entry.option?.title
        )
      )
    )?.value

  let color =
    findOption([
      "color",
      "colour",
      "colors",
      "colours",
    ]) ?? undefined

  let size =
    findOption(["size"]) ??
    undefined

  if (!color || !size) {
    const parts =
      (item.variant?.title ?? "")
        .split("/")
        .map((part) =>
          part.trim()
        )
        .filter(Boolean)

    if (!color && parts[0]) {
      color = parts[0]
    }

    if (!size && parts[1]) {
      size = parts[1]
    }
  }

  return { color, size }
}

const readSavedItems = (): SavedItem[] => {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw =
      window.localStorage.getItem(
        SAVED_ITEMS_KEY
      )

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}

const writeSavedItems = (
  items: SavedItem[]
) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    SAVED_ITEMS_KEY,
    JSON.stringify(items)
  )
}

export default function CartDropdown({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) {
  const pathname = usePathname()

  const [mounted, setMounted] =
    useState(false)

  const [cartOpen, setCartOpen] =
    useState(false)

  const [activeTab, setActiveTab] =
    useState<"cart" | "saved">(
      "cart"
    )

  const [cart, setCart] =
    useState<
      HttpTypes.StoreCart | null
    >(cartState ?? null)

  const [
    optimisticItems,
    setOptimisticItems,
  ] = useState<
    OptimisticCartItem[]
  >([])

  const [savedItems, setSavedItems] =
    useState<SavedItem[]>([])

  useEffect(() => {
    setMounted(true)
    setSavedItems(
      readSavedItems()
    )
  }, [])

  /*
   * Only accept incoming server prop when it actually changes.
   * Live add/remove operations can update `cart` directly from
   * the Medusa response without waiting for a route refresh.
   */
  useEffect(() => {
    setCart(cartState ?? null)
  }, [cartState])

  useEffect(() => {
    if (!mounted) {
      return
    }

    writeSavedItems(savedItems)
  }, [savedItems, mounted])

  /*
   * The premium instant-add bridge.
   *
   * ProductActions dispatches this BEFORE awaiting Medusa.
   * We open the drawer and render the complete temporary item
   * on the same click frame.
   */
  useEffect(() => {
    const onOptimisticAdd = (
      event: Event
    ) => {
      const detail =
        (
          event as CustomEvent<OptimisticAddEvent>
        ).detail

      if (
        !detail?.optimisticId ||
        !detail.variantId
      ) {
        return
      }

      setOptimisticItems(
        (current) => [
          {
            ...detail,
          },
          ...current,
        ]
      )

      setActiveTab("cart")
      setCartOpen(true)
    }

    const onServerSync = (
      event: Event
    ) => {
      const detail =
        (
          event as CustomEvent<ServerSyncEvent>
        ).detail

      if (!detail?.cart) {
        return
      }

      setOptimisticItems(
        (current) =>
          current.filter(
            (item) =>
              item.optimisticId !==
              detail.optimisticId
          )
      )

      setCart(detail.cart)
    }

    const onRollback = (
      event: Event
    ) => {
      const detail =
        (
          event as CustomEvent<{
            optimisticId: string
          }>
        ).detail

      setOptimisticItems(
        (current) =>
          current.filter(
            (item) =>
              item.optimisticId !==
              detail?.optimisticId
          )
      )
    }

    window.addEventListener(
      "safafi-cart-optimistic-add",
      onOptimisticAdd
    )

    window.addEventListener(
      "safafi-cart-server-sync",
      onServerSync
    )

    window.addEventListener(
      "safafi-cart-optimistic-rollback",
      onRollback
    )

    return () => {
      window.removeEventListener(
        "safafi-cart-optimistic-add",
        onOptimisticAdd
      )

      window.removeEventListener(
        "safafi-cart-server-sync",
        onServerSync
      )

      window.removeEventListener(
        "safafi-cart-optimistic-rollback",
        onRollback
      )
    }
  }, [])

  useEffect(() => {
    setCartOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!cartOpen) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setCartOpen(false)
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [cartOpen])

  const realItems = useMemo(
    () =>
      [...(cart?.items ?? [])].sort(
        (a, b) =>
          (a.created_at ?? "") >
          (b.created_at ?? "")
            ? -1
            : 1
      ),
    [cart?.items]
  )

  const totalItems =
    realItems.reduce(
      (acc, item) =>
        acc + item.quantity,
      0
    ) +
    optimisticItems.reduce(
      (acc, item) =>
        acc + item.quantity,
      0
    )

  const realSubtotal =
    cart?.subtotal ??
    realItems.reduce(
      (acc, item) =>
        acc +
        (typeof item.total ===
        "number"
          ? item.total
          : (item.unit_price ??
              0) *
            item.quantity),
      0
    )

  const optimisticSubtotal =
    optimisticItems.reduce(
      (acc, item) =>
        acc +
        item.unitPrice *
          item.quantity,
      0
    )

  const displaySubtotal =
    realSubtotal +
    optimisticSubtotal

  const currencyCode =
    cart?.currency_code ||
    optimisticItems[0]
      ?.currencyCode ||
    "INR"

  const countryCode =
    pathname
      .split("/")
      .filter(Boolean)[0] ||
    "in"

  const removeRealItem = async (
    item: HttpTypes.StoreCartLineItem
  ) => {
    const previousCart = cart

    /*
     * Remove from the drawer immediately.
     */
    setCart((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        items:
          current.items?.filter(
            (entry) =>
              entry.id !== item.id
          ) ?? [],
        subtotal:
          Math.max(
            0,
            (current.subtotal ??
              0) -
              (typeof item.total ===
              "number"
                ? item.total
                : (item.unit_price ??
                    0) *
                  item.quantity)
          ),
      }
    })

    try {
      const updatedCart =
        await deleteLineItem(
          item.id
        )

      if (updatedCart) {
        setCart(updatedCart)
      }
    } catch {
      setCart(previousCart)
    }
  }

  const saveRealItem = async (
    item: HttpTypes.StoreCartLineItem
  ) => {
    const variantId =
      item.variant_id ||
      item.variant?.id

    if (!variantId) {
      return
    }

    const {
      color,
      size,
    } = getVariantDetails(item)

    const saved: SavedItem = {
      key:
        `${variantId}-${Date.now()}`,
      variantId,
      title:
        item.title ||
        "Product",
      productHandle:
        item.product_handle,
      image:
        getCartItemImage(item),
      color,
      size,
      unitPrice:
        item.unit_price ?? 0,
      quantity:
        item.quantity,
      currencyCode,
    }

    setSavedItems(
      (current) => [
        saved,
        ...current,
      ]
    )

    await removeRealItem(item)
  }

  const moveSavedToCart =
    async (
      saved: SavedItem
    ) => {
      /*
       * Saved item disappears immediately.
       * The Medusa response supplies the real cart.
       */
      setSavedItems(
        (current) =>
          current.filter(
            (item) =>
              item.key !==
              saved.key
          )
      )

      const optimisticId =
        `saved-${saved.variantId}-${Date.now()}`

      setOptimisticItems(
        (current) => [
          {
            optimisticId,
            variantId:
              saved.variantId,
            title: saved.title,
            productHandle:
              saved.productHandle,
            image: saved.image,
            color: saved.color,
            size: saved.size,
            quantity:
              saved.quantity,
            unitPrice:
              saved.unitPrice,
            currencyCode:
              saved.currencyCode,
          },
          ...current,
        ]
      )

      setActiveTab("cart")

      const result =
        await addToCart({
          variantId:
            saved.variantId,
          quantity:
            saved.quantity,
          countryCode,
        })

      if (!result.success) {
        setOptimisticItems(
          (current) =>
            current.filter(
              (item) =>
                item.optimisticId !==
                optimisticId
            )
        )

        setSavedItems(
          (current) => [
            saved,
            ...current,
          ]
        )

        return
      }

      setOptimisticItems(
        (current) =>
          current.filter(
            (item) =>
              item.optimisticId !==
              optimisticId
          )
      )

      setCart(result.cart)
    }

  const renderDetails = ({
    color,
    size,
    quantity,
  }: {
    color?: string
    size?: string
    quantity: number
  }) => (
    <div className="mt-8 space-y-1 text-[12px] font-normal leading-[1.5]">
      {color && (
        <div>
          Color: {color}
        </div>
      )}

      {size && (
        <div>
          Size: {size}
        </div>
      )}

      <div>
        Qty: {quantity}
      </div>
    </div>
  )

  const drawer =
    mounted && cartOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
          >
            <button
              type="button"
              aria-label="Close cart"
              onClick={() =>
                setCartOpen(false)
              }
              className="absolute inset-0 z-0 bg-black/50"
            />

            <aside
              id="cart-drawer"
              className="absolute right-0 top-0 z-10 flex h-full w-full flex-col bg-white text-black small:w-[44vw] small:min-w-[560px] small:max-w-[640px]"
              style={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              <div className="flex h-[72px] shrink-0 items-center justify-between px-5 small:px-6">
                <div className="flex items-center gap-5 text-[12px] font-normal leading-[1.4]">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "cart"
                      )
                    }
                    className={[
                      "relative pb-[3px]",
                      "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current",
                      activeTab ===
                      "cart"
                        ? "after:opacity-100"
                        : "after:opacity-0 hover:after:opacity-100",
                    ].join(" ")}
                  >
                    Cart ({totalItems})
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "saved"
                      )
                    }
                    className={[
                      "relative pb-[3px] text-black/55 transition-colors hover:text-black",
                      "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current",
                      activeTab ===
                      "saved"
                        ? "text-black after:opacity-100"
                        : "after:opacity-0 hover:after:opacity-100",
                    ].join(" ")}
                  >
                    Saved ({savedItems.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCartOpen(false)
                  }
                  className="relative text-[12px] font-normal leading-[1.4] after:absolute after:left-0 after:-bottom-[3px] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
                >
                  Close
                </button>
              </div>

              {activeTab === "cart" ? (
                <>
                  {realItems.length >
                    0 ||
                  optimisticItems.length >
                    0 ? (
                    <>
                      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-1 small:px-6">
                        <div className="space-y-8">
                          {/* TEMPORARY ITEMS APPEAR IMMEDIATELY */}
                          {optimisticItems.map(
                            (item) => (
                              <div
                                key={
                                  item.optimisticId
                                }
                                className="grid grid-cols-[170px_minmax(0,1fr)] gap-x-5 border-b border-black/10 pb-8"
                              >
                                <LocalizedClientLink
                                  href={
                                    item.productHandle
                                      ? `/products/${item.productHandle}`
                                      : "/store"
                                  }
                                  className="relative block h-[255px] w-[170px] overflow-hidden bg-[#f6f4f1]"
                                >
                                  {item.image ? (
                                    <Image
                                      src={
                                        item.image
                                      }
                                      alt={
                                        item.title
                                      }
                                      fill
                                      sizes="170px"
                                      quality={
                                        80
                                      }
                                      className="object-contain object-center"
                                    />
                                  ) : null}
                                </LocalizedClientLink>

                                <div className="flex min-w-0 flex-col py-1 text-[12px] font-normal leading-[1.5]">
                                  <div className="truncate">
                                    {
                                      item.title
                                    }
                                  </div>

                                  <div className="mt-1">
                                    {convertToLocale(
                                      {
                                        amount:
                                          item.unitPrice,
                                        currency_code:
                                          item.currencyCode,
                                      }
                                    )}
                                  </div>

                                  {renderDetails(
                                    {
                                      color:
                                        item.color,
                                      size:
                                        item.size,
                                      quantity:
                                        item.quantity,
                                    }
                                  )}

                                  <div className="mt-auto pt-6 text-black/45">
                                    Added to Cart
                                  </div>
                                </div>
                              </div>
                            )
                          )}

                          {realItems.map(
                            (item) => {
                              const {
                                color,
                                size,
                              } =
                                getVariantDetails(
                                  item
                                )

                              const itemImage =
                                getCartItemImage(
                                  item
                                )

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="grid grid-cols-[170px_minmax(0,1fr)] gap-x-5 border-b border-black/10 pb-8"
                                  data-testid="cart-item"
                                >
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    className="relative block h-[255px] w-[170px] overflow-hidden bg-[#f6f4f1]"
                                  >
                                    {itemImage ? (
                                      <Image
                                        src={
                                          itemImage
                                        }
                                        alt={
                                          item.title ||
                                          "Product"
                                        }
                                        fill
                                        sizes="170px"
                                        quality={
                                          80
                                        }
                                        className="object-contain object-center"
                                      />
                                    ) : null}
                                  </LocalizedClientLink>

                                  <div className="flex min-w-0 flex-col py-1 text-[12px] font-normal leading-[1.5]">
                                    <LocalizedClientLink
                                      href={`/products/${item.product_handle}`}
                                      className="w-fit max-w-full truncate transition-opacity hover:opacity-55"
                                    >
                                      {
                                        item.title
                                      }
                                    </LocalizedClientLink>

                                    <div className="mt-1">
                                      {convertToLocale(
                                        {
                                          amount:
                                            item.unit_price ??
                                            0,
                                          currency_code:
                                            currencyCode,
                                        }
                                      )}
                                    </div>

                                    {renderDetails(
                                      {
                                        color,
                                        size,
                                        quantity:
                                          item.quantity,
                                      }
                                    )}

                                    <div className="mt-auto flex items-center gap-5 pt-6">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeRealItem(
                                            item
                                          )
                                        }
                                        className="relative after:absolute after:left-0 after:-bottom-[3px] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
                                      >
                                        Remove
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          saveRealItem(
                                            item
                                          )
                                        }
                                        className="relative after:absolute after:left-0 after:-bottom-[3px] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
                                      >
                                        Save for Later
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 border-t border-black/10 bg-white">
                        <div className="flex items-center justify-between px-5 py-4 text-[12px] font-normal leading-[1.4] small:px-6">
                          <span>
                            Subtotal
                          </span>

                          <span>
                            {convertToLocale(
                              {
                                amount:
                                  displaySubtotal,
                                currency_code:
                                  currencyCode,
                              }
                            )}
                          </span>
                        </div>

                        <div className="px-5 pb-4 text-center text-[12px] font-normal leading-[1.5] text-black/60 small:px-6">
                          Taxes and shipping
                          are calculated at
                          checkout.
                        </div>

                        <LocalizedClientLink
                          href="/checkout?step=address"
                          className="flex min-h-[46px] w-full items-center justify-center bg-black px-5 text-[12px] font-normal text-white transition-opacity hover:opacity-80"
                        >
                          Proceed to checkout
                        </LocalizedClientLink>

                        <LocalizedClientLink
                          href="/cart"
                          className="flex min-h-[46px] w-full items-center justify-center border-t border-black/10 bg-white px-5 text-[12px] font-normal text-black transition-opacity hover:opacity-55"
                        >
                          View Cart
                        </LocalizedClientLink>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-[12px] font-normal leading-[1.4]">
                      <p>
                        Your Cart is empty
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-1 small:px-6">
                  {savedItems.length >
                  0 ? (
                    <div className="space-y-8">
                      {savedItems.map(
                        (item) => (
                          <div
                            key={
                              item.key
                            }
                            className="grid grid-cols-[170px_minmax(0,1fr)] gap-x-5 border-b border-black/10 pb-8"
                          >
                            <LocalizedClientLink
                              href={
                                item.productHandle
                                  ? `/products/${item.productHandle}`
                                  : "/store"
                              }
                              className="relative block h-[255px] w-[170px] overflow-hidden bg-[#f6f4f1]"
                            >
                              {item.image ? (
                                <Image
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.title
                                  }
                                  fill
                                  sizes="170px"
                                  quality={
                                    80
                                  }
                                  className="object-contain object-center"
                                />
                              ) : null}
                            </LocalizedClientLink>

                            <div className="flex min-w-0 flex-col py-1 text-[12px] font-normal leading-[1.5]">
                              <div>
                                {
                                  item.title
                                }
                              </div>

                              <div className="mt-1">
                                {convertToLocale(
                                  {
                                    amount:
                                      item.unitPrice,
                                    currency_code:
                                      item.currencyCode,
                                  }
                                )}
                              </div>

                              {renderDetails(
                                {
                                  color:
                                    item.color,
                                  size:
                                    item.size,
                                  quantity:
                                    item.quantity,
                                }
                              )}

                              <div className="mt-auto flex items-center gap-5 pt-6">
                                <button
                                  type="button"
                                  onClick={() =>
                                    moveSavedToCart(
                                      item
                                    )
                                  }
                                  className="relative after:absolute after:left-0 after:-bottom-[3px] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
                                >
                                  Move to Cart
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSavedItems(
                                      (
                                        current
                                      ) =>
                                        current.filter(
                                          (
                                            saved
                                          ) =>
                                            saved.key !==
                                            item.key
                                        )
                                    )
                                  }
                                  className="relative after:absolute after:left-0 after:-bottom-[3px] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-[60vh] items-center justify-center text-center text-[12px] font-normal leading-[1.4]">
                      No saved items yet.
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveTab("cart")
          setCartOpen(
            (current) =>
              !current
          )
        }}
        aria-expanded={cartOpen}
        aria-controls="cart-drawer"
        data-testid="nav-cart-link"
        className={[
          "relative whitespace-nowrap bg-transparent p-0",
          "text-[12px] font-normal leading-[1.4] tracking-normal",
          "after:absolute after:left-0 after:-bottom-[4px] after:h-px after:w-full after:origin-left after:bg-current after:transition-transform after:duration-200",
          cartOpen
            ? "after:scale-x-100"
            : "after:scale-x-0 hover:after:scale-x-100",
        ].join(" ")}
        style={{
          fontFamily:
            '"Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        Cart ({totalItems})
      </button>

      {drawer}
    </>
  )
}