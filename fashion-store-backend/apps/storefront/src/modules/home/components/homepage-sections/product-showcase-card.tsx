import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import { getProductPrice } from "@lib/util/get-product-price"
import PreviewPrice from "@modules/products/components/product-preview/price"

import ProductShowcaseCardMedia from "./product-showcase-card-media"

type ProductShowcaseCardProps = {
  product: HttpTypes.StoreProduct
  imageRatio?: "portrait" | "square" | "landscape" | "editorial"
  showPrice?: boolean
  showBadge?: boolean
  showSwatches?: boolean
}

const FALLBACK_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#c32032",
  blue: "#2f5f9f",
  navy: "#1d2b44",
  green: "#47735a",
  olive: "#77784c",
  beige: "#d8c8aa",
  cream: "#f3ecdf",
  ivory: "#f6f1e8",
  brown: "#725039",
  grey: "#868686",
  gray: "#868686",
  charcoal: "#414141",
  pink: "#d89aaa",
  purple: "#755486",
  orange: "#d97932",
  yellow: "#e1c745",
  burgundy: "#74263a",
  maroon: "#6b2332",
  teal: "#397878",
  khaki: "#b2a474",
}

const normalizeValue = (
  value?: string | null
) => {
  return value?.trim().toLowerCase() ?? ""
}

const makeProductUrl = ({
  handle,
  color,
  size,
  variantId,
}: {
  handle: string
  color?: string
  size?: string
  variantId?: string
}) => {
  const params = new URLSearchParams()

  if (color) {
    params.set("color", color)
  }

  if (size) {
    params.set("size", size)
  }

  if (variantId) {
    params.set("v_id", variantId)
  }

  const query = params.toString()

  return `/products/${handle}${
    query ? `?${query}` : ""
  }`
}

const getColorOption = (
  product: HttpTypes.StoreProduct
) => {
  return product.options?.find((option) => {
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
  })
}

const getSizeOption = (
  product: HttpTypes.StoreProduct
) => {
  return product.options?.find(
    (option) =>
      option.title
        ?.trim()
        .toLowerCase() === "size"
  )
}

const getVariantColor = (
  variant: HttpTypes.StoreProductVariant,
  colorOptionId?: string
) => {
  if (!colorOptionId) {
    return undefined
  }

  return variant.options?.find(
    (option) =>
      option.option_id === colorOptionId
  )?.value
}

const getVariantSize = (
  variant: HttpTypes.StoreProductVariant,
  sizeOptionId?: string
) => {
  if (!sizeOptionId) {
    return undefined
  }

  return variant.options?.find(
    (option) =>
      option.option_id === sizeOptionId
  )?.value
}

export default function ProductShowcaseCard({
  product,
  imageRatio = "portrait",
  showPrice = true,
  showBadge = true,
  showSwatches = true,
}: ProductShowcaseCardProps) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const colorOption =
    getColorOption(product)

  const sizeOption =
    getSizeOption(product)

  const colorOptionId =
    colorOption?.id

  const sizeOptionId =
    sizeOption?.id

  const colorValues =
    colorOption?.values
      ?.map((value) => value.value)
      .filter(Boolean) ?? []

  const sizeValues =
    sizeOption?.values
      ?.map((value) => value.value)
      .filter(Boolean) ?? []

  const defaultColor =
    colorValues[0] || undefined

  /*
   * हर color के लिए पहली actual variant image.
   * यही image swatch crop में use होगी.
   */
  const colorImageMap =
    new Map<string, string>()

  for (const variant of product.variants ?? []) {
    const variantColor =
      getVariantColor(
        variant,
        colorOptionId
      )

    const imageUrl =
      variant.images?.[0]?.url

    if (
      variantColor &&
      imageUrl &&
      !colorImageMap.has(
        normalizeValue(variantColor)
      )
    ) {
      colorImageMap.set(
        normalizeValue(variantColor),
        imageUrl
      )
    }
  }

  const primaryImageUrl =
    typeof product.metadata
      ?.showcase_primary_image_url === "string" &&
    product.metadata.showcase_primary_image_url.trim()
      ? product.metadata.showcase_primary_image_url
      : undefined

  const flipImageUrl =
    typeof product.metadata
      ?.showcase_flip_image_url === "string" &&
    product.metadata.showcase_flip_image_url.trim()
      ? product.metadata.showcase_flip_image_url
      : undefined

  const colorLinks =
    colorValues.map((color) => {
      const matchingVariant =
        (
          product.variants ?? []
        ).find((variant) => {
          return (
            normalizeValue(
              getVariantColor(
                variant,
                colorOptionId
              )
            ) ===
            normalizeValue(color)
          )
        })

      return {
        value: color,

        href: makeProductUrl({
          handle:
            product.handle || "",
          color,
          variantId:
            matchingVariant?.id,
        }),

        image:
          colorImageMap.get(
            normalizeValue(color)
          ),

        fallbackColor:
          FALLBACK_COLORS[
            normalizeValue(color)
          ] ?? "#d5d0ca",
      }
    })

  const sizeLinks =
    sizeValues.map((size) => {
      const matchingVariant =
        (
          product.variants ?? []
        ).find((variant) => {
          const variantColor =
            getVariantColor(
              variant,
              colorOptionId
            )

          const variantSize =
            getVariantSize(
              variant,
              sizeOptionId
            )

          return (
            (!defaultColor ||
              normalizeValue(
                variantColor
              ) ===
                normalizeValue(
                  defaultColor
                )) &&
            normalizeValue(
              variantSize
            ) ===
              normalizeValue(size)
          )
        })

      return {
        value: size,

        href: makeProductUrl({
          handle:
            product.handle || "",
          color:
            defaultColor,
          size,
          variantId:
            matchingVariant?.id,
        }),

        available:
          Boolean(matchingVariant),
      }
    })

  return (
    <article className="group/card">
      <ProductShowcaseCardMedia
        title={
          product.title || "Product"
        }
        handle={
          product.handle || ""
        }
        thumbnail={
          primaryImageUrl ??
          product.thumbnail
        }
        images={
          product.images?.map(
            (image) => ({
              id: image.id,
              url: image.url,
            })
          ) ?? []
        }
        flipImageUrl={
          flipImageUrl
        }
        sizes={sizeLinks}
        colors={colorLinks.map(
          (item) => ({
            value: item.value,
            href: item.href,
            color:
              item.fallbackColor,
          })
        )}
        imageRatio={
          imageRatio
        }
        showBadge={
          showBadge
        }
      />

      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="min-w-0 flex-1"
          >
            <h3 className="truncate text-[12px] font-medium text-[#302823] transition-opacity hover:opacity-60 md:text-[13px]">
              {product.title}
            </h3>
          </LocalizedClientLink>

          {showPrice &&
            cheapestPrice && (
              <div className="shrink-0 text-[12px] text-[#302823] md:text-[13px]">
                <PreviewPrice
                  price={
                    cheapestPrice
                  }
                />
              </div>
            )}
        </div>

        {colorValues.length > 0 && (
          <p className="mt-1 text-[11px] text-[#746a63]">
            {colorValues[0]}
          </p>
        )}

        {showSwatches &&
          colorLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {colorLinks
                .slice(0, 6)
                .map(
                  (
                    item,
                    index
                  ) => (
                    <LocalizedClientLink
                      key={
                        item.value
                      }
                      href={
                        item.href
                      }
                      title={
                        item.value
                      }
                      aria-label={`View ${product.title} in ${item.value}`}
                      className={[
                        "relative block h-[18px] w-[18px] overflow-hidden border border-black/15 bg-[#eee] transition-transform hover:scale-110",

                        index === 0
                          ? "ring-1 ring-[#29231d] ring-offset-2"
                          : "",
                      ].join(
                        " "
                      )}
                    >
                      {item.image ? (
                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={
                              item.image
                            }
                            alt=""
                            loading="lazy"
                            draggable={
                              false
                            }
                            className="absolute inset-0 h-full w-full scale-[2.8] object-cover object-[50%_35%]"
                          />
                        </div>
                      ) : (
                        <span
                          className="absolute inset-0"
                          style={{
                            backgroundColor:
                              item.fallbackColor,
                          }}
                        />
                      )}
                    </LocalizedClientLink>
                  )
                )}

              {colorLinks.length > 6 && (
                <span className="text-[10px] text-black/45">
                  +
                  {colorLinks.length - 6}
                </span>
              )}
            </div>
          )}
      </div>
    </article>
  )
}