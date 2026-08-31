import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCategoryBreadcrumb,
  getProductCanonicalBreadcrumb,
} from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import {
  getRegion,
  listRegions,
} from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{
    countryCode: string
    handle: string
  }>
  searchParams: Promise<{
    v_id?: string
    color?: string
    from?: string
  }>
}

export async function generateStaticParams() {
  try {
    const countryCodes =
      await listRegions().then(
        (regions) =>
          regions
            ?.map((r) =>
              r.countries?.map(
                (c) => c.iso_2
              )
            )
            .flat()
      )

    if (!countryCodes) {
      return []
    }

    const promises =
      countryCodes.map(
        async (country) => {
          const {
            response,
          } = await listProducts({
            countryCode:
              country,
            queryParams: {
              limit: 100,
              fields:
                "handle",
            },
          })

          return {
            country,
            products:
              response.products,
          }
        }
      )

    const countryProducts =
      await Promise.all(promises)

    return countryProducts
      .flatMap(
        (countryData) =>
          countryData.products.map(
            (product) => ({
              countryCode:
                countryData.country,
              handle:
                product.handle,
            })
          )
      )
      .filter(
        (param) =>
          param.handle
      )
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }.`
    )

    return []
  }
}

function getImagesForSelection(
  product:
    HttpTypes.StoreProduct,
  selectedVariantId?: string,
  selectedColor?: string
) {
  const productImages =
    product.images ?? []

  const variants =
    product.variants ?? []

  const associatedImages = (
    variant:
      | HttpTypes.StoreProductVariant
      | undefined
  ) => {
    if (
      !variant?.images?.length
    ) {
      return []
    }

    const ids =
      new Set(
        variant.images
          .map(
            (image) =>
              image.id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      )

    return productImages.filter(
      (image) =>
        ids.has(image.id)
    )
  }

  if (selectedVariantId) {
    const variant =
      variants.find(
        (item) =>
          item.id ===
          selectedVariantId
      )

    const images =
      associatedImages(
        variant
      )

    if (images.length) {
      return images
    }
  }

  if (selectedColor) {
    const normalized =
      selectedColor
        .trim()
        .toLowerCase()

    const variant =
      variants.find(
        (item) =>
          item.options?.some(
            (option) =>
              option.value
                ?.trim()
                .toLowerCase() ===
              normalized
          ) &&
          (item.images?.length ??
            0) >
            0
      )

    const images =
      associatedImages(
        variant
      )

    if (images.length) {
      return images
    }
  }

  const firstWithImages =
    variants.find(
      (variant) =>
        (variant.images
          ?.length ??
          0) > 0
    )

  const initial =
    associatedImages(
      firstWithImages
    )

  return initial.length
    ? initial
    : productImages
}

const getProductCategoryBreadcrumb =
  async (
    product:
      HttpTypes.StoreProduct,
    from?: string
  ): Promise<
    HttpTypes.StoreProductCategory[]
  > => {
    /*
     * FLOW A: CATEGORY PAGE -> PRODUCT
     *
     * The visitor has a real navigation path.
     * Preserve exactly what the category page supplied.
     */
    if (from) {
      const handles =
        from
          .split("/")
          .map(
            (part) =>
              part.trim()
          )
          .filter(Boolean)

      if (handles.length) {
        const breadcrumb =
          await getCategoryBreadcrumb(
            handles
          )

        if (
          breadcrumb.length
        ) {
          return breadcrumb
        }
      }
    }

    /*
     * FLOW B: PRODUCT SHOWCASE / NEW ARRIVALS / COLLECTION /
     * SIMILAR ITEMS / RECENTLY VIEWED / STYLE WITH / DIRECT URL
     *
     * These entry points do not have a category navigation path.
     * Resolve one canonical hierarchy from Medusa's ACTUAL:
     *
     * category.products membership
     * +
     * parent_category_id chain
     *
     * This exact same resolver is used for every such entry point.
     */
    return getProductCanonicalBreadcrumb(
      product.id
    )
  }

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const params =
    await props.params

  const product =
    await listProducts({
      countryCode:
        params.countryCode,
      queryParams: {
        handle:
          params.handle,
      },
    }).then(
      ({ response }) =>
        response.products[0]
    )

  if (!product) {
    notFound()
  }

  return {
    title:
      `${product.title} | Medusa Store`,
    description:
      product.description ||
      product.title,
    openGraph: {
      title:
        `${product.title} | Medusa Store`,
      description:
        product.description ||
        product.title,
      images:
        product.thumbnail
          ? [
              product.thumbnail,
            ]
          : [],
    },
  }
}

export default async function ProductPage(
  props: Props
) {
  const params =
    await props.params

  const searchParams =
    await props.searchParams

  const region =
    await getRegion(
      params.countryCode
    )

  if (!region) {
    notFound()
  }

  const product =
    await listProducts({
      countryCode:
        params.countryCode,
      queryParams: {
        handle:
          params.handle,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,*variants,*variants.options,*variants.images,*images,*options,*options.values,*collection,*categories",
      },
    }).then(
      ({ response }) =>
        response.products[0]
    )

  if (!product) {
    notFound()
  }

  const images =
    getImagesForSelection(
      product,
      searchParams.v_id,
      searchParams.color
    )

  const categoryBreadcrumb =
    await getProductCategoryBreadcrumb(
      product,
      searchParams.from
    )

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={
        params.countryCode
      }
      images={images}
      categoryBreadcrumb={
        categoryBreadcrumb
      }
    />
  )
}