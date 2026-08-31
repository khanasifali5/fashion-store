"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders } from "./cookies"
import {
  getRegion,
  retrieveRegion,
} from "./regions"

type ProductListQueryParams =
  (HttpTypes.FindParams &
    HttpTypes.StoreProductListParams) & {
    options?: string[]
    option_value_id?:
      | string
      | string[]
  }

type ProductFiltersResponse = {
  category_id?: string
  category_ids?: string[]
  collection_id?: string
  options?: Array<{
    id: string
    title: string
    values: Array<{
      id: string
      value: string
    }>
  }>
  availability?: {
    supported?: boolean
    in_stock_product_ids?: string[]
    in_stock_count?: number
    total_products?: number
  }
}

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,*variants.options.option,*images,*options,*options.values,+metadata,+tags,*categories"

const getInStockProductIds =
  async ({
    categoryId,
    categoryIds,
    collectionId,
  }: {
    categoryId?: string
    categoryIds?: string[]
    collectionId?: string
  }): Promise<string[]> => {
    const headers = {
      ...(await getAuthHeaders()),
    }

    const query:
      Record<
        string,
        string
      > = {}

    if (collectionId) {
      query.collection_id =
        collectionId
    } else {
      const resolvedCategoryIds =
        Array.from(
          new Set(
            [
              categoryId,
              ...(categoryIds ??
                []),
            ].filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
          )
        )

      if (
        resolvedCategoryIds.length
      ) {
        query.category_id =
          resolvedCategoryIds[0]

        query.category_ids =
          resolvedCategoryIds.join(
            ","
          )
      }
    }

    if (
      !query.collection_id &&
      !query.category_id
    ) {
      return []
    }

    const result =
      await sdk.client.fetch<ProductFiltersResponse>(
        "/store/category-filters",
        {
          method: "GET",
          query,
          headers,
          cache: "no-store",
        }
      )

    return Array.from(
      new Set(
        (
          result
            ?.availability
            ?.in_stock_product_ids ??
          []
        ).filter(Boolean)
      )
    )
  }

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: {
    products:
      HttpTypes.StoreProduct[]
    count: number
  }
  nextPage:
    | number
    | null
  queryParams?: ProductListQueryParams
}> => {
  if (
    !countryCode &&
    !regionId
  ) {
    throw new Error(
      "Country code or region ID is required"
    )
  }

  const limit =
    queryParams?.limit || 12

  const currentPage =
    Math.max(
      pageParam,
      1
    )

  const offset =
    currentPage === 1
      ? 0
      : (currentPage - 1) *
        limit

  let region:
    | HttpTypes.StoreRegion
    | undefined
    | null

  if (countryCode) {
    region =
      await getRegion(
        countryCode
      )
  } else {
    region =
      await retrieveRegion(
        regionId!
      )
  }

  if (!region) {
    return {
      response: {
        products: [],
        count: 0,
      },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const {
    limit:
      _queryLimit,
    offset:
      _queryOffset,
    region_id:
      _queryRegionId,
    fields:
      requestedFields,
    ...restQueryParams
  } = queryParams ?? {}

  const result =
    await sdk.client.fetch<{
      products:
        HttpTypes.StoreProduct[]
      count: number
    }>("/store/products", {
      method: "GET",

      query: {
        ...restQueryParams,

        limit,
        offset,
        region_id:
          region.id,

        fields:
          requestedFields ||
          PRODUCT_FIELDS,
      },

      headers,

      cache: "no-store",
    })

  const {
    products,
    count,
  } = result

  const nextPage =
    count >
    offset + limit
      ? currentPage + 1
      : null

  return {
    response: {
      products,
      count,
    },
    nextPage,
    queryParams,
  }
}

export const listProductsWithSort =
  async ({
    page = 1,
    queryParams,
    sortBy =
      "created_at",
    countryCode,
    optionValueIds,
    inStockOnly =
      false,
  }: {
    page?: number
    queryParams?: ProductListQueryParams
    sortBy?: SortOptions
    countryCode: string
    optionValueIds?: OptionValueIds
    inStockOnly?: boolean
  }): Promise<{
    response: {
      products:
        HttpTypes.StoreProduct[]
      count: number
    }
    nextPage:
      | number
      | null
    queryParams?: ProductListQueryParams
  }> => {
    const limit =
      queryParams?.limit ||
      12

    const safePage =
      Math.max(page, 1)

    const optionFilters =
      Array.from(
        new Set(
          (
            optionValueIds ||
            []
          ).filter(Boolean)
        )
      )

    const commonQuery:
      ProductListQueryParams =
      {
        ...queryParams,

        ...(optionFilters.length
          ? {
              option_value_id:
                optionFilters,
            }
          : {}),
      }

    /*
     * "Hide Sold Out" now supports BOTH:
     * - category pages
     * - collection pages
     *
     * Availability IDs still come from the backend endpoint,
     * so the same sales-channel-aware logic is used everywhere.
     */
    if (inStockOnly) {
      const rawCategoryIds =
        commonQuery.category_id

      const categoryIds =
        (
          Array.isArray(
            rawCategoryIds
          )
            ? rawCategoryIds
            : rawCategoryIds
              ? [
                  rawCategoryIds,
                ]
              : []
        ).filter(
          (
            id
          ): id is string =>
            Boolean(id)
        )

      const rawCollectionIds =
        commonQuery.collection_id

      const collectionIds =
        (
          Array.isArray(
            rawCollectionIds
          )
            ? rawCollectionIds
            : rawCollectionIds
              ? [
                  rawCollectionIds,
                ]
              : []
        ).filter(
          (
            id
          ): id is string =>
            Boolean(id)
        )

      const collectionId =
        collectionIds[0]

      if (
        !categoryIds.length &&
        !collectionId
      ) {
        return {
          response: {
            products: [],
            count: 0,
          },
          nextPage: null,
          queryParams,
        }
      }

      let inStockProductIds:
        string[] = []

      if (
        collectionId
      ) {
        inStockProductIds =
          await getInStockProductIds(
            {
              collectionId,
            }
          )
      } else {
        /*
         * Parent categories can contain multiple category IDs.
         * The backend accepts all IDs in one request and performs
         * the same deduped descendant-aware availability calculation.
         */
        inStockProductIds =
          await getInStockProductIds(
            {
              categoryId:
                categoryIds[0],
              categoryIds,
            }
          )
      }

      const existingProductIds =
        Array.isArray(
          commonQuery.id
        )
          ? commonQuery.id
          : commonQuery.id
            ? [
                commonQuery.id,
              ]
            : []

      const allowedProductIds =
        existingProductIds.length
          ? existingProductIds.filter(
              (id) =>
                inStockProductIds.includes(
                  id
                )
            )
          : inStockProductIds

      if (
        !allowedProductIds.length
      ) {
        return {
          response: {
            products: [],
            count: 0,
          },
          nextPage: null,
          queryParams,
        }
      }

      commonQuery.id =
        allowedProductIds
    }

    /*
     * Latest arrivals:
     * only the current page is fetched.
     */
    if (
      !sortBy ||
      sortBy ===
        "created_at"
    ) {
      return listProducts({
        pageParam:
          safePage,

        queryParams: {
          ...commonQuery,
          limit,
          order:
            "-created_at",
        },

        countryCode,
      })
    }

    /*
     * Price sorting remains local.
     */
    const PRICE_SORT_FETCH_LIMIT =
      48

    const {
      response: {
        products,
        count,
      },
    } =
      await listProducts({
        pageParam: 1,

        queryParams: {
          ...commonQuery,
          limit:
            PRICE_SORT_FETCH_LIMIT,
        },

        countryCode,
      })

    const sortedProducts =
      sortProducts(
        products,
        sortBy
      )

    const pageOffset =
      (safePage - 1) *
      limit

    const paginatedProducts =
      sortedProducts.slice(
        pageOffset,
        pageOffset + limit
      )

    const totalCount =
      typeof count ===
      "number"
        ? count
        : products.length

    const nextPage =
      totalCount >
      pageOffset + limit
        ? safePage + 1
        : null

    return {
      response: {
        products:
          paginatedProducts,
        count:
          totalCount,
      },

      nextPage,
      queryParams,
    }
  }
