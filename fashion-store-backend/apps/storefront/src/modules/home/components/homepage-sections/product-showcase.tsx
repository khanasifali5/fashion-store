import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { HttpTypes } from "@medusajs/types"
import type React from "react"

import ProductPreview from "@modules/products/components/product-preview"
import ProductShowcaseSlider from "./product-showcase-slider"

import type { ProductShowcaseConfig } from "@lib/data/homepage-sections"
import { HOMEPAGE_WIDTH } from "./spacing"

type ProductShowcaseSource =
  | "collection"
  | "category"
  | "manual"
  | "new_arrivals"

type ExtendedProductShowcaseConfig =
  ProductShowcaseConfig & {
    source_type?: ProductShowcaseSource
    category_id?: string | null
    category_handle?: string | null
    category_name?: string | null
    category_path?: string | null
    manual_product_ids?: string[]
  }

type ProductShowcaseProps = {
  title?: string | null
  config: ExtendedProductShowcaseConfig
  region: HttpTypes.StoreRegion
}

const PRODUCT_FIELDS =
  "id,title,handle,thumbnail,metadata,*images,*options,*options.values,*variants.options,*variants.images,*variants.calculated_price"

export default async function ProductShowcase({
  title,
  config,
  region,
}: ProductShowcaseProps) {
  /*
   * Backward compatibility:
   * old sections only stored collection_handle.
   */
  const sourceType: ProductShowcaseSource =
    config.source_type || "collection"

  const productCount = Math.max(
    1,
    Math.min(config.product_count ?? 8, 16)
  )

  /*
   * RESPONSIVE MASTER
   *
   * Admin controls desktop density only.
   * Tablet/mobile automatically use readable 2-card rows.
   */
  const desktopColumns =
    Math.min(
      Math.max(
        Number(config.desktop_columns) || 4,
        2
      ),
      6
    )

  const desktopGap =
    20

  const desktopBasis =
    `calc((100% - ${
      desktopGap * (desktopColumns - 1)
    }px) / ${desktopColumns})`

  let products: HttpTypes.StoreProduct[] = []
  let fallbackTitle = "Featured Products"
  let ctaHref = "/store"
  let categoryPath: string | undefined

  if (sourceType === "collection") {
    const collectionHandle =
      config.collection_handle

    if (!collectionHandle) {
      return null
    }

    const { collections } =
      await listCollections({
        handle: collectionHandle,
        fields: "id,title,handle",
      })

    const collection =
      collections?.find(
        (item) =>
          item.handle === collectionHandle
      )

    if (!collection) {
      return null
    }

    const result =
      await listProducts({
        regionId: region.id,
        queryParams: {
          collection_id: collection.id,
          limit: productCount,
          fields: PRODUCT_FIELDS,
        },
      })

    products =
      result.response.products || []

    fallbackTitle = collection.title
    ctaHref =
      `/collections/${collection.handle}`
  }

  if (sourceType === "category") {
    const categoryId =
      config.category_id

    if (!categoryId) {
      return null
    }

    const result =
      await listProducts({
        regionId: region.id,
        queryParams: {
          category_id: [categoryId],
          limit: productCount,
          fields: PRODUCT_FIELDS,
        },
      })

    products =
      result.response.products || []

    fallbackTitle =
      config.category_name ||
      "Shop the Category"

    categoryPath =
      config.category_path ||
      config.category_handle ||
      undefined

    ctaHref = categoryPath
      ? `/categories/${categoryPath}`
      : "/store"
  }

  if (sourceType === "manual") {
    const manualProductIds =
      Array.from(
        new Set(
          (
            config.manual_product_ids ||
            []
          ).filter(Boolean)
        )
      ).slice(0, 16)

    if (!manualProductIds.length) {
      return null
    }

    const result =
      await listProducts({
        regionId: region.id,
        queryParams: {
          id: manualProductIds,
          limit: manualProductIds.length,
          fields: PRODUCT_FIELDS,
        },
      })

    const byId = new Map(
      (
        result.response.products ||
        []
      ).map((product) => [
        product.id,
        product,
      ])
    )

    /*
     * Preserve the exact curated Admin order.
     */
    products =
      manualProductIds
        .map((id) => byId.get(id))
        .filter(
          (
            product
          ): product is HttpTypes.StoreProduct =>
            Boolean(product)
        )
        .slice(0, productCount)

    fallbackTitle = "Featured Products"
    ctaHref = "/store"
  }

  if (sourceType === "new_arrivals") {
    const result =
      await listProducts({
        regionId: region.id,
        queryParams: {
          limit: productCount,
          order: "-created_at",
          fields: PRODUCT_FIELDS,
        },
      })

    products =
      result.response.products || []

    fallbackTitle = "New Arrivals"
    ctaHref = "/store"
  }

  if (!products.length) {
    return null
  }

  const topSpacing = Math.max(
    config.top_spacing ?? 48,
    0
  )

  const bottomSpacing = Math.max(
    config.bottom_spacing ?? 48,
    0
  )

  const background =
    config.background || "#FFFFFF"

  const width =
    config.width || "contained"

  const visibilityClass =
    config.desktop_visible === false &&
    config.mobile_visible === false
      ? "hidden"
      : config.desktop_visible === false
        ? "lg:hidden"
        : config.mobile_visible === false
          ? "hidden lg:block"
          : ""

  const showcaseProducts =
    products.slice(0, productCount)

  return (
    <section
      className={visibilityClass}
      style={{
        backgroundColor: background,
        paddingTop: `${topSpacing}px`,
        paddingBottom: `${bottomSpacing}px`,
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        <ProductShowcaseSlider
          title={
            title || fallbackTitle
          }
          subtitle={
            config.subtitle
          }
          ctaHref={ctaHref}
        >
          {showcaseProducts.map(
            (product) => (
              <div
                key={product.id}
                data-showcase-slide
                className="
                  product-showcase-responsive-slide
                  relative
                  shrink-0
                  snap-start
                "
                style={{
                  "--product-showcase-desktop-basis":
                    desktopBasis,
                } as React.CSSProperties}
              >
                {/*
                 * "New In" is deliberately subtle:
                 * no dark block, no loud sale-style badge.
                 *
                 * Show it only when this Showcase is actually
                 * a New Arrivals/New section.
                 */}
                {(
                  sourceType ===
                    "new_arrivals" ||
                  /\bnew\b/i.test(
                    title ||
                      fallbackTitle
                  )
                ) && (
                  <span
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-3
                      z-30
                      bg-white/80
                      px-2
                      py-1
                      text-[9px]
                      font-normal
                      tracking-[0.06em]
                      text-[#29231d]
                      backdrop-blur-[1px]
                    "
                    style={{
                      fontFamily:
                        '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    }}
                  >
                    New In
                  </span>
                )}

                <ProductPreview
                  product={product}
                  region={region}
                  categoryPath={
                    categoryPath
                  }
                />
              </div>
            )
          )}
        </ProductShowcaseSlider>

        <style>{`
          .product-showcase-responsive-slide {
            flex-basis: calc((100% - 20px) / 2);
          }

          @media (min-width: 1024px) {
            .product-showcase-responsive-slide {
              flex-basis: var(--product-showcase-desktop-basis);
            }
          }
        `}</style>
      </div>
    </section>
  )
}
