import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"

import PreviewPrice from "./price"
import ProductPreviewMedia from "./product-preview-media"

type ProductPreviewProps = {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion

  /*
   * Canonical category route that led to this card.
   *
   * Example:
   * women/womens-clothing/womens-t-shirts
   */
  categoryPath?: string

  /*
   * Product Showcase is itself a horizontal carousel.
   * Disable nested mobile image-swipe there so one gesture
   * has one clear meaning: move between products.
   *
   * Category / Store cards keep their existing image swipe.
   */
  disableMobileImageSwipe?: boolean
}

type StorefrontSwatch = {
  imageUrl: string
  x: number
  y: number
  zoom: number
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

const normalize = (
  value?: string | null
) => {
  return value?.trim().toLowerCase() ?? ""
}

const makeProductUrl = ({
  handle,
  color,
  size,
  variantId,
  categoryPath,
}: {
  handle: string
  color?: string
  size?: string
  variantId?: string
  categoryPath?: string
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

  /*
   * Keep the category context all the way to the product page.
   * This is what makes:
   *
   * Women · Clothing · T-Shirts · Product
   *
   * deterministic instead of guessing from product relations.
   */
  if (categoryPath) {
    params.set(
      "from",
      categoryPath
    )
  }

  const query = params.toString()

  return `/products/${handle}${
    query ? `?${query}` : ""
  }`
}

export default async function ProductPreview({
  product,
  isFeatured = false,
  region: _region,
  categoryPath,
  disableMobileImageSwipe = false,
}: ProductPreviewProps) {
  if (!product?.id || !product.handle) {
    return null
  }

  const { cheapestPrice } =
    getProductPrice({
      product,
    })

  const handle = product.handle

  const productHref =
    makeProductUrl({
      handle,
      categoryPath,
    })

  const colorOption =
    product.options?.find((option) => {
      const title =
        normalize(option.title)

      return (
        title === "color" ||
        title === "colour" ||
        title === "colors" ||
        title === "colours"
      )
    })

  const sizeOption =
    product.options?.find(
      (option) =>
        normalize(option.title) ===
        "size"
    )

  const colorOptionId =
    colorOption?.id

  const sizeOptionId =
    sizeOption?.id

  const colorValues =
    colorOption?.values
      ?.map((item) => item.value)
      .filter(
        (value): value is string =>
          Boolean(value)
      ) ?? []

  const sizeValues =
    sizeOption?.values
      ?.map((item) => item.value)
      .filter(
        (value): value is string =>
          Boolean(value)
      ) ?? []

  const variants =
    product.variants ?? []

  const getVariantColor = (
    variant: HttpTypes.StoreProductVariant
  ) => {
    if (!colorOptionId) {
      return undefined
    }

    return variant.options?.find(
      (option) =>
        option.option_id ===
        colorOptionId
    )?.value
  }

  const getVariantSize = (
    variant: HttpTypes.StoreProductVariant
  ) => {
    if (!sizeOptionId) {
      return undefined
    }

    return variant.options?.find(
      (option) =>
        option.option_id ===
        sizeOptionId
    )?.value
  }

  const rawColorSwatches =
    product.metadata
      ?.showcase_color_swatches

  const colorSwatchEntries =
    rawColorSwatches &&
    typeof rawColorSwatches ===
      "object" &&
    !Array.isArray(
      rawColorSwatches
    )
      ? Object.entries(
          rawColorSwatches as Record<
            string,
            unknown
          >
        )
      : []

  const getConfiguredSwatch = (
    color: string
  ): StorefrontSwatch | undefined => {
    const entry =
      colorSwatchEntries.find(
        ([key]) =>
          normalize(key) ===
          normalize(color)
      )?.[1]

    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry)
    ) {
      return undefined
    }

    const value =
      entry as Record<
        string,
        unknown
      >

    const imageUrl =
      typeof value.image_url ===
      "string"
        ? value.image_url
        : ""

    if (!imageUrl) {
      return undefined
    }

    return {
      imageUrl,
      x:
        typeof value.x === "number"
          ? value.x
          : 50,
      y:
        typeof value.y === "number"
          ? value.y
          : 50,
      zoom:
        typeof value.zoom ===
        "number"
          ? value.zoom
          : 2.5,
    }
  }

  const getColorImages = (
    color: string
  ) => {
    const seen =
      new Set<string>()

    const colorImages: {
      id?: string
      url: string
    }[] = []

    variants
      .filter(
        (variant) =>
          normalize(
            getVariantColor(variant)
          ) === normalize(color)
      )
      .forEach((variant) => {
        variant.images
          ?.filter(
            (image) =>
              Boolean(image.url)
          )
          .forEach((image) => {
            const url = image.url!

            if (seen.has(url)) {
              return
            }

            seen.add(url)

            colorImages.push({
              id: image.id,
              url,
            })
          })
      })

    return colorImages
  }

  /*
   * Product Builder's Main Card Image is the canonical first
   * storefront representation of this product.
   *
   * IMPORTANT:
   * Medusa option order is NOT presentation order. If Black was
   * created first but the Main Card Image belongs to White, White
   * must be selected on the card initially.
   */
  const primaryImage =
    typeof product.metadata?.showcase_primary_image_url ===
      "string" &&
    product.metadata.showcase_primary_image_url.trim()
      ? product.metadata.showcase_primary_image_url.trim()
      : product.thumbnail || undefined

  const flipImage =
    typeof product.metadata?.showcase_flip_image_url ===
      "string" &&
    product.metadata.showcase_flip_image_url.trim()
      ? product.metadata.showcase_flip_image_url.trim()
      : undefined

  const defaultColor =
    colorValues.find((color) => {
      const urls =
        getColorImages(color).map(
          (image) => image.url
        )

      return Boolean(
        (primaryImage &&
          urls.includes(primaryImage)) ||
        (!primaryImage &&
          flipImage &&
          urls.includes(flipImage))
      )
    }) ?? colorValues[0]

  const buildSizeLinks = (
    color?: string
  ) =>
    sizeValues.map((size) => {
      const matchingVariant =
        variants.find((variant) => {
          const variantColor =
            getVariantColor(variant)

          const variantSize =
            getVariantSize(variant)

          const colorMatches =
            !color ||
            !colorOptionId ||
            normalize(variantColor) ===
              normalize(color)

          const sizeMatches =
            normalize(variantSize) ===
            normalize(size)

          return (
            colorMatches &&
            sizeMatches
          )
        })

      return {
        value: size,

        available:
          Boolean(matchingVariant),

        href: makeProductUrl({
          handle,
          color,
          size,
          variantId:
            matchingVariant?.id,
          categoryPath,
        }),
      }
    })

  const colorLinks =
    colorValues.map((color) => {
      const matchingVariant =
        variants.find(
          (variant) =>
            normalize(
              getVariantColor(variant)
            ) === normalize(color)
        )

      return {
        value: color,

        swatch:
          getConfiguredSwatch(
            color
          ),

        fallback:
          FALLBACK_COLORS[
            normalize(color)
          ] ?? "#d5d0ca",

        href: makeProductUrl({
          handle,
          color,
          variantId:
            matchingVariant?.id,
          categoryPath,
        }),

        images:
          getColorImages(color),

        sizes:
          buildSizeLinks(color),
      }
    })

  const sizeLinks =
    buildSizeLinks(defaultColor)

  return (
    <article
      className="group/card"
      data-testid="product-wrapper"
    >
      <ProductPreviewMedia
        title={
          product.title ||
          "Product"
        }
        href={productHref}
        thumbnail={
          primaryImage ||
          product.thumbnail
        }
        primaryImage={
          primaryImage
        }
        defaultColor={
          defaultColor
        }
        images={
          product.images
            ?.filter(
              (image) =>
                Boolean(image.url)
            )
            .map((image) => ({
              id: image.id,
              url: image.url!,
            })) ?? []
        }
        flipImage={flipImage}
        colors={colorLinks}
        sizes={sizeLinks}
        isFeatured={isFeatured}
        disableMobileImageSwipe={
          disableMobileImageSwipe
        }
      />

      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <LocalizedClientLink
            href={productHref}
            className="min-w-0 flex-1"
          >
            <h3
              className="
                truncate
                text-[12px]
                font-normal
                leading-[1.4]
                tracking-normal
                text-black
                transition-opacity
                hover:opacity-60
              "
              data-testid="product-title"
              style={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {product.title}
            </h3>
          </LocalizedClientLink>

          {cheapestPrice && (
            <div
              className="shrink-0 text-[12px] font-normal leading-[1.4] tracking-normal text-black"
              style={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              <PreviewPrice
                price={cheapestPrice}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
