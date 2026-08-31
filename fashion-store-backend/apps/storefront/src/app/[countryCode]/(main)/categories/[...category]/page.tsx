import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCategoryBreadcrumb,
  getCategoryByHandle,
  listCategories,
} from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import {
  HttpTypes,
  StoreRegion,
} from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { parseOptionValueIds } from "@lib/util/product-option-filters"

type Props = {
  params: Promise<{
    category: string[]
    countryCode: string
  }>
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    > & {
      sortBy?: SortOptions
      page?: string
      optionValueIds?:
        | string
        | string[]
      availability?: string
      view?: string
    }
  >
}

const buildCategoryPaths = (
  categories:
    HttpTypes.StoreProductCategory[],
  parentPath: string[] = []
): string[][] => {
  const paths: string[][] = []

  for (
    const category of categories
  ) {
    if (!category.handle) {
      continue
    }

    const currentPath = [
      ...parentPath,
      category.handle,
    ]

    paths.push(currentPath)

    if (
      category.category_children
        ?.length
    ) {
      paths.push(
        ...buildCategoryPaths(
          category.category_children,
          currentPath
        )
      )
    }
  }

  return paths
}

export async function generateStaticParams() {
  const categoryTree =
    await listCategories()

  if (!categoryTree?.length) {
    return []
  }

  const categoryPaths =
    buildCategoryPaths(
      categoryTree
    )

  const countryCodes =
    await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.flatMap(
            (region) =>
              region.countries?.map(
                (country) =>
                  country.iso_2
              ) ?? []
          )
          .filter(
            (
              code
            ): code is string =>
              Boolean(code)
          ) ?? []
    )

  return countryCodes.flatMap(
    (countryCode) =>
      categoryPaths.map(
        (category) => ({
          countryCode,
          category,
        })
      )
  )
}

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const params =
    await props.params

  const productCategory =
    await getCategoryByHandle(
      params.category
    )

  if (!productCategory) {
    notFound()
  }

  const title =
    `${productCategory.name} | Medusa Store`

  const description =
    productCategory.description ??
    `${productCategory.name} category.`

  return {
    title,
    description,
    alternates: {
      canonical:
        `/categories/${params.category.join(
          "/"
        )}`,
    },
  }
}

export default async function CategoryPage(
  props: Props
) {
  const searchParams =
    await props.searchParams

  const params =
    await props.params

  const { sortBy, page } =
    searchParams

  const optionValueIds =
    parseOptionValueIds(
      searchParams
    )

  const availability =
    searchParams.availability ===
    "in_stock"
      ? "in_stock"
      : undefined

  const isViewAll =
    searchParams.view ===
    "all"

  const productCategory =
    await getCategoryByHandle(
      params.category
    )

  if (!productCategory) {
    notFound()
  }

  const categoryBreadcrumb =
    await getCategoryBreadcrumb(
      params.category
    )

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={
        params.countryCode
      }
      optionValueIds={
        optionValueIds
      }
      availability={
        availability
      }
      isViewAll={
        isViewAll
      }
      categoryBreadcrumb={
        categoryBreadcrumb
      }
    />
  )
}