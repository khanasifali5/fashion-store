"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import {
  useParams,
  useSearchParams,
} from "next/navigation"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  cartVariantQuantities?: Record<string, number>
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      option
    ) => {
      if (option.option_id) {
        acc[option.option_id] = option.value
      }

      return acc
    },
    {}
  )
}

const normalizeValue = (
  value?: string | null
) => {
  return value?.trim().toLowerCase() ?? ""
}

export default function ProductActions({
  product,
  region,
  disabled,
  cartVariantQuantities = {},
}: ProductActionsProps) {
  const searchParams = useSearchParams()

  const countryCode =
    useParams().countryCode as string

  const colorOption = useMemo(
    () =>
      product.options?.find((option) => {
        const title =
          option.title
            ?.trim()
            .toLowerCase()

        return (
          title === "color" ||
          title === "colour" ||
          title === "colors" ||
          title === "colours"
        )
      }),
    [product.options]
  )

  const sizeOption = useMemo(
    () =>
      product.options?.find(
        (option) =>
          option.title
            ?.trim()
            .toLowerCase() === "size"
      ),
    [product.options]
  )

  const colorOptionId = colorOption?.id
  const sizeOptionId = sizeOption?.id

  /*
   * Always render product options in one storefront order,
   * regardless of the order they were created in Medusa Admin:
   *
   * 1. Color / Colour
   * 2. Size
   * 3. Any other option
   *
   * This prevents one product showing Size first while another
   * product shows Color first.
   */
  const orderedProductOptions =
    useMemo(() => {
      const getPriority = (
        option: HttpTypes.StoreProductOption
      ) => {
        const title =
          normalizeValue(
            option.title
          )

        if (
          title === "color" ||
          title === "colour" ||
          title === "colors" ||
          title === "colours"
        ) {
          return 0
        }

        if (title === "size") {
          return 1
        }

        return 2
      }

      return [
        ...(product.options ?? []),
      ].sort(
        (a, b) =>
          getPriority(a) -
          getPriority(b)
      )
    }, [product.options])

  /*
   * Product Showcase से आने वाले parameters.
   *
   * Examples:
   *
   * ?color=Black
   * ?color=Black&size=M
   * ?color=Black&size=M&v_id=variant_123
   */
  const requestedColor =
    searchParams.get("color")

  const requestedSize =
    searchParams.get("size")

  const requestedVariantId =
    searchParams.get("v_id")

  const variantAvailable = (
    variant:
      | HttpTypes.StoreProductVariant
      | undefined
  ) => {
    if (!variant) {
      return false
    }

    if (!variant.manage_inventory) {
      return true
    }

    if (variant.allow_backorder) {
      return true
    }

    const inventory =
      variant.inventory_quantity ?? 0

    const alreadyInCart =
      cartQty[variant.id] ?? 0

    return (
      inventory - alreadyInCart > 0
    )
  }

  /*
   * Resolve initial options BEFORE first render.
   *
   * Priority:
   *
   * 1. exact v_id
   * 2. URL color + size
   * 3. URL color
   * 4. single variant
   * 5. empty -> default color effect handles it
   */
  const initialOptions = useMemo(() => {
    const variants =
      product.variants ?? []

    if (requestedVariantId) {
      const exactVariant =
        variants.find(
          (variant) =>
            variant.id ===
            requestedVariantId
        )

      if (exactVariant) {
        return (
          optionsAsKeymap(
            exactVariant.options
          ) ?? {}
        )
      }
    }

    const next: Record<
      string,
      string
    > = {}

    if (
      requestedColor &&
      colorOptionId
    ) {
      const validColor =
        colorOption?.values?.find(
          (item) =>
            normalizeValue(item.value) ===
            normalizeValue(
              requestedColor
            )
        )

      if (validColor) {
        next[colorOptionId] =
          validColor.value
      }
    }

    if (
      requestedSize &&
      sizeOptionId
    ) {
      const validSize =
        sizeOption?.values?.find(
          (item) =>
            normalizeValue(item.value) ===
            normalizeValue(
              requestedSize
            )
        )

      if (validSize) {
        next[sizeOptionId] =
          validSize.value
      }
    }

    /*
     * URL color + size combination अगर
     * actual variant नहीं बनाती तो size को
     * select नहीं करेंगे.
     */
    if (
      colorOptionId &&
      sizeOptionId &&
      next[colorOptionId] &&
      next[sizeOptionId]
    ) {
      const matchingVariant =
        variants.find((variant) => {
          const map =
            optionsAsKeymap(
              variant.options
            ) ?? {}

          return (
            map[colorOptionId] ===
              next[colorOptionId] &&
            map[sizeOptionId] ===
              next[sizeOptionId]
          )
        })

      if (!matchingVariant) {
        delete next[sizeOptionId]
      }
    }

    if (
      Object.keys(next).length
    ) {
      return next
    }

    if (variants.length === 1) {
      return (
        optionsAsKeymap(
          variants[0].options
        ) ?? {}
      )
    }

    return {}
  }, [
    product.variants,
    requestedVariantId,
    requestedColor,
    requestedSize,
    colorOption,
    sizeOption,
  ])

  const [options, setOptions] =
    useState<
      Record<
        string,
        string | undefined
      >
    >(initialOptions)

  /*
   * Prevent duplicate requests without disabling the button.
   * This avoids the browser's "not-allowed" cursor / cheap loading feel.
   */
  const addRequestPendingRef =
    useRef(false)

  const [cartError, setCartError] =
    useState("")

  const [cartQty, setCartQty] =
    useState<Record<string, number>>(
      cartVariantQuantities
    )

  /*
   * अगर Next navigation के दौरान same
   * ProductActions instance URL बदलने के बाद
   * reuse हो, तो state भी sync हो.
   */
  useEffect(() => {
    setOptions(initialOptions)
  }, [
    product.id,
    initialOptions,
  ])

  const colorSwatchImages =
    useMemo(() => {
      const result: Record<
        string,
        string
      > = {}

      if (!colorOptionId) {
        return result
      }

      for (
        const variant of
        product.variants ?? []
      ) {
        const color =
          variant.options?.find(
            (option) =>
              option.option_id ===
              colorOptionId
          )?.value

        const image =
          variant.images?.[0]?.url

        if (
          color &&
          image &&
          !result[color]
        ) {
          result[color] = image
        }
      }

      return result
    }, [
      colorOptionId,
      product.variants,
    ])

  const getImagesForColor = (
    value: string
  ) => {
    if (!colorOptionId) {
      return []
    }

    const normalized =
      normalizeValue(value)

    const seen =
      new Set<string>()

    const result:
      HttpTypes.StoreProductImage[] =
      []

    for (
      const variant of
      product.variants ?? []
    ) {
      const matchesColor =
        variant.options?.some(
          (option) =>
            option.option_id ===
              colorOptionId &&
            normalizeValue(
              option.value
            ) === normalized
        )

      if (!matchesColor) {
        continue
      }

      for (
        const image of
        variant.images ?? []
      ) {
        const url =
          image.url?.trim()

        if (!url) {
          continue
        }

        const key =
          url.toLowerCase()

        if (seen.has(key)) {
          continue
        }

        seen.add(key)
        result.push(image)
      }
    }

    return result
  }

  /*
   * Selected URL/default color की gallery
   * page खुलते ही commit करें.
   *
   * URL color मौजूद हो तो उसी को priority.
   * Otherwise first available color.
   */
  useEffect(() => {
    if (
      !colorOptionId ||
      !product.variants?.length
    ) {
      return
    }

    let colorToCommit =
      options[colorOptionId]

    if (!colorToCommit) {
      const firstAvailableVariant =
        product.variants.find(
          variantAvailable
        ) ?? product.variants[0]

      colorToCommit =
        firstAvailableVariant
          ?.options?.find(
            (option) =>
              option.option_id ===
              colorOptionId
          )?.value
    }

    if (!colorToCommit) {
      return
    }

    /*
     * Color अभी selected नहीं है तो
     * default color select करें.
     *
     * Size intentionally auto-select नहीं.
     */
    setOptions((previous) => {
      if (
        previous[colorOptionId]
      ) {
        return previous
      }

      return {
        ...previous,
        [colorOptionId]:
          colorToCommit,
      }
    })

    const images =
      getImagesForColor(
        colorToCommit
      )

    if (!images.length) {
      return
    }

    window.requestAnimationFrame(
      () => {
        window.dispatchEvent(
          new CustomEvent(
            "product-color-commit",
            {
              detail: {
                images,
              },
            }
          )
        )
      }
    )
  }, [
    product.id,
    colorOptionId,
    options[
      colorOptionId ?? ""
    ],
  ])

  const selectedVariant =
    useMemo(() => {
      if (
        !product.variants?.length
      ) {
        return
      }

      return product.variants.find(
        (variant) =>
          isEqual(
            optionsAsKeymap(
              variant.options
            ),
            options
          )
      )
    }, [
      product.variants,
      options,
    ])

  const sizeAvailability =
    useMemo(() => {
      const result: Record<
        string,
        boolean
      > = {}

      if (!sizeOptionId) {
        return result
      }

      const selectedColor =
        colorOptionId
          ? options[
              colorOptionId
            ]
          : undefined

      for (
        const item of
        sizeOption.values ?? []
      ) {
        const size = item.value

        const matching =
          (
            product.variants ?? []
          ).filter((variant) => {
            const map =
              optionsAsKeymap(
                variant.options
              ) ?? {}

            if (
              map[sizeOptionId] !==
              size
            ) {
              return false
            }

            if (
              selectedColor &&
              colorOptionId &&
              map[
                colorOptionId
              ] !== selectedColor
            ) {
              return false
            }

            return true
          })

        result[size] =
          matching.some(
            variantAvailable
          )
      }

      return result
    }, [
      cartQty,
      colorOptionId,
      options,
      product.variants,
      sizeOption,
    ])

  const updateUrlWithoutNavigation = (
    updater: (
      params: URLSearchParams
    ) => void
  ) => {
    const url =
      new URL(
        window.location.href
      )

    updater(url.searchParams)

    window.history.replaceState(
      window.history.state,
      "",
      url.toString()
    )
  }

  const setOptionValue = (
    optionId: string,
    value: string
  ) => {
    setCartError("")

    const colorId = colorOptionId
    const sizeId = sizeOptionId

    let nextVariantId:
      | string
      | undefined

    setOptions((previous) => {
      const next = {
        ...previous,
        [optionId]: value,
      }

      /*
       * Color बदलने पर previously selected size
       * अगर नए color में unavailable है तो size clear.
       */
      if (
        colorId &&
        sizeId &&
        optionId === colorId
      ) {
        const selectedSize =
          previous[sizeId]

        if (selectedSize) {
          const matchingVariant =
            (
              product.variants ?? []
            ).find((variant) => {
              const map =
                optionsAsKeymap(
                  variant.options
                ) ?? {}

              return (
                map[colorId] === value &&
                map[sizeId] === selectedSize
              )
            })

          if (
            !variantAvailable(
              matchingVariant
            )
          ) {
            delete next[sizeId]
          }
        }
      }

      const matchingVariant =
        (
          product.variants ?? []
        ).find((variant) =>
          isEqual(
            optionsAsKeymap(
              variant.options
            ),
            next
          )
        )

      nextVariantId =
        matchingVariant?.id

      return next
    })

    /*
     * Hover preview intentionally disabled.
     * Gallery changes only after an actual color click.
     */
    if (
      colorId &&
      optionId === colorId
    ) {
      const images =
        getImagesForColor(value)

      if (images.length) {
        window.dispatchEvent(
          new CustomEvent(
            "product-color-commit",
            {
              detail: {
                images,
              },
            }
          )
        )
      }
    }

    updateUrlWithoutNavigation(
      (params) => {
        if (
          colorId &&
          optionId === colorId
        ) {
          params.set(
            "color",
            value
          )

          const currentSize =
            sizeId
              ? options[sizeId]
              : undefined

          if (
            currentSize &&
            sizeId
          ) {
            const valid =
              (
                product.variants ?? []
              ).some((variant) => {
                const map =
                  optionsAsKeymap(
                    variant.options
                  ) ?? {}

                return (
                  map[colorId] === value &&
                  map[sizeId] === currentSize &&
                  variantAvailable(variant)
                )
              })

            if (!valid) {
              params.delete("size")
            }
          }
        }

        if (
          sizeId &&
          optionId === sizeId
        ) {
          params.set(
            "size",
            value
          )

          const selectedColor =
            colorId
              ? options[colorId]
              : undefined

          if (
            selectedColor &&
            colorId
          ) {
            params.set(
              "color",
              selectedColor
            )

            const variant =
              (
                product.variants ?? []
              ).find((item) => {
                const map =
                  optionsAsKeymap(
                    item.options
                  ) ?? {}

                return (
                  map[colorId] === selectedColor &&
                  map[sizeId] === value
                )
              })

            nextVariantId =
              variant?.id
          }
        }

        if (nextVariantId) {
          params.set(
            "v_id",
            nextVariantId
          )
        } else {
          params.delete("v_id")
        }
      }
    )
  }

  const isValidVariant =
    useMemo(() => {
      if (
        !product.options?.length
      ) {
        return false
      }

      if (
        Object.keys(options).filter(
          (key) =>
            options[key] !==
            undefined
        ).length !==
        product.options.length
      ) {
        return false
      }

      return Boolean(
        selectedVariant
      )
    }, [
      options,
      product.options?.length,
      selectedVariant,
    ])

  const inStock =
    selectedVariant
      ? variantAvailable(
          selectedVariant
        )
      : false

  const actionsRef =
    useRef<HTMLDivElement>(null)

  const inView =
    useIntersection(
      actionsRef,
      "0px"
    )

  const getSelectedVariantCartImage = (
    variant: HttpTypes.StoreProductVariant
  ) => {
    const variantUrls =
      new Set(
        (variant.images ?? [])
          .map((image) =>
            image.url?.trim()
          )
          .filter(
            (url): url is string =>
              Boolean(url)
          )
      )

    const firstInProductGallery =
      product.images?.find(
        (image) =>
          Boolean(image.url) &&
          variantUrls.has(
            image.url!
          )
      )?.url

    return (
      firstInProductGallery ||
      variant.images?.find(
        (image) =>
          Boolean(image.url)
      )?.url ||
      product.thumbnail ||
      undefined
    )
  }

  const dispatchOptimisticCartAdd = (
    variant: HttpTypes.StoreProductVariant,
    optimisticId: string
  ) => {
    const calculatedPrice =
      variant.calculated_price as
        | {
            calculated_amount?: number | null
          }
        | undefined

    const color =
      colorOptionId
        ? options[colorOptionId]
        : undefined

    const size =
      sizeOptionId
        ? options[sizeOptionId]
        : undefined

    window.dispatchEvent(
      new CustomEvent(
        "safafi-cart-optimistic-add",
        {
          detail: {
            optimisticId,
            variantId: variant.id,
            title:
              product.title ||
              "Product",
            productHandle:
              product.handle,
            image:
              getSelectedVariantCartImage(
                variant
              ),
            color,
            size,
            quantity: 1,
            unitPrice:
              calculatedPrice?.calculated_amount ??
              0,
            currencyCode:
              region.currency_code,
          },
        }
      )
    )
  }

  const dispatchCartServerSync = (
    optimisticId: string,
    cart: HttpTypes.StoreCart
  ) => {
    window.dispatchEvent(
      new CustomEvent(
        "safafi-cart-server-sync",
        {
          detail: {
            optimisticId,
            cart,
          },
        }
      )
    )
  }

  const dispatchCartRollback = (
    optimisticId: string
  ) => {
    window.dispatchEvent(
      new CustomEvent(
        "safafi-cart-optimistic-rollback",
        {
          detail: {
            optimisticId,
          },
        }
      )
    )
  }

  const handleAddToCart =
    async () => {
      if (
        !selectedVariant?.id ||
        !inStock ||
        addRequestPendingRef.current
      ) {
        return
      }

      const variant =
        selectedVariant

      const variantId =
        variant.id

      const optimisticId =
        `optimistic-${variantId}-${Date.now()}`

      const previousCartQuantity =
        cartQty[variantId] ?? 0

      const nextCartQuantity =
        previousCartQuantity + 1

      /*
       * INSTANT premium UX:
       * 1. Drawer opens immediately.
       * 2. Full selected item appears immediately.
       * 3. No disabled cursor and no "Adding..." wait state.
       * 4. Medusa request continues in the background.
       */
      addRequestPendingRef.current =
        true

      setCartError("")

      setCartQty((previous) => ({
        ...previous,
        [variantId]:
          nextCartQuantity,
      }))

      dispatchOptimisticCartAdd(
        variant,
        optimisticId
      )

      try {
        const result =
          await addToCart({
            variantId,
            quantity: 1,
            countryCode,
          })

        if (!result.success) {
          setCartQty(
            (previous) => ({
              ...previous,
              [variantId]:
                previousCartQuantity,
            })
          )

          dispatchCartRollback(
            optimisticId
          )

          setCartError(
            result.reason ===
              "OUT_OF_STOCK"
              ? "This size is no longer available."
              : result.message
          )

          return
        }

        /*
         * Replace the temporary row with Medusa's real updated cart.
         * No router.refresh is required for the drawer.
         */
        dispatchCartServerSync(
          optimisticId,
          result.cart
        )

        if (
          variant.manage_inventory &&
          !variant.allow_backorder &&
          (variant.inventory_quantity ??
            0) -
            nextCartQuantity <=
            0 &&
          sizeOptionId
        ) {
          setOptions(
            (previous) => {
              const next = {
                ...previous,
              }

              delete next[
                sizeOptionId
              ]

              return next
            }
          )
        }
      } catch (error) {
        console.error(
          "Add to cart failed:",
          error
        )

        setCartQty(
          (previous) => ({
            ...previous,
            [variantId]:
              previousCartQuantity,
          })
        )

        dispatchCartRollback(
          optimisticId
        )

        setCartError(
          "Unable to add this item to your bag. Please try again."
        )
      } finally {
        addRequestPendingRef.current =
          false
      }
    }

  const buttonLabel =
    !selectedVariant
      ? "Select variant"
      : !inStock
        ? "Out of stock"
        : "Add to Shopping Bag"

  return (
    <div
      className="flex flex-col"
      ref={actionsRef}
    >
      <div className="mb-7 border-b border-black/10 pb-6">
        <ProductPrice
          product={product}
          variant={selectedVariant}
        />
      </div>

      {(product.variants?.length ??
        0) > 1 && (
        <div className="flex flex-col gap-y-6">
          {orderedProductOptions.map(
            (option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={
                  options[
                    option.id
                  ]
                }
                updateOption={
                  setOptionValue
                }
                swatchImages={
                  option.id ===
                  colorOptionId
                    ? colorSwatchImages
                    : undefined
                }
                optionAvailability={
                  option.id ===
                  sizeOptionId
                    ? sizeAvailability
                    : undefined
                }
                title={
                  option.title ?? ""
                }
                data-testid="product-options"
                disabled={
                  !!disabled
                }
              />
            )
          )}

          <Divider />
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={
          !inStock ||
          !selectedVariant ||
          !!disabled ||
          !isValidVariant
        }
        data-testid="add-product-button"
        className="mt-6 h-[48px] w-full border border-[#241c18] bg-[#241c18] px-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#241c18] disabled:border-black/10 disabled:bg-[#f4f2ef] disabled:text-black/35"
      >
        {buttonLabel}
      </button>

      {cartError && (
        <p
          role="alert"
          className="mt-2 text-[11px] leading-4 text-red-600"
        >
          {cartError}
        </p>
      )}

      <button
        type="button"
        className="mt-4 h-[42px] w-full border border-black/15 bg-white px-5 text-[12px] font-medium text-[#2d2926] transition-colors hover:border-black"
      >
        Add to Saved
      </button>

      <div className="mt-5 space-y-1.5 border-t border-black/10 pt-5 text-[11px] leading-5 text-[#5f5953]">
        <p>
          Available for in-store pick
          up{" "}
          <span className="underline underline-offset-2">
            see locations
          </span>
        </p>

        <p>
          Shipped within 24 hours
        </p>

        <p>
          Easy self-service returns
        </p>
      </div>

      <MobileActions
        product={product}
        variant={selectedVariant}
        options={options}
        updateOptions={
          setOptionValue
        }
        inStock={inStock}
        handleAddToCart={
          handleAddToCart
        }
        isAdding={false}
        show={!inView}
        optionsDisabled={
          !!disabled
        }
      />
    </div>
  )
}