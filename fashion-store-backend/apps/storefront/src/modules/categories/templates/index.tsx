import { Fragment } from "react"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { getCategoryIdsWithDescendants } from "@lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

type CategoryFilterOption = {
  id: string
  title: string
  values: Array<{
    id: string
    value: string
  }>
}

type CategoryFiltersResponse = {
  category_id: string
  options: CategoryFilterOption[]
  availability: {
    supported: boolean
    in_stock_product_ids: string[]
    in_stock_count: number
    total_products: number
  }
}

const getCategoryFilters = async (
  categoryIds: string[]
): Promise<CategoryFiltersResponse> => {
  try {
    const headers = {
      ...(await getAuthHeaders()),
    }

    return await sdk.client.fetch<CategoryFiltersResponse>(
      "/store/category-filters",
      {
        method: "GET",
        query: {
          category_id:
            categoryIds[0],
          category_ids:
            categoryIds.join(","),
        },
        headers,
        cache: "no-store",
      }
    )
  } catch (error) {
    console.error(
      "Failed to prefetch category filters",
      error
    )

    return {
      category_id:
        categoryIds[0] ?? "",
      options: [],
      availability: {
        supported: false,
        in_stock_product_ids: [],
        in_stock_count: 0,
        total_products: 0,
      },
    }
  }
}

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  availability,
  isViewAll = false,
  categoryBreadcrumb = [],
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  availability?: "in_stock"
  isViewAll?: boolean
  categoryBreadcrumb?: HttpTypes.StoreProductCategory[]
}) {
  const pageNumber = page
    ? parseInt(page)
    : 1

  const sort =
    sortBy || "created_at"

  if (!category || !countryCode) {
    notFound()
  }

  /*
   * Parent category pages must include products and filters
   * from every nested child category.
   */
  const categoryIds =
    getCategoryIdsWithDescendants(
      category
    )

  /*
   * This exact canonical route is passed into every product card.
   * It becomes the product-page breadcrumb context.
   */
  const categoryPath =
    categoryBreadcrumb
      .map(
        (crumb) =>
          crumb.handle
      )
      .filter(Boolean)
      .join("/")

  /*
   * Prefetch filter facets for the whole selected subtree.
   */
  const filterData =
    await getCategoryFilters(
      categoryIds
    )

  return (
    <div
      className="relative z-0 w-full px-5 pb-5 pt-6"
      data-testid="category-container"
    >
      <div className="mb-5 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div
            className="
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
                  categoryBreadcrumb.length -
                    1

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
                  <Fragment
                    key={crumb.id}
                  >
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="text-black/45"
                      >
                        ·
                      </span>
                    )}

                    {isLast &&
                    !isViewAll ? (
                      <h1
                        className="text-[12px] font-normal leading-5 text-black"
                        data-testid="category-page-title"
                      >
                        {crumb.name}
                      </h1>
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

            {isViewAll && (
              <>
                {categoryBreadcrumb.length >
                  0 && (
                  <span
                    aria-hidden="true"
                    className="text-black/45"
                  >
                    ·
                  </span>
                )}

                <h1
                  className="text-[12px] font-normal leading-5 text-black"
                  data-testid="category-page-title"
                >
                  View All
                </h1>
              </>
            )}
          </div>

          {category.description && (
            <p className="mt-2 max-w-3xl text-[12px] font-normal leading-5 text-black/65">
              {category.description}
            </p>
          )}
        </div>

        <RefinementList
          sortBy={sort}
          categoryId={
            category.id
          }
          availability={
            availability
          }
          filterOptions={
            filterData.options
          }
          availabilitySupported={
            filterData
              .availability
              .supported
          }
          data-testid="sort-by-container"
        />
      </div>

      <Suspense
        fallback={
          <SkeletonProductGrid
            numberOfProducts={
              category.products
                ?.length ?? 8
            }
          />
        }
      >
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={
            category.id
          }
          categoryIds={
            categoryIds
          }
          countryCode={
            countryCode
          }
          optionValueIds={
            optionValueIds
          }
          inStockOnly={
            availability ===
            "in_stock"
          }
          categoryPath={
            categoryPath
          }
        />
      </Suspense>
    </div>
  )
}