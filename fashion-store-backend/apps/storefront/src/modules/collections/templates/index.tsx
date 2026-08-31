import { Suspense } from "react"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

type CollectionFilterOption = {
  id: string
  title: string
  values: Array<{
    id: string
    value: string
  }>
}

type CollectionFiltersResponse = {
  collection_id?: string
  options: CollectionFilterOption[]
  availability: {
    supported: boolean
    in_stock_product_ids: string[]
    in_stock_count: number
    total_products: number
  }
}

const getCollectionFilters = async (
  collectionId: string
): Promise<CollectionFiltersResponse> => {
  try {
    const headers = {
      ...(await getAuthHeaders()),
    }

    return await sdk.client.fetch<CollectionFiltersResponse>(
      "/store/category-filters",
      {
        method: "GET",
        query: {
          collection_id: collectionId,
        },
        headers,
        cache: "no-store",
      }
    )
  } catch (error) {
    console.error(
      "Failed to prefetch collection filters",
      error
    )

    return {
      collection_id: collectionId,
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

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
  availability,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  availability?: "in_stock"
}) {
  const pageNumber = page
    ? parseInt(page)
    : 1

  const sort =
    sortBy || "created_at"

  const filterData =
    await getCollectionFilters(
      collection.id
    )

  return (
    <div
      className="relative z-0 w-full px-5 pb-5 pt-6"
      data-testid="collection-container"
    >
      {/*
       * SAME header system as Category pages:
       * small premium title on the left,
       * Filter By on the right.
       */}
      <div className="mb-5 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1
            className="text-[12px] font-normal leading-5 text-black"
            data-testid="collection-page-title"
          >
            {collection.title}
          </h1>
        </div>

        <RefinementList
          sortBy={sort}
          categoryId={collection.id}
          availability={availability}
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

      {/*
       * SAME PaginatedProducts component as Category pages.
       * Therefore product-card image, Main/Flip logic, swatches,
       * arrows, mobile progress line/swipe and typography remain
       * exactly the shared storefront system.
       */}
      <Suspense
        fallback={
          <SkeletonProductGrid
            numberOfProducts={
              collection.products
                ?.length ?? 8
            }
          />
        }
      >
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          collectionId={
            collection.id
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
        />
      </Suspense>
    </div>
  )
}