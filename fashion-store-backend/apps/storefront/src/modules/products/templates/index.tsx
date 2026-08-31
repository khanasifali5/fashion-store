import React, {
  Fragment,
  Suspense,
} from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import StyleWithProducts from "@modules/products/components/style-with-products"
import SimilarItems from "@modules/products/components/similar-items"
import RecentlyViewedProducts from "@modules/products/components/recently-viewed-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  categoryBreadcrumb?:
    HttpTypes.StoreProductCategory[]
}

const ProductTemplate: React.FC<
  ProductTemplateProps
> = ({
  product,
  region,
  countryCode,
  images,
  categoryBreadcrumb = [],
}) => {
  if (!product?.id) {
    return notFound()
  }

  return (
    <>
      <section
        className="mx-auto w-full max-w-[1186px] px-4 pb-12 pt-4 lg:px-0 lg:pb-20 lg:pt-0"
        data-testid="product-container"
        style={{
          fontFamily:
            '"Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <div className="grid grid-cols-1 items-start lg:grid-cols-[530px_minmax(0,1fr)] lg:gap-x-[100px]">
          <div className="w-full">
            <ImageGallery
              images={images}
            />
          </div>

          <aside className="w-full py-8 lg:sticky lg:top-[112px] lg:max-w-[500px] lg:self-start lg:py-0">
            {/* =====================================================
                CATEGORY BREADCRUMB
                Same styling as category page, positioned above product title.
            ====================================================== */}
            {categoryBreadcrumb.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="
                  mb-5
                  flex
                  flex-wrap
                  items-center
                  gap-x-2
                  gap-y-1
                  text-[12px]
                  font-normal
                  leading-5
                  text-black
                "
              >
                {categoryBreadcrumb.map(
                  (crumb, index) => {
                    const isLast =
                      index ===
                      categoryBreadcrumb.length - 1

                    const href =
                      `/categories/${categoryBreadcrumb
                        .slice(0, index + 1)
                        .map(
                          (item) =>
                            item.handle
                        )
                        .filter(Boolean)
                        .join("/")}`

                    return (
                      <Fragment key={crumb.id}>
                        {index > 0 && (
                          <span
                            aria-hidden="true"
                            className="text-black/45"
                          >
                            ·
                          </span>
                        )}

                        {isLast ? (
                          <span
                            aria-current="location"
                            className="text-[12px] font-normal leading-5 text-black"
                          >
                            {crumb.name}
                          </span>
                        ) : (
                          <LocalizedClientLink
                            href={href}
                            className="transition-opacity hover:opacity-55"
                          >
                            {crumb.name}
                          </LocalizedClientLink>
                        )}
                      </Fragment>
                    )
                  }
                )}
              </nav>
            )}

            {/*
             * Collection is only a fallback when no category
             * breadcrumb can be resolved.
             */}
            {categoryBreadcrumb.length === 0 &&
              product.collection && (
                <LocalizedClientLink
                  href={`/collections/${product.collection.handle}`}
                  className="mb-12 block text-[12px] font-normal leading-5 text-black transition-opacity hover:opacity-55"
                >
                  {product.collection.title}
                </LocalizedClientLink>
              )}

            <h1
              className="mb-5 text-[12px] font-normal leading-5 text-black"
              data-testid="product-title"
            >
              {product.title}
            </h1>

            <Suspense
              fallback={
                <ProductActions
                  disabled
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper
                id={product.id}
                region={region}
              />
            </Suspense>

            {product.description && (
              <div className="mt-9 border-t border-black/10 pt-7">
                <p
                  className="max-w-[500px] whitespace-pre-line text-[12px] font-normal leading-5 text-black"
                  data-testid="product-description"
                >
                  {product.description}
                </p>
              </div>
            )}

            <div
              className="
                mt-7
                border-t
                border-black/10
                text-[12px]
                font-normal
                leading-5
                text-black
                [&_a]:text-[12px]
                [&_a]:font-normal
                [&_a]:leading-5
                [&_button]:text-[12px]
                [&_button]:font-normal
                [&_button]:leading-5
                [&_p]:text-[12px]
                [&_p]:font-normal
                [&_p]:leading-5
                [&_span]:text-[12px]
                [&_span]:font-normal
                [&_span]:leading-5
              "
              style={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              <ProductTabs
                product={product}
              />
            </div>

            <Suspense fallback={null}>
              <StyleWithProducts
                product={product}
                region={region}
                countryCode={countryCode}
              />
            </Suspense>
          </aside>
        </div>
      </section>

      <Suspense fallback={null}>
        <SimilarItems
          product={product}
          region={region}
          countryCode={countryCode}
          categoryId={
            categoryBreadcrumb[
              categoryBreadcrumb.length - 1
            ]?.id
          }
        />
      </Suspense>

      <Suspense fallback={null}>
        <RecentlyViewedProducts
          currentProductId={
            product.id
          }
          region={region}
          countryCode={
            countryCode
          }
        />
      </Suspense>
    </>
  )
}

export default ProductTemplate