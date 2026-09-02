import { defineRouteConfig } from "@medusajs/admin-sdk"
import { sdk } from "../../lib/sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
} from "@medusajs/ui"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

type OptionValue = {
  id: string
  value: string
}

type ProductOption = {
  id: string
  title: string
  values?: OptionValue[]
}

type UploadedImage = {
  id: string
  url: string
}

type ColorSwatchConfig = {
  image_id: string
  image_url: string
  x: number
  y: number
  zoom: number
}

type ShippingProfile = {
  id: string
  name: string
  type?: string | null
}

type SalesChannel = {
  id: string
  name: string
  is_disabled?: boolean
}

type StoreRecord = {
  id: string
  default_sales_channel_id?: string | null
}


type ProductTypeRecord = {
  id: string
  value: string
}

type CollectionRecord = {
  id: string
  title: string
  handle?: string | null
}

type CategoryRecord = {
  id: string
  name: string
  handle?: string | null
  parent_category_id?: string | null
}

type ProductTagRecord = {
  id: string
  value: string
}

type BuilderProductSearchRecord = {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
  status?: string | null
}

type StyleWithProductRecord = {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
}

const parseStringArrayMetadata = (
  value: unknown
): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value.filter(
          (item): item is string =>
            typeof item === "string" &&
            Boolean(item.trim())
        )
      )
    )
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    if (!trimmed) {
      return []
    }

    try {
      const parsed = JSON.parse(trimmed)

      if (Array.isArray(parsed)) {
        return parseStringArrayMetadata(
          parsed
        )
      }
    } catch {
      // Also support comma-separated IDs.
    }

    return Array.from(
      new Set(
        trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }

  return []
}

const SIZE_ORDER = [
  "XXXS",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
]

const createHandle = (
  value: string
) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const NATIVE_SELECT_CLASS =
  "mt-2 h-9 w-full rounded-md border border-ui-border-base bg-white px-3 text-sm text-black outline-none transition focus:border-ui-border-interactive disabled:opacity-60"

const createSkuProductCode = () => {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

  try {
    const bytes =
      new Uint8Array(8)

    crypto.getRandomValues(
      bytes
    )

    return Array.from(
      bytes,
      (byte) =>
        alphabet[
          byte %
            alphabet.length
        ]
    ).join("")
  } catch {
    return Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()
      .padEnd(8, "X")
  }
}

const getVariantKey = (
  color: string,
  size: string
) => {
  return `${color
    .trim()
    .toLowerCase()}::${size
    .trim()
    .toLowerCase()}`
}

const ProductBuilderPage = () => {
  /*
   * Basic product information
   */
  const [
    title,
    setTitle,
  ] = useState("")

  const [
    handle,
    setHandle,
  ] = useState("")

  const [
    description,
    setDescription,
  ] = useState("")

  const [
    handleEdited,
    setHandleEdited,
  ] = useState(false)

  /*
   * Product media
   */
  const [
    uploadedImages,
    setUploadedImages,
  ] = useState<UploadedImage[]>([])

  /*
   * Files uploaded during the current builder session.
   * These IDs let us clean R2/File Module uploads if
   * product creation fails or the user removes a new image.
   */
  const [
    sessionUploadedFileIds,
    setSessionUploadedFileIds,
  ] = useState<string[]>([])

  /*
   * Storefront card media controls.
   * These are uploaded directly from Product Builder.
   */
  const [
    mainCardImage,
    setMainCardImage,
  ] = useState<UploadedImage | null>(null)

  const [
    hoverCardImage,
    setHoverCardImage,
  ] = useState<UploadedImage | null>(null)

  const [
    cardImageUploading,
    setCardImageUploading,
  ] = useState<"main" | "hover" | null>(null)

  const [
    cardImageDragTarget,
    setCardImageDragTarget,
  ] = useState<"main" | "hover" | null>(null)


  /*
   * Color-wise image associations.
   * Stores uploaded image IDs selected for each color.
   */
  const [
    colorImageMap,
    setColorImageMap,
  ] = useState<
    Record<string, string[]>
  >({})

  /*
   * Storefront color swatch crop settings.
   * Each color can use one of its assigned images as a swatch source,
   * then independently control horizontal position, vertical position,
   * and zoom inside a square crop preview.
   */
  const [
    colorSwatchMap,
    setColorSwatchMap,
  ] = useState<
    Record<string, ColorSwatchConfig>
  >({})

  const [
    uploadingImages,
    setUploadingImages,
  ] = useState(false)

  const [
    uploadError,
    setUploadError,
  ] = useState("")

  const [
    isDragging,
    setIsDragging,
  ] = useState(false)

  /*
   * Gallery reorder state.
   * uploadedImages is the single source of truth for storefront image order.
   */
  const [
    reorderingImageId,
    setReorderingImageId,
  ] = useState<string | null>(null)

  const [
    reorderOverImageId,
    setReorderOverImageId,
  ] = useState<string | null>(null)


  /*
   * Organize
   */
  const [
    shippingProfiles,
    setShippingProfiles,
  ] = useState<ShippingProfile[]>([])

  const [
    salesChannels,
    setSalesChannels,
  ] = useState<SalesChannel[]>([])

  const [
    selectedShippingProfileId,
    setSelectedShippingProfileId,
  ] = useState("")

  const [
    selectedSalesChannelId,
    setSelectedSalesChannelId,
  ] = useState("")

  const [
    organizeLoading,
    setOrganizeLoading,
  ] = useState(true)

  const [
    organizeError,
    setOrganizeError,
  ] = useState("")


  const [
    productTypes,
    setProductTypes,
  ] = useState<ProductTypeRecord[]>([])

  const [
    collections,
    setCollections,
  ] = useState<CollectionRecord[]>([])

  const [
    categories,
    setCategories,
  ] = useState<CategoryRecord[]>([])

  const [
    productTags,
    setProductTags,
  ] = useState<ProductTagRecord[]>([])

  const [
    selectedTypeId,
    setSelectedTypeId,
  ] = useState("")

  const [
    selectedCollectionId,
    setSelectedCollectionId,
  ] = useState("")

  const [
    selectedCategoryIds,
    setSelectedCategoryIds,
  ] = useState<string[]>([])

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] = useState<string[]>([])

  const [
    categorySearch,
    setCategorySearch,
  ] = useState("")

  const [
    expandedCategoryIds,
    setExpandedCategoryIds,
  ] = useState<string[]>([])

  const [
    showAdvancedOrganize,
    setShowAdvancedOrganize,
  ] = useState(false)

  const [
    tagSearch,
    setTagSearch,
  ] = useState("")

  const [
    discountable,
    setDiscountable,
  ] = useState(true)


  /*
   * Product creation
   */
  const [
    creatingProduct,
    setCreatingProduct,
  ] = useState(false)

  const [
    createError,
    setCreateError,
  ] = useState("")

  /*
   * Product Builder mode.
   *
   * Create keeps the existing flow.
   * Edit loads an existing product into the same builder.
   */
  const [
    builderMode,
    setBuilderMode,
  ] = useState<
    "create" | "edit"
  >("create")

  const [
    editingProductId,
    setEditingProductId,
  ] = useState("")

  const [
    editingProductStatus,
    setEditingProductStatus,
  ] = useState<
    "draft" | "proposed" | "published" | "rejected"
  >("draft")

  const [
    productSearch,
    setProductSearch,
  ] = useState("")

  const [
    productSearchResults,
    setProductSearchResults,
  ] = useState<
    BuilderProductSearchRecord[]
  >([])

  const [
    productSearching,
    setProductSearching,
  ] = useState(false)

  const [
    loadingEditProduct,
    setLoadingEditProduct,
  ] = useState(false)

  /*
   * Curated complementary products for storefront "Style With".
   * Only IDs are persisted in product metadata.
   */
  const [
    styleWithSearch,
    setStyleWithSearch,
  ] = useState("")

  const [
    styleWithSearchResults,
    setStyleWithSearchResults,
  ] = useState<
    StyleWithProductRecord[]
  >([])

  const [
    styleWithSearching,
    setStyleWithSearching,
  ] = useState(false)

  const [
    styleWithProducts,
    setStyleWithProducts,
  ] = useState<
    StyleWithProductRecord[]
  >([])


  /*
   * Default variant pricing.
   * Medusa v2 stores price amounts in major currency units.
   * Example: INR 995 = amount 995 (not 99500).
   */
  const [
    priceInr,
    setPriceInr,
  ] = useState("")

  const [
    priceEur,
    setPriceEur,
  ] = useState("")

  const [
    priceUsd,
    setPriceUsd,
  ] = useState("")


  /*
   * Default stock applied to every generated variant.
   * Set 0 for variants that should start out of stock.
   */
  const [
    defaultStock,
    setDefaultStock,
  ] = useState("0")



  /*
   * Stable SKU identity.
   * New products get one random Safafi product code.
   * Existing products keep their existing variant SKUs.
   */
  const [
    skuProductCode,
    setSkuProductCode,
  ] = useState(
    () => createSkuProductCode()
  )

  const [
    existingVariantSkuMap,
    setExistingVariantSkuMap,
  ] = useState<
    Record<string, string>
  >({})

  /*
   * Global Medusa options
   */
  const [
    options,
    setOptions,
  ] = useState<ProductOption[]>([])

  const [, setLoading] = useState(true)

  /*
   * Search
   */
  const [
    colorSearch,
    setColorSearch,
  ] = useState("")

  const [
    sizeSearch,
    setSizeSearch,
  ] = useState("")


  const [
    addingColorValue,
    setAddingColorValue,
  ] = useState(false)

  const [
    addingSizeValue,
    setAddingSizeValue,
  ] = useState(false)

  const [
    optionValueError,
    setOptionValueError,
  ] = useState("")

  /*
   * Selected values
   */
  const [
    selectedColors,
    setSelectedColors,
  ] = useState<string[]>([])

  const [
    selectedSizes,
    setSelectedSizes,
  ] = useState<string[]>([])

  /*
   * Auto-create handle from title
   * until user manually edits handle.
   */
  useEffect(() => {
    if (handleEdited) {
      return
    }

    setHandle(
      createHandle(title)
    )
  }, [
    title,
    handleEdited,
  ])

  /*
   * Load global Color / Size options
   */
  useEffect(() => {
    const loadOptions =
      async () => {
        try {
          const response =
            await fetch(
              "/admin/product-options?limit=200&fields=*values",
              {
                credentials:
                  "include",
              }
            )

          if (!response.ok) {
            throw new Error(
              "Failed to load product options"
            )
          }

          const data =
            await response.json()

          setOptions(
            data.product_options ??
              []
          )
        } catch (error) {
          console.error(
            "Failed loading product options:",
            error
          )
        } finally {
          setLoading(false)
        }
      }

    loadOptions()
  }, [])

  /*
   * Load complete Organize data:
   * shipping profiles, sales channels, product types,
   * collections, categories, and product tags.
   */
  useEffect(() => {
    const loadOrganizeData =
      async () => {
        setOrganizeLoading(true)
        setOrganizeError("")

        try {
          const [
            profilesResponse,
            channelsResponse,
            storesResponse,
            typesResponse,
            collectionsResponse,
            categoriesResponse,
            tagsResponse,
          ] = await Promise.all([
            fetch(
              "/admin/shipping-profiles?limit=100",
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              "/admin/sales-channels?limit=100",
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              "/admin/stores?limit=1&fields=id,default_sales_channel_id",
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              "/admin/product-types?limit=200",
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              "/admin/collections?limit=200",
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              "/admin/product-categories?limit=200&fields=id,name,handle,parent_category_id",
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              "/admin/product-tags?limit=200",
              {
                credentials:
                  "include",
              }
            ),
          ])

          const responses = [
            profilesResponse,
            channelsResponse,
            storesResponse,
            typesResponse,
            collectionsResponse,
            categoriesResponse,
            tagsResponse,
          ]

          if (
            responses.some(
              (response) =>
                !response.ok
            )
          ) {
            throw new Error(
              "Failed to load complete organize data."
            )
          }

          const [
            profilesData,
            channelsData,
            storesData,
            typesData,
            collectionsData,
            categoriesData,
            tagsData,
          ] = await Promise.all(
            responses.map(
              (response) =>
                response.json()
            )
          )

          const profiles =
            (profilesData.shipping_profiles ??
              []) as ShippingProfile[]

          const channels =
            (channelsData.sales_channels ??
              []) as SalesChannel[]

          const stores =
            (storesData.stores ??
              []) as StoreRecord[]

          setShippingProfiles(
            profiles
          )

          setSalesChannels(
            channels
          )

          setProductTypes(
            (
              typesData.product_types ??
              []
            ).sort(
              (
                a: ProductTypeRecord,
                b: ProductTypeRecord
              ) =>
                a.value.localeCompare(
                  b.value,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  }
                )
            )
          )

          setCollections(
            (
              collectionsData.collections ??
              []
            ).sort(
              (
                a: CollectionRecord,
                b: CollectionRecord
              ) =>
                a.title.localeCompare(
                  b.title,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  }
                )
            )
          )

          setCategories(
            (
              categoriesData.product_categories ??
              []
            ).sort(
              (
                a: CategoryRecord,
                b: CategoryRecord
              ) =>
                a.name.localeCompare(
                  b.name,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  }
                )
            )
          )

          setProductTags(
            (
              tagsData.product_tags ??
              []
            ).sort(
              (
                a: ProductTagRecord,
                b: ProductTagRecord
              ) =>
                a.value.localeCompare(
                  b.value,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  }
                )
            )
          )

          const defaultProfile =
            profiles.find(
              (profile) =>
                profile.name
                  ?.trim()
                  .toLowerCase()
                  .includes(
                    "default"
                  )
            ) ??
            profiles.find(
              (profile) =>
                profile.type
                  ?.trim()
                  .toLowerCase() ===
                "default"
            ) ??
            profiles[0]

          if (defaultProfile) {
            setSelectedShippingProfileId(
              defaultProfile.id
            )
          }

          const defaultSalesChannelId =
            stores[0]
              ?.default_sales_channel_id

          const defaultChannel =
            channels.find(
              (channel) =>
                channel.id ===
                defaultSalesChannelId
            ) ??
            channels.find(
              (channel) =>
                !channel.is_disabled
            ) ??
            channels[0]

          if (defaultChannel) {
            setSelectedSalesChannelId(
              defaultChannel.id
            )
          }
        } catch (error) {
          console.error(
            "Failed loading organize data:",
            error
          )

          setOrganizeError(
            error instanceof Error
              ? error.message
              : "Failed to load organize data."
          )
        } finally {
          setOrganizeLoading(false)
        }
      }

    loadOrganizeData()
  }, [])

  const resetBuilderForm = () => {
    setEditingProductId("")
    setEditingProductStatus("draft")
    setProductSearch("")
    setProductSearchResults([])

    setTitle("")
    setHandle("")
    setDescription("")
    setHandleEdited(false)

    setUploadedImages([])
    setSessionUploadedFileIds([])
    setMainCardImage(null)
    setHoverCardImage(null)
    setColorImageMap({})
    setColorSwatchMap({})

    setSkuProductCode(
      createSkuProductCode()
    )
    setExistingVariantSkuMap({})

    setSelectedTypeId("")
    setSelectedCollectionId("")
    setSelectedCategoryIds([])
    setExpandedCategoryIds([])
    setSelectedTagIds([])
    setShowAdvancedOrganize(false)
    setDiscountable(true)

    setPriceInr("")
    setPriceEur("")
    setPriceUsd("")
    setDefaultStock("0")

    setSelectedColors([])
    setSelectedSizes([])
    setColorSearch("")
    setSizeSearch("")

    setStyleWithSearch("")
    setStyleWithSearchResults([])
    setStyleWithProducts([])

    setCreateError("")
    setOptionValueError("")
  }

  const switchBuilderMode = (
    mode: "create" | "edit"
  ) => {
    if (builderMode === mode) {
      return
    }

    resetBuilderForm()
    setBuilderMode(mode)
  }

  /*
   * Search products to edit.
   */
  useEffect(() => {
    if (builderMode !== "edit") {
      setProductSearchResults([])
      return
    }

    const query =
      productSearch.trim()

    if (query.length < 2) {
      setProductSearchResults([])
      return
    }

    const timer =
      window.setTimeout(
        async () => {
          setProductSearching(true)

          try {
            const params =
              new URLSearchParams({
                q: query,
                limit: "20",
                fields:
                  "id,title,handle,thumbnail,status",
              })

            const response =
              await fetch(
                `/admin/products?${params.toString()}`,
                {
                  credentials:
                    "include",
                }
              )

            const data =
              await response.json()

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  "Failed to search products."
              )
            }

            setProductSearchResults(
              data.products ?? []
            )
          } catch (error) {
            console.error(
              "Product Builder product search failed:",
              error
            )
          } finally {
            setProductSearching(false)
          }
        },
        250
      )

    return () =>
      window.clearTimeout(timer)
  }, [
    builderMode,
    productSearch,
  ])

  /*
   * Search complementary products for Style With.
   */
  useEffect(() => {
    const query =
      styleWithSearch.trim()

    if (query.length < 2) {
      setStyleWithSearchResults([])
      return
    }

    const timer =
      window.setTimeout(
        async () => {
          setStyleWithSearching(true)

          try {
            const params =
              new URLSearchParams({
                q: query,
                limit: "20",
                fields:
                  "id,title,handle,thumbnail",
              })

            const response =
              await fetch(
                `/admin/products?${params.toString()}`,
                {
                  credentials:
                    "include",
                }
              )

            const data =
              await response.json()

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  "Failed to search Style With products."
              )
            }

            const selectedIds =
              new Set(
                styleWithProducts.map(
                  (item) => item.id
                )
              )

            setStyleWithSearchResults(
              (
                data.products ?? []
              ).filter(
                (
                  item: StyleWithProductRecord
                ) =>
                  item.id !==
                    editingProductId &&
                  !selectedIds.has(
                    item.id
                  )
              )
            )
          } catch (error) {
            console.error(
              "Style With product search failed:",
              error
            )
          } finally {
            setStyleWithSearching(false)
          }
        },
        250
      )

    return () =>
      window.clearTimeout(timer)
  }, [
    styleWithSearch,
    styleWithProducts,
    editingProductId,
  ])

  const addStyleWithProduct = (
    product: StyleWithProductRecord
  ) => {
    setStyleWithProducts(
      (previous) => {
        if (
          previous.some(
            (item) =>
              item.id ===
              product.id
          ) ||
          previous.length >= 4
        ) {
          return previous
        }

        return [
          ...previous,
          product,
        ]
      }
    )

    setStyleWithSearch("")
    setStyleWithSearchResults([])
  }

  const removeStyleWithProduct = (
    productId: string
  ) => {
    setStyleWithProducts(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            productId
        )
    )
  }

  const moveStyleWithProduct = (
    productId: string,
    direction: "previous" | "next"
  ) => {
    setStyleWithProducts(
      (previous) => {
        const index =
          previous.findIndex(
            (item) =>
              item.id ===
              productId
          )

        if (index === -1) {
          return previous
        }

        const targetIndex =
          direction === "previous"
            ? index - 1
            : index + 1

        if (
          targetIndex < 0 ||
          targetIndex >=
            previous.length
        ) {
          return previous
        }

        const next = [
          ...previous,
        ]

        const [item] =
          next.splice(index, 1)

        next.splice(
          targetIndex,
          0,
          item
        )

        return next
      }
    )
  }

  const loadStyleWithProducts =
    async (
      productIds: string[]
    ) => {
      if (!productIds.length) {
        setStyleWithProducts([])
        return
      }

      const loaded =
        await Promise.all(
          productIds
            .slice(0, 4)
            .map(
              async (productId) => {
                try {
                  const params =
                    new URLSearchParams({
                      fields:
                        "id,title,handle,thumbnail",
                    })

                  const response =
                    await fetch(
                      `/admin/products/${productId}?${params.toString()}`,
                      {
                        credentials:
                          "include",
                      }
                    )

                  if (!response.ok) {
                    return null
                  }

                  const data =
                    await response.json()

                  return (
                    data.product ??
                    null
                  ) as StyleWithProductRecord | null
                } catch {
                  return null
                }
              }
            )
        )

      setStyleWithProducts(
        loaded.filter(
          (
            item
          ): item is StyleWithProductRecord =>
            Boolean(item)
        )
      )
    }

  const loadProductForEdit =
    async (
      productId: string
    ) => {
      setLoadingEditProduct(true)
      setCreateError("")
      setOptionValueError("")

      try {
        const fields = [
          "id",
          "title",
          "handle",
          "description",
          "status",
          "thumbnail",
          "discountable",
          "metadata",
          "*images",
          "*collection",
          "*type",
          "*categories",
          "*tags",
          "*sales_channels",
          "*shipping_profile",
          "*options",
          "*options.values",
          "*variants",
          "*variants.options",
          "*variants.options.option",
          "*variants.images",
          "*variants.prices",
        ].join(",")

        const params =
          new URLSearchParams({
            fields,
          })

        const response =
          await fetch(
            `/admin/products/${productId}?${params.toString()}`,
            {
              credentials:
                "include",
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load product."
          )
        }

        const product =
          data.product

        if (!product?.id) {
          throw new Error(
            "Medusa did not return the selected product."
          )
        }

        setEditingProductId(
          product.id
        )

        setEditingProductStatus(
          product.status ??
            "draft"
        )

        setTitle(
          product.title ?? ""
        )

        setHandle(
          product.handle ?? ""
        )

        setDescription(
          product.description ??
            ""
        )

        setHandleEdited(true)

        const productImages:
          UploadedImage[] =
          (
            product.images ?? []
          )
            .filter(
              (image: any) =>
                Boolean(
                  image?.id &&
                    image?.url
                )
            )
            .map(
              (image: any) => ({
                id: image.id,
                url: image.url,
              })
            )

        setUploadedImages(
          productImages
        )

        const metadata =
          product.metadata &&
          typeof product.metadata ===
            "object"
            ? product.metadata
            : {}

        const primaryImageId =
          typeof metadata.showcase_primary_image_id ===
          "string"
            ? metadata.showcase_primary_image_id
            : ""

        const primaryUrl =
          typeof metadata.showcase_primary_image_url ===
          "string"
            ? metadata.showcase_primary_image_url
            : product.thumbnail

        const flipImageId =
          typeof metadata.showcase_flip_image_id ===
          "string"
            ? metadata.showcase_flip_image_id
            : ""

        const flipUrl =
          typeof metadata.showcase_flip_image_url ===
          "string"
            ? metadata.showcase_flip_image_url
            : ""

        setMainCardImage(
          productImages.find(
            (image) =>
              image.id ===
              primaryImageId
          ) ??
            productImages.find(
              (image) =>
                image.url ===
                primaryUrl
            ) ??
            productImages[0] ??
            null
        )

        setHoverCardImage(
          productImages.find(
            (image) =>
              image.id ===
              flipImageId
          ) ??
            productImages.find(
              (image) =>
                image.url ===
                flipUrl
            ) ??
            productImages[1] ??
            productImages[0] ??
            null
        )

        const rawSwatches =
          metadata.showcase_color_swatches

        if (
          rawSwatches &&
          typeof rawSwatches ===
            "object" &&
          !Array.isArray(
            rawSwatches
          )
        ) {
          const swatches:
            Record<
              string,
              ColorSwatchConfig
            > = {}

          for (
            const [
              color,
              rawValue,
            ] of Object.entries(
              rawSwatches
            )
          ) {
            if (
              !rawValue ||
              typeof rawValue !==
                "object" ||
              Array.isArray(
                rawValue
              )
            ) {
              continue
            }

            const value =
              rawValue as Record<
                string,
                unknown
              >

            const storedImageId =
              typeof value.image_id ===
              "string"
                ? value.image_id
                : ""

            const storedImageUrl =
              typeof value.image_url ===
              "string"
                ? value.image_url
                : ""

            const image =
              productImages.find(
                (item) =>
                  item.id ===
                  storedImageId
              ) ??
              productImages.find(
                (item) =>
                  item.url ===
                  storedImageUrl
              )

            if (!image) {
              continue
            }

            swatches[color] = {
              image_id:
                image.id,
              image_url:
                image.url,
              x:
                typeof value.x ===
                "number"
                  ? value.x
                  : 50,
              y:
                typeof value.y ===
                "number"
                  ? value.y
                  : 50,
              zoom:
                typeof value.zoom ===
                "number"
                  ? value.zoom
                  : 2.5,
            }
          }

          setColorSwatchMap(
            swatches
          )
        } else {
          setColorSwatchMap({})
        }

        setSelectedTypeId(
          product.type?.id ??
            product.type_id ??
            ""
        )

        setSelectedCollectionId(
          product.collection?.id ??
            product.collection_id ??
            ""
        )

        setSelectedCategoryIds(
          (
            product.categories ??
            []
          )
            .map(
              (item: any) =>
                item.id
            )
            .filter(Boolean)
        )

        setSelectedTagIds(
          (
            product.tags ?? []
          )
            .map(
              (item: any) =>
                item.id
            )
            .filter(Boolean)
        )

        setSelectedShippingProfileId(
          product.shipping_profile
            ?.id ??
            product.shipping_profile_id ??
            selectedShippingProfileId
        )

        setSelectedSalesChannelId(
          product.sales_channels?.[0]
            ?.id ??
            selectedSalesChannelId
        )

        setDiscountable(
          product.discountable !==
            false
        )

        const variants =
          product.variants ?? []

        const colors =
          new Set<string>()

        const sizes =
          new Set<string>()

        const nextColorImageMap:
          Record<
            string,
            string[]
          > = {}

        const nextVariantSkuMap:
          Record<string, string> = {}

        for (
          const variant of
          variants
        ) {
          let colorValue = ""
          let sizeValue = ""

          for (
            const option of
            variant.options ?? []
          ) {
            const optionTitle =
              option.option?.title
                ?.trim()
                .toLowerCase()

            if (
              optionTitle ===
                "color" ||
              optionTitle ===
                "colour"
            ) {
              colorValue =
                option.value ?? ""

              if (colorValue) {
                colors.add(
                  colorValue
                )
              }
            }

            if (
              optionTitle ===
              "size"
            ) {
              sizeValue =
                option.value ?? ""

              if (sizeValue) {
                sizes.add(
                  sizeValue
                )
              }
            }
          }

          if (
            colorValue &&
            sizeValue &&
            typeof variant.sku ===
              "string" &&
            variant.sku.trim()
          ) {
            nextVariantSkuMap[
              getVariantKey(
                colorValue,
                sizeValue
              )
            ] = variant.sku
          }

          if (colorValue) {
            const existing =
              nextColorImageMap[
                colorValue
              ] ?? []

            const variantImageIds =
              (
                variant.images ??
                []
              )
                .map(
                  (image: any) =>
                    image.id
                )
                .filter(Boolean)

            nextColorImageMap[
              colorValue
            ] = Array.from(
              new Set([
                ...existing,
                ...variantImageIds,
              ])
            )
          }
        }

        setSelectedColors(
          Array.from(colors)
        )

        setSelectedSizes(
          Array.from(sizes)
        )

        setColorImageMap(
          nextColorImageMap
        )

        setExistingVariantSkuMap(
          nextVariantSkuMap
        )

        const firstVariant =
          variants[0]

        const prices =
          firstVariant?.prices ??
          []

        const getPrice = (
          currencyCode: string
        ) => {
          const price =
            prices.find(
              (item: any) =>
                item.currency_code
                  ?.toLowerCase() ===
                currencyCode
            )

          return typeof price?.amount ===
            "number"
            ? String(
                price.amount
              )
            : ""
        }

        setPriceInr(
          getPrice("inr")
        )
        setPriceEur(
          getPrice("eur")
        )
        setPriceUsd(
          getPrice("usd")
        )

        /*
         * Inventory is intentionally not edited from this form.
         * Medusa inventory is stock-location based. Keep the
         * create-only default visible but locked in Edit mode.
         */
        setDefaultStock("0")

        const styleWithIds =
          parseStringArrayMetadata(
            metadata.style_with_product_ids ??
              metadata.showcase_style_with_product_ids
          ).filter(
            (id) =>
              id !== product.id
          )

        await loadStyleWithProducts(
          styleWithIds
        )

        setProductSearch(
          product.title ??
            product.handle ??
            ""
        )

        setProductSearchResults([])
      } catch (error) {
        console.error(
          "Failed loading product into Product Builder:",
          error
        )

        setCreateError(
          error instanceof Error
            ? error.message
            : "Failed to load product."
        )
      } finally {
        setLoadingEditProduct(false)
      }
    }

  /*
   * Find global Color option
   */
  const colorOption =
    useMemo(() => {
      return options.find(
        (option) => {
          const optionTitle =
            option.title
              ?.trim()
              .toLowerCase()

          return (
            optionTitle ===
              "color" ||
            optionTitle ===
              "colour"
          )
        }
      )
    }, [options])

  /*
   * Find global Size option
   */
  const sizeOption =
    useMemo(() => {
      return options.find(
        (option) =>
          option.title
            ?.trim()
            .toLowerCase() ===
          "size"
      )
    }, [options])

  /*
   * Alphabetical colors
   */
  const colorValues =
    useMemo(() => {
      return [
        ...(
          colorOption?.values ??
          []
        ),
      ].sort((a, b) =>
        a.value.localeCompare(
          b.value,
          undefined,
          {
            sensitivity:
              "base",
          }
        )
      )
    }, [colorOption])

  /*
   * Logical clothing size order
   */
  const sizeValues =
    useMemo(() => {
      return [
        ...(
          sizeOption?.values ??
          []
        ),
      ].sort((a, b) => {
        const aValue =
          a.value.toUpperCase()

        const bValue =
          b.value.toUpperCase()

        const aIndex =
          SIZE_ORDER.indexOf(
            aValue
          )

        const bIndex =
          SIZE_ORDER.indexOf(
            bValue
          )

        if (
          aIndex !== -1 &&
          bIndex !== -1
        ) {
          return (
            aIndex -
            bIndex
          )
        }

        if (
          aIndex !== -1
        ) {
          return -1
        }

        if (
          bIndex !== -1
        ) {
          return 1
        }

        return a.value.localeCompare(
          b.value,
          undefined,
          {
            numeric: true,
            sensitivity:
              "base",
          }
        )
      })
    }, [sizeOption])

  /*
   * Search colors
   */
  const filteredColors =
    useMemo(() => {
      const query =
        colorSearch
          .trim()
          .toLowerCase()

      if (!query) {
        return []
      }

      return colorValues
        .filter(
          (item) =>
            item.value
              .toLowerCase()
              .includes(query)
        )
        .slice(0, 12)
    }, [
      colorSearch,
      colorValues,
    ])

  /*
   * Search sizes
   */
  const filteredSizes =
    useMemo(() => {
      const query =
        sizeSearch
          .trim()
          .toLowerCase()

      if (!query) {
        return []
      }

      return sizeValues
        .filter(
          (item) =>
            item.value
              .toLowerCase()
              .includes(query)
        )
        .slice(0, 12)
    }, [
      sizeSearch,
      sizeValues,
    ])

  const normalizeOptionInput = (
    value: string,
    type: "color" | "size"
  ) => {
    const trimmed =
      value
        .trim()
        .replace(/\s+/g, " ")

    if (!trimmed) {
      return ""
    }

    if (type === "size") {
      return trimmed.toUpperCase()
    }

    return trimmed
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      )
  }

  const refreshGlobalOptions =
    async () => {
      const response =
        await fetch(
          "/admin/product-options?limit=200&fields=*values",
          {
            credentials:
              "include",
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Failed to refresh product options."
        )
      }

      setOptions(
        data.product_options ??
          []
      )

      return (
        data.product_options ??
        []
      ) as ProductOption[]
    }

  const createOrSelectGlobalValue =
    async (
      type: "color" | "size"
    ) => {
      if (
        builderMode ===
        "edit"
      ) {
        setOptionValueError(
          "Color and Size combinations are locked in Edit mode to protect existing variant IDs. Use Medusa's standard product variant editor if you need to add or remove variant combinations."
        )
        return
      }

      const isColor =
        type === "color"

      const rawValue =
        isColor
          ? colorSearch
          : sizeSearch

      const value =
        normalizeOptionInput(
          rawValue,
          type
        )

      if (!value) {
        return
      }

      const option =
        isColor
          ? colorOption
          : sizeOption

      if (!option) {
        setOptionValueError(
          `Global ${
            isColor
              ? "Color"
              : "Size"
          } option was not found.`
        )
        return
      }

      const exactExisting =
        (option.values ?? []).find(
          (item) =>
            item.value
              .trim()
              .toLowerCase() ===
            value.toLowerCase()
        )

      /*
       * Existing value:
       * don't create a duplicate; just select
       * Medusa's existing canonical value.
       */
      if (exactExisting) {
        if (isColor) {
          if (
            !selectedColors.includes(
              exactExisting.value
            )
          ) {
            setSelectedColors(
              (previous) => [
                ...previous,
                exactExisting.value,
              ]
            )
          }

          setColorSearch("")
        } else {
          if (
            !selectedSizes.includes(
              exactExisting.value
            )
          ) {
            setSelectedSizes(
              (previous) => [
                ...previous,
                exactExisting.value,
              ]
            )
          }

          setSizeSearch("")
        }

        setOptionValueError("")
        return
      }

      if (isColor) {
        setAddingColorValue(true)
      } else {
        setAddingSizeValue(true)
      }

      setOptionValueError("")

      try {
        /*
         * Medusa Admin's Update Product Option API
         * accepts the complete values string array.
         * Preserve all existing global values and append
         * only the missing one.
         */
        const nextValues =
          Array.from(
            new Map(
              [
                ...(option.values ?? [])
                  .map(
                    (item) =>
                      item.value
                  ),
                value,
              ].map(
                (item) => [
                  item
                    .trim()
                    .toLowerCase(),
                  item,
                ]
              )
            ).values()
          )

        const response =
          await fetch(
            `/admin/product-options/${option.id}`,
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  values:
                    nextValues,
                }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data?.message ||
            `Failed to add ${value}.`
          )
        }

        const refreshed =
          await refreshGlobalOptions()

        const refreshedOption =
          refreshed.find(
            (item) =>
              item.id ===
              option.id
          )

        const savedValue =
          refreshedOption
            ?.values?.find(
              (item) =>
                item.value
                  .trim()
                  .toLowerCase() ===
                value.toLowerCase()
            )?.value ??
          value

        if (isColor) {
          setSelectedColors(
            (previous) =>
              previous.some(
                (item) =>
                  item.toLowerCase() ===
                  savedValue.toLowerCase()
              )
                ? previous
                : [
                    ...previous,
                    savedValue,
                  ]
          )
          setColorSearch("")
        } else {
          setSelectedSizes(
            (previous) =>
              previous.some(
                (item) =>
                  item.toLowerCase() ===
                  savedValue.toLowerCase()
              )
                ? previous
                : [
                    ...previous,
                    savedValue,
                  ]
          )
          setSizeSearch("")
        }
      } catch (error) {
        console.error(
          "Failed creating global option value:",
          error
        )

        setOptionValueError(
          error instanceof Error
            ? error.message
            : "Failed to add the option value."
        )
      } finally {
        if (isColor) {
          setAddingColorValue(false)
        } else {
          setAddingSizeValue(false)
        }
      }
    }

  const categoryById =
    useMemo(() => {
      return new Map(
        categories.map(
          (category) => [
            category.id,
            category,
          ]
        )
      )
    }, [categories])

  const categoryChildrenMap =
    useMemo(() => {
      const next =
        new Map<
          string,
          CategoryRecord[]
        >()

      for (const category of categories) {
        const parentId =
          category.parent_category_id ||
          "__root__"

        const children =
          next.get(parentId) ?? []

        children.push(category)
        next.set(parentId, children)
      }

      for (const children of next.values()) {
        children.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              undefined,
              {
                sensitivity:
                  "base",
              }
            )
        )
      }

      return next
    }, [categories])

  const rootCategories =
    useMemo(() => {
      return categories
        .filter(
          (category) =>
            !category.parent_category_id ||
            !categoryById.has(
              category.parent_category_id
            )
        )
        .sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              undefined,
              {
                sensitivity:
                  "base",
              }
            )
        )
    }, [
      categories,
      categoryById,
    ])

  const categoryPathById =
    useMemo(() => {
      const paths =
        new Map<
          string,
          string
        >()

      const buildPath = (
        category: CategoryRecord
     ): string => {
        if (paths.has(category.id)) {
          return paths.get(
            category.id
          )!
        }

        const parent =
          category.parent_category_id
            ? categoryById.get(
                category.parent_category_id
              )
            : undefined

        const path: string = parent
          ? `${buildPath(
              parent
            )} > ${category.name}`
          : category.name

        paths.set(
          category.id,
          path
        )

        return path
      }

      categories.forEach(
        (category) =>
          buildPath(category)
      )

      return paths
    }, [
      categories,
      categoryById,
    ])

  const categorySearchResults =
    useMemo(() => {
      const query =
        categorySearch
          .trim()
          .toLowerCase()

      if (!query) {
        return []
      }

      return categories
        .filter((category) => {
          const path =
            categoryPathById
              .get(category.id)
              ?.toLowerCase() ??
            ""

          return (
            category.name
              .toLowerCase()
              .includes(query) ||
            category.handle
              ?.toLowerCase()
              .includes(query) ||
            path.includes(query)
          )
        })
        .slice(0, 30)
    }, [
      categories,
      categorySearch,
      categoryPathById,
    ])

  const toggleCategoryExpanded = (
    id: string
  ) => {
    setExpandedCategoryIds(
      (previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) =>
                item !== id
            )
          : [
              ...previous,
              id,
            ]
    )
  }

  const renderCategoryTreeNode = (
    category: CategoryRecord,
    depth = 0
  ) => {
    const children =
      categoryChildrenMap.get(
        category.id
      ) ?? []

    const hasChildren =
      children.length > 0

    const expanded =
      expandedCategoryIds.includes(
        category.id
      )

    const selected =
      selectedCategoryIds.includes(
        category.id
      )

    return (
      <div key={category.id}>
        <div
          className="flex min-h-10 items-center border-b border-ui-border-base last:border-b-0 hover:bg-ui-bg-subtle"
          style={{
            paddingLeft:
              `${12 + depth * 20}px`,
          }}
        >
          <button
            type="button"
            aria-label={
              hasChildren
                ? expanded
                  ? "Collapse category"
                  : "Expand category"
                : "No child categories"
            }
            disabled={!hasChildren}
            onClick={() =>
              hasChildren &&
              toggleCategoryExpanded(
                category.id
              )
            }
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded text-ui-fg-muted hover:bg-ui-bg-base disabled:cursor-default disabled:opacity-30"
          >
            {hasChildren
              ? expanded
                ? "▾"
                : "▸"
              : "·"}
          </button>

          <button
            type="button"
            onClick={() =>
              toggleCategory(
                category.id
              )
            }
            className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 pr-4 text-left"
          >
            <span className="truncate">
              {category.name}
            </span>

            <span
              className={
                selected
                  ? "font-semibold text-ui-fg-interactive"
                  : "text-ui-fg-muted"
              }
            >
              {selected ? "✓" : ""}
            </span>
          </button>
        </div>

        {hasChildren &&
          expanded &&
          children.map(
            (child) =>
              renderCategoryTreeNode(
                child,
                depth + 1
              )
          )}
      </div>
    )
  }

  const filteredTags =
    useMemo(() => {
      const query =
        tagSearch
          .trim()
          .toLowerCase()

      if (!query) {
        return productTags
          .slice(0, 20)
      }

      return productTags
        .filter(
          (tag) =>
            tag.value
              .toLowerCase()
              .includes(query)
        )
        .slice(0, 20)
    }, [
      productTags,
      tagSearch,
    ])

  const toggleCategory = (
    id: string
  ) => {
    setSelectedCategoryIds(
      (previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) =>
                item !== id
            )
          : [
              ...previous,
              id,
            ]
    )
  }

  const toggleTag = (
    id: string
  ) => {
    setSelectedTagIds(
      (previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) =>
                item !== id
            )
          : [
              ...previous,
              id,
            ]
    )
  }

  const toggleColor = (
    value: string
  ) => {
    if (
      builderMode ===
      "edit"
    ) {
      setOptionValueError(
        "Color and Size combinations are locked in Edit mode to protect existing variants."
      )
      return
    }

    setSelectedColors(
      (previous) => {
        const removing =
          previous.includes(
            value
          )

        if (removing) {
          setColorImageMap(
            (currentMap) => {
              const next = {
                ...currentMap,
              }

              delete next[value]

              return next
            }
          )

          setColorSwatchMap(
            (currentMap) => {
              const next = {
                ...currentMap,
              }

              delete next[value]

              return next
            }
          )

          return previous.filter(
            (item) =>
              item !== value
          )
        }

        return [
          ...previous,
          value,
        ]
      }
    )
  }

  const toggleSize = (
    value: string
  ) => {
    if (
      builderMode ===
      "edit"
    ) {
      setOptionValueError(
        "Color and Size combinations are locked in Edit mode to protect existing variants."
      )
      return
    }

    setSelectedSizes(
      (previous) =>
        previous.includes(
          value
        )
          ? previous.filter(
              (item) =>
                item !== value
            )
          : [
              ...previous,
              value,
            ]
    )
  }

  const toggleColorImage = (
    color: string,
    imageId: string
  ) => {
    const currentlySelected =
      colorImageMap[color] ?? []

    const removing =
      currentlySelected.includes(
        imageId
      )

    setColorImageMap(
      (previous) => {
        const current =
          previous[color] ?? []

        const next =
          current.includes(
            imageId
          )
            ? current.filter(
                (id) =>
                  id !== imageId
              )
            : [
                ...current,
                imageId,
              ]

        return {
          ...previous,
          [color]: next,
        }
      }
    )

    /*
     * If the image being removed is the current swatch source,
     * clear that swatch selection. The user can choose another
     * assigned image immediately below in the Swatch Editor.
     */
    if (removing) {
      setColorSwatchMap(
        (previous) => {
          if (
            previous[color]?.image_id !==
            imageId
          ) {
            return previous
          }

          const next = {
            ...previous,
          }

          delete next[color]

          return next
        }
      )
    }
  }

  const setColorSwatchSource = (
    color: string,
    imageId: string
  ) => {
    if (!imageId) {
      setColorSwatchMap(
        (previous) => {
          const next = {
            ...previous,
          }

          delete next[color]

          return next
        }
      )
      return
    }

    const image =
      uploadedImages.find(
        (item) =>
          item.id === imageId
      )

    if (!image) {
      return
    }

    setColorSwatchMap(
      (previous) => {
        const current =
          previous[color]

        if (
          current?.image_id ===
          image.id
        ) {
          return previous
        }

        return {
          ...previous,
          [color]: {
            image_id: image.id,
            image_url: image.url,
            x: 50,
            y: 50,
            zoom: 2.5,
          },
        }
      }
    )
  }

  const updateColorSwatchCrop = (
    color: string,
    changes: Partial<
      Pick<
        ColorSwatchConfig,
        "x" | "y" | "zoom"
      >
    >
  ) => {
    setColorSwatchMap(
      (previous) => {
        const current =
          previous[color]

        if (!current) {
          return previous
        }

        return {
          ...previous,
          [color]: {
            ...current,
            ...changes,
          },
        }
      }
    )
  }

  const resetColorSwatchCrop = (
    color: string
  ) => {
    updateColorSwatchCrop(
      color,
      {
        x: 50,
        y: 50,
        zoom: 2.5,
      }
    )
  }

  const registerSessionUploads = (
    images: UploadedImage[]
  ) => {
    const ids =
      images
        .map((image) => image.id)
        .filter(Boolean)

    if (!ids.length) {
      return
    }

    setSessionUploadedFileIds(
      (previous) =>
        Array.from(
          new Set([
            ...previous,
            ...ids,
          ])
        )
    )
  }

  const deleteUploadedFile =
    async (fileId: string) => {
      try {
        await sdk.admin.upload.delete(
          fileId
        )
      } catch (error) {
        /*
         * A failed create route may already have cleaned
         * the file. Treat 404/already-deleted as harmless.
         */
        console.warn(
          `Could not clean uploaded file ${fileId}:`,
          error
        )
      }
    }

  const cleanupSessionUploads =
    async () => {
      const ids = [
        ...sessionUploadedFileIds,
      ]

      if (!ids.length) {
        return
      }

      await Promise.allSettled(
        ids.map((id) =>
          deleteUploadedFile(id)
        )
      )

      setSessionUploadedFileIds([])

      const idSet = new Set(ids)

      setUploadedImages(
        (previous) =>
          previous.filter(
            (image) =>
              !idSet.has(image.id)
          )
      )

      setMainCardImage(
        (current) =>
          current &&
          idSet.has(current.id)
            ? null
            : current
      )

      setHoverCardImage(
        (current) =>
          current &&
          idSet.has(current.id)
            ? null
            : current
      )

      setColorImageMap(
        (previous) =>
          Object.fromEntries(
            Object.entries(
              previous
            ).map(
              ([color, imageIds]) => [
                color,
                imageIds.filter(
                  (id) =>
                    !idSet.has(id)
                ),
              ]
            )
          )
      )

      setColorSwatchMap(
        (previous) =>
          Object.fromEntries(
            Object.entries(
              previous
            ).filter(
              ([, swatch]) =>
                !idSet.has(
                  swatch.image_id
                )
            )
          )
      )
    }

  /*
   * Upload product images using Medusa's Admin Upload API.
   */
  const uploadFiles = async (
    files: File[]
  ) => {
    if (!files.length) {
      return
    }

    const imageFiles =
      files.filter((file) =>
        file.type.startsWith("image/")
      )

    if (!imageFiles.length) {
      setUploadError(
        "Please select image files only."
      )
      return
    }

    setUploadingImages(true)
    setUploadError("")

    try {
      const response =
        await sdk.admin.upload.create({
          files: imageFiles,
        })

      const newImages =
        (response.files ?? []).map(
          (file) => ({
            id: file.id,
            url: file.url,
          })
        )

      registerSessionUploads(
        newImages
      )

      setUploadedImages(
        (previous) => {
          const next = [
            ...previous,
            ...newImages,
          ]

          setMainCardImage(
            (current) =>
              current ??
              next[0] ??
              null
          )

          return next
        }
      )
    } catch (error) {
      console.error(
        "Failed uploading product images:",
        error
      )

      setUploadError(
        "Failed to upload one or more images. Please try again."
      )
    } finally {
      setUploadingImages(false)
      setIsDragging(false)
    }
  }

  const uploadCardImage = async (
    file: File,
    target: "main" | "hover"
  ) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.")
      return
    }

    setCardImageUploading(target)
    setUploadError("")

    try {
      const response =
        await sdk.admin.upload.create({
          files: [file],
        })

      const uploaded =
        response.files?.[0]

      if (!uploaded?.id || !uploaded?.url) {
        throw new Error(
          "Upload did not return an image."
        )
      }

      const nextImage: UploadedImage = {
        id: uploaded.id,
        url: uploaded.url,
      }

      registerSessionUploads([
        nextImage,
      ])

      setUploadedImages((previous) => {
        const withoutDuplicate =
          previous.filter(
            (image) =>
              image.id !== nextImage.id &&
              image.url !== nextImage.url
          )

        if (target === "main") {
          return [
            nextImage,
            ...withoutDuplicate,
          ]
        }

        /*
         * Flip image starts as gallery position 2.
         * It can be moved anywhere later without losing its flip role.
         */
        return [
          ...withoutDuplicate.slice(0, 1),
          nextImage,
          ...withoutDuplicate.slice(1),
        ]
      })

      if (target === "main") {
        setMainCardImage(nextImage)
      } else {
        setHoverCardImage(nextImage)
      }
    } catch (error) {
      console.error(
        `Failed uploading ${target} card image:`,
        error
      )

      setUploadError(
        target === "main"
          ? "Main Card Image could not be uploaded. Please try again."
          : "Hover / Flip Image could not be uploaded. Please try again."
      )
    } finally {
      setCardImageUploading(null)
      setCardImageDragTarget(null)
    }
  }

  const handleCardImageInput = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "main" | "hover"
  ) => {
    const file =
      event.target.files?.[0]

    if (file) {
      await uploadCardImage(
        file,
        target
      )
    }

    event.target.value = ""
  }

  const handleCardImageDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    target: "main" | "hover"
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (!cardImageUploading) {
      setCardImageDragTarget(
        target
      )
    }
  }

  const handleCardImageDragLeave = (
    event: React.DragEvent<HTMLDivElement>,
    target: "main" | "hover"
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null
      )
    ) {
      return
    }

    setCardImageDragTarget(
      (current) =>
        current === target
          ? null
          : current
    )
  }

  const handleCardImageDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    target: "main" | "hover"
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setCardImageDragTarget(null)

    if (cardImageUploading) {
      return
    }

    const file =
      event.dataTransfer.files?.[0]

    if (file) {
      await uploadCardImage(
        file,
        target
      )
    }
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files ?? []
    )

    await uploadFiles(files)

    /*
     * Reset input so the same file can be
     * selected again after removing it.
     */
    event.target.value = ""
  }

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (!uploadingImages) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    /*
     * Only remove the active state after the
     * pointer actually leaves the drop zone.
     */
    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null
      )
    ) {
      return
    }

    setIsDragging(false)
  }

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragging(false)

    if (uploadingImages) {
      return
    }

    const files = Array.from(
      event.dataTransfer.files ?? []
    )

    await uploadFiles(files)
  }

  const removeImage = async (
    imageId: string
  ) => {
    const isNewUpload =
      sessionUploadedFileIds.includes(
        imageId
      )

    setHoverCardImage(
      (current) =>
        current?.id === imageId
          ? null
          : current
    )

    setUploadedImages(
      (previous) => {
        const next =
          previous.filter(
            (image) =>
              image.id !== imageId
          )

        setMainCardImage(
          next[0] ?? null
        )

        return next
      }
    )

    setColorImageMap(
      (previous) => {
        const next = {
          ...previous,
        }

        Object.keys(next).forEach(
          (color) => {
            next[color] =
              next[color].filter(
                (id) =>
                  id !== imageId
              )
          }
        )

        return next
      }
    )

    setColorSwatchMap(
      (previous) => {
        const next = {
          ...previous,
        }

        Object.keys(next).forEach(
          (color) => {
            if (
              next[color]?.image_id ===
              imageId
            ) {
              delete next[color]
            }
          }
        )

        return next
      }
    )

    if (isNewUpload) {
      setSessionUploadedFileIds(
        (previous) =>
          previous.filter(
            (id) =>
              id !== imageId
          )
      )

      await deleteUploadedFile(
        imageId
      )
    }
  }

  /*
   * The first image is treated as the product thumbnail.
   */
  const setAsThumbnail = (
    imageId: string
  ) => {
    setUploadedImages(
      (previous) => {
        const image =
          previous.find(
            (item) =>
              item.id === imageId
          )

        if (!image) {
          return previous
        }

        setMainCardImage(image)

        return [
          image,
          ...previous.filter(
            (item) =>
              item.id !== imageId
          ),
        ]
      }
    )
  }

  /*
   * Reorder product gallery images.
   * Position 1 is always synced to the storefront main / thumbnail image.
   * hoverCardImage is intentionally NOT changed here, so a flip image keeps
   * its role even when it is moved to position 3, 4, etc.
   */
  const reorderImages = (
    sourceImageId: string,
    targetImageId: string
  ) => {
    if (
      sourceImageId === targetImageId
    ) {
      return
    }

    setUploadedImages(
      (previous) => {
        const sourceIndex =
          previous.findIndex(
            (image) =>
              image.id === sourceImageId
          )

        const targetIndex =
          previous.findIndex(
            (image) =>
              image.id === targetImageId
          )

        if (
          sourceIndex === -1 ||
          targetIndex === -1
        ) {
          return previous
        }

        const next = [...previous]
        const [movedImage] =
          next.splice(sourceIndex, 1)

        next.splice(
          targetIndex,
          0,
          movedImage
        )

        setMainCardImage(
          next[0] ?? null
        )

        return next
      }
    )
  }

  const moveImage = (
    imageId: string,
    direction: "previous" | "next"
  ) => {
    setUploadedImages(
      (previous) => {
        const currentIndex =
          previous.findIndex(
            (image) =>
              image.id === imageId
          )

        if (currentIndex === -1) {
          return previous
        }

        const nextIndex =
          direction === "previous"
            ? currentIndex - 1
            : currentIndex + 1

        if (
          nextIndex < 0 ||
          nextIndex >= previous.length
        ) {
          return previous
        }

        const next = [...previous]
        const currentImage =
          next[currentIndex]

        next[currentIndex] =
          next[nextIndex]
        next[nextIndex] =
          currentImage

        setMainCardImage(
          next[0] ?? null
        )

        return next
      }
    )
  }

  const handleMediaDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    imageId: string
  ) => {
    setReorderingImageId(imageId)
    setReorderOverImageId(imageId)
    event.dataTransfer.effectAllowed =
      "move"
    event.dataTransfer.setData(
      "text/plain",
      imageId
    )
  }

  const handleMediaDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    imageId: string
  ) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect =
      "move"

    if (
      reorderingImageId &&
      reorderingImageId !== imageId
    ) {
      setReorderOverImageId(
        imageId
      )
    }
  }

  const handleMediaDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetImageId: string
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const sourceImageId =
      event.dataTransfer.getData(
        "text/plain"
      ) || reorderingImageId

    if (sourceImageId) {
      reorderImages(
        sourceImageId,
        targetImageId
      )
    }

    setReorderingImageId(null)
    setReorderOverImageId(null)
  }

  const handleMediaDragEnd = () => {
    setReorderingImageId(null)
    setReorderOverImageId(null)
  }

  const cleanSkuText = (
    value: string
  ) => {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
  }

  /*
   * SKU identity intentionally does NOT depend on product title.
   * A random product code is generated once for create mode, while
   * edit mode preserves each existing variant SKU.
   */

  const COLOR_SKU_CODES:
    Record<string, string> = {
      BLACK: "BLK",
      WHITE: "WHT",
      "OFF WHITE": "OFW",
      IVORY: "IVY",
      CREAM: "CRM",
      GREY: "GRY",
      GRAY: "GRY",
      CHARCOAL: "CHR",
      RED: "RED",
      BURGUNDY: "BRG",
      MAROON: "MRN",
      PINK: "PNK",
      BLUE: "BLU",
      NAVY: "NVY",
      GREEN: "GRN",
      OLIVE: "OLV",
      BEIGE: "BEG",
      TAUPE: "TPE",
      BROWN: "BRN",
      CAMEL: "CML",
      KHAKI: "KHK",
      YELLOW: "YLW",
      ORANGE: "ORG",
      PURPLE: "PPL",
      LILAC: "LLC",
      LAVENDER: "LAV",
      TEAL: "TEL",
      TURQUOISE: "TRQ",
      GOLD: "GLD",
      SILVER: "SLV",
      MULTICOLOR: "MLT",
      MULTI: "MLT",
    }

  const getColorSkuCode = (
    value: string
  ) => {
    const clean =
      cleanSkuText(value)

    if (
      COLOR_SKU_CODES[clean]
    ) {
      return COLOR_SKU_CODES[clean]
    }

    const words =
      clean
        .split(" ")
        .filter(Boolean)

    if (!words.length) {
      return "CLR"
    }

    if (words.length === 1) {
      return words[0].slice(0, 3)
    }

    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 3)
  }

  const getSizeSkuCode = (
    value: string
  ) => {
    return cleanSkuText(value)
      .replace(/\s+/g, "")
      .slice(0, 6)
  }

  const buildSku = (
    color: string,
    size: string
  ) => {
    if (builderMode === "edit") {
      const existingSku =
        existingVariantSkuMap[
          getVariantKey(
            color,
            size
          )
        ]

      if (existingSku) {
        return existingSku
      }
    }

    const colorCode =
      getColorSkuCode(color)

    const sizeCode =
      getSizeSkuCode(size)

    return [
      "SAF",
      skuProductCode,
      colorCode,
      sizeCode,
    ]
      .filter(Boolean)
      .join("-")
  }

  const parseStock = (
    value: string
  ) => {
    const parsed =
      Number(value)

    if (
      !Number.isInteger(parsed) ||
      parsed < 0
    ) {
      return null
    }

    return parsed
  }

  const parsePrice = (
    value: string
  ) => {
    const normalized =
      value.trim().replace(",", ".")

    if (!normalized) {
      return null
    }

    const parsed =
      Number(normalized)

    if (
      !Number.isFinite(parsed) ||
      parsed < 0
    ) {
      return null
    }

    return parsed
  }

  const buildVariantPrices = () => {
    const prices: {
      currency_code: string
      amount: number
    }[] = []

    const inr =
      parsePrice(priceInr)

    const eur =
      parsePrice(priceEur)

    const usd =
      parsePrice(priceUsd)

    if (inr !== null) {
      prices.push({
        currency_code: "inr",
        amount: inr,
      })
    }

    if (eur !== null) {
      prices.push({
        currency_code: "eur",
        amount: eur,
      })
    }

    if (usd !== null) {
      prices.push({
        currency_code: "usd",
        amount: usd,
      })
    }

    return prices
  }

  /*
   * Build every selected Color x Size combination.
   */
  const variantCombinations =
    useMemo(() => {
      const stock =
        parseStock(defaultStock) ??
        0

      return selectedColors.flatMap(
        (color) =>
          selectedSizes.map(
            (size) => ({
              color,
              size,
              sku:
                buildSku(
                  color,
                  size
                ),
              stock_quantity:
                stock,
            })
          )
      )
    }, [
      selectedColors,
      selectedSizes,
      defaultStock,
      builderMode,
      skuProductCode,
      existingVariantSkuMap,
    ])

  /*
   * Create the real Medusa product.
   *
   * Important:
   * - Reuses the existing GLOBAL Color and Size options.
   * - Only the selected option-value IDs are attached.
   * - Creates only the selected Color x Size variants.
   * - Product stays DRAFT until price/inventory is configured
   *   in the next step.
   */
  const handleContinue =
    async () => {
      if (
        creatingProduct ||
        !title.trim() ||
        !handle.trim() ||
        !selectedShippingProfileId ||
        !selectedSalesChannelId ||
        !colorOption ||
        !sizeOption
      ) {
        return
      }

      const selectedColorValueIds =
        (colorOption.values ?? [])
          .filter((item) =>
            selectedColors.includes(
              item.value
            )
          )
          .map((item) => item.id)

      const selectedSizeValueIds =
        (sizeOption.values ?? [])
          .filter((item) =>
            selectedSizes.includes(
              item.value
            )
          )
          .map((item) => item.id)

      if (
        selectedColorValueIds.length !==
          selectedColors.length ||
        selectedSizeValueIds.length !==
          selectedSizes.length
      ) {
        setCreateError(
          "One or more selected Color/Size values could not be matched to the global Medusa options. Refresh the page and select them again."
        )
        return
      }

      const variantPrices =
        buildVariantPrices()

      if (!variantPrices.length) {
        setCreateError(
          "Enter at least one valid variant price. INR is recommended for your current storefront."
        )
        return
      }

      setCreatingProduct(true)
      setCreateError("")

      try {
        const stock =
          parseStock(
            defaultStock
          )

        if (stock === null) {
          throw new Error(
            "Default stock must be a whole number of 0 or more."
          )
        }

        const payload = {
          title:
            title.trim(),
          handle:
            handle.trim(),
          description:
            description.trim() ||
            undefined,
          status:
            builderMode === "edit"
              ? editingProductStatus
              : "draft",
          thumbnail:
            mainCardImage?.url ??
            uploadedImages[0]?.url,
          metadata: {
            showcase_primary_image_id:
              mainCardImage?.id ??
              uploadedImages[0]?.id ??
              "",
            showcase_primary_image_url:
              mainCardImage?.url ??
              uploadedImages[0]?.url ??
              "",
            showcase_flip_image_id:
              hoverCardImage?.id ??
              uploadedImages[1]?.id ??
              mainCardImage?.id ??
              uploadedImages[0]?.id ??
              "",
            showcase_flip_image_url:
              hoverCardImage?.url ??
              uploadedImages[1]?.url ??
              mainCardImage?.url ??
              uploadedImages[0]?.url ??
              "",
            style_with_product_ids:
              styleWithProducts.map(
                (product) =>
                  product.id
              ),
            showcase_color_swatches:
              Object.fromEntries(
                selectedColors
                  .filter(
                    (color) =>
                      Boolean(
                        colorSwatchMap[
                          color
                        ]
                      )
                  )
                  .map(
                    (color) => {
                      const swatch =
                        colorSwatchMap[
                          color
                        ]

                      return [
                        color,
                        {
                          image_id:
                            swatch.image_id,
                          image_url:
                            swatch.image_url,
                          x: swatch.x,
                          y: swatch.y,
                          zoom:
                            swatch.zoom,
                        },
                      ]
                    }
                  )
              ),
          },
          images:
            uploadedImages.map(
              (image) => ({
                url: image.url,
              })
            ),
          shipping_profile_id:
            selectedShippingProfileId,
          sales_channel_id:
            selectedSalesChannelId,
          type_id:
            selectedTypeId ||
            undefined,
          collection_id:
            selectedCollectionId ||
            undefined,
          category_ids:
            selectedCategoryIds,
          tag_ids:
            selectedTagIds,
          discountable,
          ...(builderMode ===
          "create"
            ? {
                uploaded_file_ids:
                  sessionUploadedFileIds,
              }
            : {}),
          options: [
            {
              id:
                colorOption.id,
              value_ids:
                selectedColorValueIds,
            },
            {
              id:
                sizeOption.id,
              value_ids:
                selectedSizeValueIds,
            },
          ],

          color_image_map:
            Object.fromEntries(
              selectedColors.map(
                (color) => [
                  color,
                  (colorImageMap[color] ?? [])
                    .map((imageId) =>
                      uploadedImages.find(
                        (image) =>
                          image.id === imageId
                      )
                    )
                    .filter(
                      (
                        image
                      ): image is UploadedImage =>
                        Boolean(image)
                    )
                    .map((image) => ({
                      id: image.id,
                      url: image.url,
                    })),
                ]
              )
            ),

          variants:
            variantCombinations.map(
              ({
                color,
                size,
                sku,
                stock_quantity,
              }) => ({
                title:
                  `${color} / ${size}`,
                sku,
                options: {
                  [colorOption.title]:
                    color,
                  [sizeOption.title]:
                    size,
                },
                prices:
                  variantPrices,
                manage_inventory:
                  true,
                allow_backorder:
                  false,
                stock_quantity,
              })
            ),
        }

        const endpoint =
          builderMode ===
            "edit"
            ? `/admin/product-builder/${editingProductId}`
            : "/admin/product-builder/create"

        const response =
          await fetch(
            endpoint,
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                payload
              ),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
         const message =
           data?.message ||
           data?.error ||
           (
             builderMode === "edit"
               ? "Medusa could not update the product."
               : "Medusa could not create the product."
            )
          throw new Error(
            typeof message ===
              "string"
              ? message
              : "Medusa could not create the product."
          )
        }

        const product =
          data?.product

        if (!product?.id) {
          throw new Error(
            builderMode === "edit"
              ? "Product was updated but Medusa did not return a product ID."
              : "Product was created but Medusa did not return a product ID."
          )
        }

        /*
         * Open the standard Medusa product detail page.
         * We will configure prices/inventory there or
         * extend this builder in the next step.
         */
        setSessionUploadedFileIds([])

        window.location.assign(
          `/app/products/${product.id}`
        )
      } catch (error) {
        if (
          builderMode ===
          "create"
        ) {
          await cleanupSessionUploads()
        }

        console.error(
          builderMode === "edit"
            ? "Failed updating product:"
            : "Failed creating product:",
          error
        )

        setCreateError(
          error instanceof Error
            ? error.message
            : builderMode === "edit"
              ? "Failed to update product."
              : "Failed to create product."
        )
      } finally {
        setCreatingProduct(
          false
        )
      }
    }

  const canContinue =
    Boolean(
      title.trim()
    ) &&
    Boolean(
      handle.trim()
    ) &&
    selectedColors.length >
      0 &&
    selectedSizes.length >
      0 &&
    Boolean(
      selectedShippingProfileId
    ) &&
    Boolean(
      selectedSalesChannelId
    ) &&
    Boolean(
      colorOption
    ) &&
    Boolean(
      sizeOption
    ) &&
    (
      parsePrice(priceInr) !==
        null ||
      parsePrice(priceEur) !==
        null ||
      parsePrice(priceUsd) !==
        null
    ) &&
    parseStock(
      defaultStock
    ) !== null &&
    (
      builderMode ===
        "create" ||
      Boolean(
        editingProductId
      )
    ) &&
    !loadingEditProduct &&
    !creatingProduct &&
    !uploadingImages &&
    !cardImageUploading

  return (
    <Container className="p-0">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Heading level="h1">
          Product Builder
        </Heading>

        <Text className="mt-1 text-ui-fg-subtle">
          Create a new product or load an existing product to safely edit its storefront details, media, organization, prices, and Style With recommendations.
        </Text>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={
              builderMode ===
              "create"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              switchBuilderMode(
                "create"
              )
            }
          >
            Create Product
          </Button>

          <Button
            type="button"
            variant={
              builderMode ===
              "edit"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              switchBuilderMode(
                "edit"
              )
            }
          >
            Edit Product
          </Button>
        </div>
      </div>

      {builderMode === "edit" && (
        <div className="border-b bg-ui-bg-subtle p-6">
          <Heading
            level="h2"
            className="mb-1"
          >
            Select Product to Edit
          </Heading>

          <Text className="text-ui-fg-subtle">
            Search by product title or handle. Loading a product fills this builder with its current values.
          </Text>

          <div className="relative mt-4 max-w-2xl">
            <Input
              placeholder="Search existing products..."
              value={productSearch}
              onChange={(event) =>
                setProductSearch(
                  event.target.value
                )
              }
            />

            {productSearching && (
              <Text className="mt-2 text-ui-fg-muted">
                Searching products...
              </Text>
            )}

            {productSearchResults.length >
              0 && (
              <div className="mt-2 overflow-hidden rounded-lg border border-ui-border-base bg-white shadow-elevation-card-rest">
                {productSearchResults.map(
                  (product) => (
                    <button
                      key={
                        product.id
                      }
                      type="button"
                      onClick={() =>
                        loadProductForEdit(
                          product.id
                        )
                      }
                      className="flex w-full items-center gap-3 border-b border-ui-border-base px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                    >
                      {product.thumbnail ? (
                        <img
                          src={
                            product.thumbnail
                          }
                          alt=""
                          className="h-12 w-10 shrink-0 object-contain"
                        />
                      ) : (
                        <div className="h-12 w-10 shrink-0 bg-ui-bg-subtle" />
                      )}

                      <div className="min-w-0 flex-1">
                        <Text className="truncate font-medium">
                          {
                            product.title
                          }
                        </Text>

                        <Text className="truncate text-ui-fg-muted">
                          /products/
                          {
                            product.handle
                          }
                        </Text>
                      </div>

                      <Badge>
                        {product.status ??
                          "product"}
                      </Badge>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {loadingEditProduct && (
            <Text className="mt-3 text-ui-fg-muted">
              Loading product into Product Builder...
            </Text>
          )}

          {editingProductId && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge color="green">
                Editing loaded product
              </Badge>

              <Text className="text-ui-fg-muted">
                {editingProductId}
              </Text>

              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() =>
                  window.open(
                    `/app/products/${editingProductId}`,
                    "_blank"
                  )
                }
              >
                Open standard Medusa product
              </Button>
            </div>
          )}

          <Text className="mt-4 text-ui-fg-muted">
            Safety: existing Color × Size combinations and stock-location inventory are locked here. Their IDs and stock records are preserved. Use the standard Medusa product editor for variant structure or location stock changes.
          </Text>
        </div>
      )}

      {/* BASIC DETAILS */}
      <div className="border-b p-6">
        <Heading
          level="h2"
          className="mb-5"
        >
          Product Details
        </Heading>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Title */}
          <div>
            <Label htmlFor="product-title">
              Title
            </Label>

            <Input
              id="product-title"
              className="mt-2"
              placeholder="Classic Cotton T-Shirt"
              value={title}
              onChange={(
                event
              ) =>
                setTitle(
                  event.target
                    .value
                )
              }
            />
          </div>

          {/* Handle */}
          <div>
            <Label htmlFor="product-handle">
              Handle
            </Label>

            <Input
              id="product-handle"
              className="mt-2"
              placeholder="classic-cotton-t-shirt"
              value={handle}
              onChange={(
                event
              ) => {
                setHandleEdited(
                  true
                )

                setHandle(
                  createHandle(
                    event.target
                      .value
                  )
                )
              }}
            />

            <Text className="mt-1 text-ui-fg-muted">
              /products/
              {handle ||
                "product-handle"}
            </Text>
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <Label htmlFor="product-description">
            Description
          </Label>

          <textarea
            id="product-description"
            value={description}
            onChange={(
              event
            ) =>
              setDescription(
                event.target
                  .value
              )
            }
            placeholder="Enter product description..."
            rows={6}
            className="mt-2 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm outline-none transition focus:border-ui-border-interactive"
          />
        </div>
      </div>

      {/* MEDIA */}
      <div className="border-b p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading level="h2">
              Media
            </Heading>

            <Text className="mt-1 text-ui-fg-subtle">
              Choose the exact storefront card images first, then upload the remaining gallery images below. No manual image URL is required.
            </Text>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <Text className="font-medium">
                  Main Card Image
                </Text>
                <Text className="text-ui-fg-muted">
                  Shown first on product cards across the storefront.
                </Text>
              </div>

              {mainCardImage && (
                <Badge color="green">
                  Selected
                </Badge>
              )}
            </div>

            <div
              onDragEnter={(event) =>
                handleCardImageDragOver(
                  event,
                  "main"
                )
              }
              onDragOver={(event) =>
                handleCardImageDragOver(
                  event,
                  "main"
                )
              }
              onDragLeave={(event) =>
                handleCardImageDragLeave(
                  event,
                  "main"
                )
              }
              onDrop={(event) =>
                handleCardImageDrop(
                  event,
                  "main"
                )
              }
              className={[
                "relative overflow-hidden rounded-lg border border-dashed transition",
                cardImageDragTarget ===
                "main"
                  ? "border-ui-border-interactive bg-ui-bg-interactive"
                  : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover",
                cardImageUploading ===
                "main"
                  ? "cursor-wait opacity-70"
                  : "",
              ].join(" ")}
            >
              {mainCardImage ? (
                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 p-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ui-bg-base">
                    <img
                      src={
                        mainCardImage.url
                      }
                      alt="Main storefront card"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <Text className="font-medium">
                      Main card image ready
                    </Text>

                    <Text className="mt-1 text-ui-fg-muted">
                      Drop another image here or replace it.
                    </Text>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer">
                        <span className="rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 text-sm font-medium">
                          Replace Image
                        </span>

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={Boolean(
                            cardImageUploading
                          )}
                          onChange={(event) =>
                            handleCardImageInput(
                              event,
                              "main"
                            )
                          }
                        />
                      </label>

                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          setMainCardImage(
                            null
                          )
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center px-6 py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-lg">
                    +
                  </div>

                  <Text className="font-medium">
                    {cardImageUploading ===
                    "main"
                      ? "Uploading Main Card Image..."
                      : cardImageDragTarget ===
                          "main"
                        ? "Drop Main Card Image here"
                        : "Drag & drop Main Card Image"}
                  </Text>

                  <Text className="mt-1 text-ui-fg-muted">
                    or click to browse one image
                  </Text>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={Boolean(
                      cardImageUploading
                    )}
                    onChange={(event) =>
                      handleCardImageInput(
                        event,
                        "main"
                      )
                    }
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <Text className="font-medium">
                  Hover / Flip Image
                </Text>
                <Text className="text-ui-fg-muted">
                  Shown when the customer hovers over a product card.
                </Text>
              </div>

              {hoverCardImage && (
                <Badge color="green">
                  Selected
                </Badge>
              )}
            </div>

            <div
              onDragEnter={(event) =>
                handleCardImageDragOver(
                  event,
                  "hover"
                )
              }
              onDragOver={(event) =>
                handleCardImageDragOver(
                  event,
                  "hover"
                )
              }
              onDragLeave={(event) =>
                handleCardImageDragLeave(
                  event,
                  "hover"
                )
              }
              onDrop={(event) =>
                handleCardImageDrop(
                  event,
                  "hover"
                )
              }
              className={[
                "relative overflow-hidden rounded-lg border border-dashed transition",
                cardImageDragTarget ===
                "hover"
                  ? "border-ui-border-interactive bg-ui-bg-interactive"
                  : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover",
                cardImageUploading ===
                "hover"
                  ? "cursor-wait opacity-70"
                  : "",
              ].join(" ")}
            >
              {hoverCardImage ? (
                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 p-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ui-bg-base">
                    <img
                      src={
                        hoverCardImage.url
                      }
                      alt="Hover storefront card"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <Text className="font-medium">
                      Hover / Flip image ready
                    </Text>

                    <Text className="mt-1 text-ui-fg-muted">
                      Drop another image here or replace it.
                    </Text>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer">
                        <span className="rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 text-sm font-medium">
                          Replace Image
                        </span>

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={Boolean(
                            cardImageUploading
                          )}
                          onChange={(event) =>
                            handleCardImageInput(
                              event,
                              "hover"
                            )
                          }
                        />
                      </label>

                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          setHoverCardImage(
                            null
                          )
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center px-6 py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-lg">
                    +
                  </div>

                  <Text className="font-medium">
                    {cardImageUploading ===
                    "hover"
                      ? "Uploading Hover / Flip Image..."
                      : cardImageDragTarget ===
                          "hover"
                        ? "Drop Hover / Flip Image here"
                        : "Drag & drop Hover / Flip Image"}
                  </Text>

                  <Text className="mt-1 text-ui-fg-muted">
                    or click to browse one image
                  </Text>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={Boolean(
                      cardImageUploading
                    )}
                    onChange={(event) =>
                      handleCardImageInput(
                        event,
                        "hover"
                      )
                    }
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-ui-border-base pt-6">
          <Text className="font-medium">
            Product Gallery Images
          </Text>
          <Text className="mt-1 text-ui-fg-muted">
            Upload images, then drag the media cards to set the exact storefront order. Position 1 becomes the Main / Thumbnail image. The selected Flip image keeps its flip role even if you move it to position 3 or later.
          </Text>
        </div>

        {uploadError && (
          <Text className="mt-3 text-ui-fg-error">
            {uploadError}
          </Text>
        )}

        <div
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            "mt-5 rounded-lg border border-dashed px-6 py-10 text-center transition",
            uploadingImages
              ? "cursor-wait opacity-70"
              : "cursor-pointer",
            isDragging
              ? "border-ui-border-interactive bg-ui-bg-interactive"
              : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover",
          ].join(" ")}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-lg">
              +
            </div>

            <Text className="font-medium">
              {uploadingImages
                ? "Uploading images..."
                : isDragging
                  ? "Drop images here"
                  : "Drag & drop images here"}
            </Text>

            <Text className="mt-1 text-ui-fg-muted">
              or click to browse multiple images
            </Text>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingImages}
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {!!uploadedImages.length && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {uploadedImages.map(
                (image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(event) =>
                      handleMediaDragStart(
                        event,
                        image.id
                      )
                    }
                    onDragOver={(event) =>
                      handleMediaDragOver(
                        event,
                        image.id
                      )
                    }
                    onDrop={(event) =>
                      handleMediaDrop(
                        event,
                        image.id
                      )
                    }
                    onDragEnd={
                      handleMediaDragEnd
                    }
                    className={[
                      "overflow-hidden rounded-lg border bg-ui-bg-base transition",
                      "cursor-grab active:cursor-grabbing",
                      reorderOverImageId ===
                        image.id &&
                      reorderingImageId !==
                        image.id
                        ? "border-ui-border-interactive ring-2 ring-ui-border-interactive"
                        : "border-ui-border-base",
                      reorderingImageId ===
                      image.id
                        ? "opacity-50"
                        : "",
                    ].join(" ")}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-ui-bg-subtle">
                      <img
                        src={image.url}
                        alt={`Product media ${index + 1}`}
                        draggable={false}
                        className="h-full w-full select-none object-contain"
                      />

                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        <div className="rounded bg-ui-bg-base px-2 py-1 text-[11px] font-medium shadow-elevation-card-rest">
                          #{index + 1}
                        </div>

                        {index === 0 && (
                          <div className="rounded bg-ui-bg-base px-2 py-1 text-[11px] font-medium shadow-elevation-card-rest">
                            Main
                          </div>
                        )}

                        {hoverCardImage?.id ===
                          image.id && (
                          <div className="rounded bg-ui-bg-base px-2 py-1 text-[11px] font-medium shadow-elevation-card-rest">
                            Flip
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 p-3">
                      <Text className="text-ui-fg-muted">
                        Storefront position {index + 1}
                      </Text>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          disabled={index === 0}
                          onClick={() =>
                            moveImage(
                              image.id,
                              "previous"
                            )
                          }
                        >
                          Move earlier
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          disabled={
                            index ===
                            uploadedImages.length - 1
                          }
                          onClick={() =>
                            moveImage(
                              image.id,
                              "next"
                            )
                          }
                        >
                          Move later
                        </Button>
                      </div>

                      {index !== 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={() =>
                            setAsThumbnail(
                              image.id
                            )
                          }
                        >
                          Make first / main
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="danger"
                        size="small"
                        onClick={() =>
                          removeImage(
                            image.id
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>

            <Text className="mt-4 text-ui-fg-muted">
              {uploadedImages.length} image
              {uploadedImages.length === 1
                ? ""
                : "s"}{" "}
              uploaded.
            </Text>
          </>
        )}
      </div>

      {/* COLOR IMAGE ASSOCIATION */}
      <div className="border-b p-6">
        <Heading
          level="h2"
          className="mb-1"
        >
          Color Images
        </Heading>

        <Text className="text-ui-fg-subtle">
          Assign uploaded images to each selected color, then choose one assigned image as the storefront swatch source and crop the exact fabric area you want to show. The same color images and swatch will be used across all sizes of that color.
        </Text>

        {!selectedColors.length ? (
          <Text className="mt-4 text-ui-fg-muted">
            Select colors first to assign images.
          </Text>
        ) : !uploadedImages.length ? (
          <Text className="mt-4 text-ui-fg-muted">
            Upload product images first.
          </Text>
        ) : (
          <div className="mt-5 space-y-6">
            {selectedColors.map(
              (color) => {
                const selectedIds =
                  colorImageMap[color] ??
                  []

                const selectedImages =
                  selectedIds
                    .map((imageId) =>
                      uploadedImages.find(
                        (image) =>
                          image.id ===
                          imageId
                      )
                    )
                    .filter(
                      (
                        image
                      ): image is UploadedImage =>
                        Boolean(image)
                    )

                const swatch =
                  colorSwatchMap[color]

                return (
                  <section
                    key={color}
                    className="rounded-lg border border-ui-border-base p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Text className="font-medium">
                          {color}
                        </Text>

                        <Text className="text-ui-fg-muted">
                          {selectedIds.length} image
                          {selectedIds.length === 1
                            ? ""
                            : "s"}{" "}
                          selected
                        </Text>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {uploadedImages.map(
                        (image) => {
                          const selected =
                            selectedIds.includes(
                              image.id
                            )

                          return (
                            <button
                              key={image.id}
                              type="button"
                              onClick={() =>
                                toggleColorImage(
                                  color,
                                  image.id
                                )
                              }
                              className={[
                                "overflow-hidden rounded-lg border bg-ui-bg-base text-left transition",
                                selected
                                  ? "border-ui-border-interactive ring-1 ring-ui-border-interactive"
                                  : "border-ui-border-base hover:border-ui-border-strong",
                              ].join(" ")}
                            >
                              <div className="relative aspect-[4/5] overflow-hidden bg-ui-bg-subtle">
                                <img
                                  src={image.url}
                                  alt={`${color} product image`}
                                  className="h-full w-full object-contain"
                                />

                                <div className="absolute left-2 top-2 rounded bg-ui-bg-base px-2 py-1 text-[10px] font-medium shadow-elevation-card-rest">
                                  #{
                                    uploadedImages.findIndex(
                                      (item) =>
                                        item.id ===
                                        image.id
                                    ) + 1
                                  }
                                </div>

                                {selected && (
                                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ui-bg-interactive text-xs font-bold text-ui-fg-on-color">
                                    ✓
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        }
                      )}
                    </div>

                    <div className="mt-5 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Text className="font-medium">
                            Storefront Swatch Editor
                          </Text>
                          <Text className="text-ui-fg-muted">
                            Choose one of the selected {color} images, then position and zoom the exact fabric area inside the square.
                          </Text>
                        </div>

                        {swatch && (
                          <Badge color="green">
                            Swatch ready
                          </Badge>
                        )}
                      </div>

                      {!selectedImages.length ? (
                        <Text className="mt-4 text-ui-fg-muted">
                          Select at least one {color} image above before creating its swatch.
                        </Text>
                      ) : (
                        <>
                          <div className="mt-4">
                            <Label
                              htmlFor={`swatch-source-${color}`}
                            >
                              Swatch source image
                            </Label>

                            <select
                              id={`swatch-source-${color}`}
                              value={
                                swatch?.image_id ??
                                ""
                              }
                              onChange={(event) =>
                                setColorSwatchSource(
                                  color,
                                  event.target.value
                                )
                              }
                              className={
                                NATIVE_SELECT_CLASS
                              }
                              style={{
                                colorScheme:
                                  "light",
                              }}
                            >
                              <option
                                value=""
                                className="bg-white text-black"
                              >
                                Choose an assigned image...
                              </option>

                              {selectedImages.map(
                                (image) => {
                                  const imageIndex =
                                    uploadedImages.findIndex(
                                      (item) =>
                                        item.id ===
                                        image.id
                                    )

                                  return (
                                    <option
                                      key={image.id}
                                      value={image.id}
                                      className="bg-white text-black"
                                    >
                                      Image #{imageIndex + 1}
                                    </option>
                                  )
                                }
                              )}
                            </select>

                            {swatch && (
                              <div className="mt-3 flex items-center gap-3 rounded-md border border-ui-border-base bg-white p-2 text-black">
                                <img
                                  src={
                                    swatch.image_url
                                  }
                                  alt={`${color} swatch source`}
                                  className="h-12 w-10 shrink-0 rounded object-cover"
                                />
                                <div className="min-w-0">
                                  <Text className="font-medium text-black">
                                    Selected swatch source
                                  </Text>
                                  <Text className="truncate text-ui-fg-muted">
                                    {(() => {
                                      const index =
                                        uploadedImages.findIndex(
                                          (item) =>
                                            item.id ===
                                            swatch.image_id
                                        )

                                      return index >= 0
                                        ? `Image #${index + 1}`
                                        : "Assigned image"
                                    })()}
                                  </Text>
                                </div>
                              </div>
                            )}
                          </div>

                          {swatch && (
                            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(220px,320px)_minmax(0,1fr)]">
                              <div>
                                <Text className="mb-2 font-medium">
                                  Crop preview
                                </Text>

                                <div className="mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-lg border border-ui-border-base bg-white shadow-elevation-card-rest">
                                  <div
                                    className="h-full w-full bg-no-repeat"
                                    style={{
                                      backgroundImage:
                                        `url(${swatch.image_url})`,
                                      backgroundPosition:
                                        `${swatch.x}% ${swatch.y}%`,
                                      backgroundSize:
                                        `${swatch.zoom * 100}% auto`,
                                    }}
                                  />
                                </div>

                                <div className="mt-3 flex items-center gap-3">
                                  <div
                                    className="h-7 w-7 shrink-0 overflow-hidden border border-ui-border-base bg-white"
                                    style={{
                                      backgroundImage:
                                        `url(${swatch.image_url})`,
                                      backgroundRepeat:
                                        "no-repeat",
                                      backgroundPosition:
                                        `${swatch.x}% ${swatch.y}%`,
                                      backgroundSize:
                                        `${swatch.zoom * 100}% auto`,
                                    }}
                                  />

                                  <Text className="text-ui-fg-muted">
                                    This small square is how the swatch crop will appear on product cards.
                                  </Text>
                                </div>
                              </div>

                              <div className="space-y-5">
                                <div>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <Label
                                      htmlFor={`swatch-x-${color}`}
                                    >
                                      Horizontal position
                                    </Label>
                                    <Text className="text-ui-fg-muted">
                                      {Math.round(
                                        swatch.x
                                      )}%
                                    </Text>
                                  </div>
                                  <input
                                    id={`swatch-x-${color}`}
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={swatch.x}
                                    onChange={(event) =>
                                      updateColorSwatchCrop(
                                        color,
                                        {
                                          x: Number(
                                            event.target.value
                                          ),
                                        }
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>

                                <div>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <Label
                                      htmlFor={`swatch-y-${color}`}
                                    >
                                      Vertical position
                                    </Label>
                                    <Text className="text-ui-fg-muted">
                                      {Math.round(
                                        swatch.y
                                      )}%
                                    </Text>
                                  </div>
                                  <input
                                    id={`swatch-y-${color}`}
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={swatch.y}
                                    onChange={(event) =>
                                      updateColorSwatchCrop(
                                        color,
                                        {
                                          y: Number(
                                            event.target.value
                                          ),
                                        }
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>

                                <div>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <Label
                                      htmlFor={`swatch-zoom-${color}`}
                                    >
                                      Zoom
                                    </Label>
                                    <Text className="text-ui-fg-muted">
                                      {swatch.zoom.toFixed(
                                        2
                                      )}×
                                    </Text>
                                  </div>
                                  <input
                                    id={`swatch-zoom-${color}`}
                                    type="range"
                                    min="1"
                                    max="6"
                                    step="0.05"
                                    value={swatch.zoom}
                                    onChange={(event) =>
                                      updateColorSwatchCrop(
                                        color,
                                        {
                                          zoom: Number(
                                            event.target.value
                                          ),
                                        }
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="small"
                                    onClick={() =>
                                      resetColorSwatchCrop(
                                        color
                                      )
                                    }
                                  >
                                    Reset crop
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="small"
                                    onClick={() =>
                                      setColorSwatchSource(
                                        color,
                                        ""
                                      )
                                    }
                                  >
                                    Clear swatch
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </section>
                )
              }
            )}
          </div>
        )}
      </div>

      {/* PRICING */}
      <div className="border-b p-6">
        <Heading
          level="h2"
          className="mb-1"
        >
          Default Variant Price
        </Heading>

        <Text className="text-ui-fg-subtle">
          These prices will be applied to every generated Color × Size variant. You can edit individual variant prices later.
        </Text>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="price-inr">
              Price INR
            </Label>

            <Input
              id="price-inr"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="mt-2"
              placeholder="995"
              value={priceInr}
              onChange={(event) =>
                setPriceInr(
                  event.target.value
                )
              }
            />

            <Text className="mt-1 text-ui-fg-muted">
              Recommended / required for your INR storefront.
            </Text>
          </div>

          <div>
            <Label htmlFor="price-eur">
              Price EUR
            </Label>

            <Input
              id="price-eur"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="mt-2"
              placeholder="Optional"
              value={priceEur}
              onChange={(event) =>
                setPriceEur(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="price-usd">
              Price USD
            </Label>

            <Input
              id="price-usd"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="mt-2"
              placeholder="Optional"
              value={priceUsd}
              onChange={(event) =>
                setPriceUsd(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <Text className="mt-4 text-ui-fg-muted">
          Medusa v2 uses major currency units. Enter ₹995 as 995 — do not multiply by 100.
        </Text>
      </div>

      {/* INVENTORY DEFAULTS */}
      <div className="border-b p-6">
        <Heading
          level="h2"
          className="mb-1"
        >
          Inventory Defaults
        </Heading>

        <Text className="text-ui-fg-subtle">
          SKU, managed inventory, and backorder settings are generated automatically for every Color × Size variant.
        </Text>

        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div>
            <Label htmlFor="default-stock">
              Default Stock Quantity
            </Label>

            <Input
              id="default-stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              className="mt-2"
              placeholder="10"
              value={defaultStock}
              disabled={
                builderMode ===
                "edit"
              }
              onChange={(event) =>
                setDefaultStock(
                  event.target.value
                )
              }
            />

            <Text className="mt-1 text-ui-fg-muted">
              {builderMode === "edit"
                ? "Locked in Edit mode because Medusa inventory is location-based. Use the standard product inventory editor for stock changes."
                : "Applied at your default stock location. Use 0 to start out of stock."}
            </Text>
          </div>

          <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
            <Text className="font-medium">
              Automatic settings
            </Text>

            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <Text className="text-ui-fg-muted">
                  Managed Inventory
                </Text>
                <Text>On</Text>
              </div>

              <div>
                <Text className="text-ui-fg-muted">
                  Allow Backorder
                </Text>
                <Text>Off</Text>
              </div>

              <div>
                <Text className="text-ui-fg-muted">
                  Inventory Kit
                </Text>
                <Text>Off</Text>
              </div>

              <div>
                <Text className="text-ui-fg-muted">
                  SKU Product Code
                </Text>
                <Text className="font-mono text-xs">
                  {builderMode ===
                  "create"
                    ? `SAF-${skuProductCode}`
                    : "Existing SKUs preserved"}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {!!variantCombinations.length && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Text className="font-medium">
                Generated Variants
              </Text>

              <Text className="text-ui-fg-muted">
                {variantCombinations.length} variants
              </Text>
            </div>

            <div className="max-h-[320px] overflow-auto rounded-md border border-ui-border-base">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="sticky top-0 bg-ui-bg-base">
                  <tr className="border-b border-ui-border-base">
                    <th className="px-4 py-3 font-medium">
                      Variant
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Auto SKU
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Stock
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {variantCombinations.map(
                    (variant) => (
                      <tr
                        key={variant.sku}
                        className="border-b border-ui-border-base last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          {variant.color} / {variant.size}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs">
                          {variant.sku}
                        </td>

                        <td className="px-4 py-3">
                          {variant.stock_quantity}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ORGANIZE */}
      <div className="border-b p-6">
        <Heading
          level="h2"
          className="mb-1"
        >
          Organize
        </Heading>

        <Text className="text-ui-fg-subtle">
          Choose the product type, collection, category tree, and tags. Shipping and sales-channel defaults stay available under Advanced.
        </Text>

        {organizeError && (
          <Text className="mt-3 text-ui-fg-error">
            {organizeError}
          </Text>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <Label htmlFor="product-type">
              Product Type
            </Label>

            <select
              id="product-type"
              value={selectedTypeId}
              disabled={organizeLoading}
              onChange={(event) =>
                setSelectedTypeId(
                  event.target.value
                )
              }
              className={
                NATIVE_SELECT_CLASS
              }
              style={{
                colorScheme: "light",
              }}
            >
              <option
                value=""
                className="bg-white text-black"
              >
                No product type
              </option>

              {productTypes.map(
                (type) => (
                  <option
                    className="bg-white text-black"
                    key={type.id}
                    value={type.id}
                  >
                    {type.value}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <Label htmlFor="product-collection">
              Collection
            </Label>

            <select
              id="product-collection"
              value={
                selectedCollectionId
              }
              disabled={organizeLoading}
              onChange={(event) =>
                setSelectedCollectionId(
                  event.target.value
                )
              }
              className={
                NATIVE_SELECT_CLASS
              }
              style={{
                colorScheme: "light",
              }}
            >
              <option
                value=""
                className="bg-white text-black"
              >
                No collection
              </option>

              {collections.map(
                (collection) => (
                  <option
                    className="bg-white text-black"
                    key={
                      collection.id
                    }
                    value={
                      collection.id
                    }
                  >
                    {
                      collection.title
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* CATEGORY TREE */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="category-search">
              Categories
            </Label>

            {!!selectedCategoryIds.length && (
              <Text className="text-ui-fg-muted">
                {selectedCategoryIds.length} selected
              </Text>
            )}
          </div>

          <Input
            id="category-search"
            className="mt-2"
            placeholder="Search category or full path..."
            value={categorySearch}
            onChange={(event) =>
              setCategorySearch(
                event.target.value
              )
            }
          />

          {!!selectedCategoryIds.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCategoryIds.map(
                (id) => {
                  const category =
                    categoryById.get(id)

                  if (!category) {
                    return null
                  }

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        toggleCategory(id)
                      }
                      title="Remove category"
                    >
                      <Badge color="blue">
                        {categoryPathById.get(
                          id
                        ) ?? category.name}{" "}
                        ×
                      </Badge>
                    </button>
                  )
                }
              )}
            </div>
          )}

          <div className="mt-3 max-h-[340px] overflow-y-auto rounded-md border border-ui-border-base bg-ui-bg-base">
            {categorySearch.trim() ? (
              categorySearchResults.length ? (
                categorySearchResults.map(
                  (category) => {
                    const selected =
                      selectedCategoryIds.includes(
                        category.id
                      )

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          toggleCategory(
                            category.id
                          )
                        }
                        className="flex w-full items-center justify-between gap-3 border-b border-ui-border-base px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {category.name}
                          </span>
                          <span className="block truncate text-xs text-ui-fg-muted">
                            {categoryPathById.get(
                              category.id
                            )}
                          </span>
                        </span>

                        <span
                          className={
                            selected
                              ? "font-semibold text-ui-fg-interactive"
                              : "text-ui-fg-muted"
                          }
                        >
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    )
                  }
                )
              ) : (
                <Text className="p-4 text-ui-fg-muted">
                  No categories match this search.
                </Text>
              )
            ) : rootCategories.length ? (
              rootCategories.map(
                (category) =>
                  renderCategoryTreeNode(
                    category
                  )
              )
            ) : (
              <Text className="p-4 text-ui-fg-muted">
                No categories available.
              </Text>
            )}
          </div>

          <Text className="mt-2 text-ui-fg-muted">
            Expand only the branch you need. Search results show the complete parent → child path.
          </Text>
        </div>

        {/* TAGS */}
        <div className="mt-6">
          <Label htmlFor="tag-search">
            Tags
          </Label>

          <Input
            id="tag-search"
            className="mt-2"
            placeholder="Search tags..."
            value={tagSearch}
            onChange={(event) =>
              setTagSearch(
                event.target.value
              )
            }
          />

          {!!selectedTagIds.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTagIds.map(
                (id) => {
                  const tag =
                    productTags.find(
                      (item) =>
                        item.id === id
                    )

                  if (!tag) {
                    return null
                  }

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        toggleTag(id)
                      }
                    >
                      <Badge color="green">
                        {tag.value} ×
                      </Badge>
                    </button>
                  )
                }
              )}
            </div>
          )}

          {!!tagSearch.trim() && (
            <div className="mt-3 max-h-[220px] overflow-y-auto rounded-md border border-ui-border-base">
              {filteredTags.map(
                (tag) => {
                  const selected =
                    selectedTagIds.includes(
                      tag.id
                    )

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        toggleTag(
                          tag.id
                        )
                      }
                      className="flex w-full items-center justify-between border-b border-ui-border-base px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                    >
                      <span>
                        {tag.value}
                      </span>
                      <span>
                        {selected
                          ? "✓"
                          : ""}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          )}
        </div>

        {/* ADVANCED ORGANIZE */}
        <div className="mt-6 rounded-lg border border-ui-border-base">
          <button
            type="button"
            onClick={() =>
              setShowAdvancedOrganize(
                (current) => !current
              )
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ui-bg-subtle"
          >
            <div>
              <Text className="font-medium">
                Advanced organization
              </Text>
              <Text className="text-ui-fg-muted">
                Shipping profile, sales channel, and discount settings
              </Text>
            </div>
            <span className="text-ui-fg-muted">
              {showAdvancedOrganize
                ? "▾"
                : "▸"}
            </span>
          </button>

          {showAdvancedOrganize && (
            <div className="border-t border-ui-border-base p-4">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <Label htmlFor="shipping-profile">
                    Shipping Profile
                  </Label>
                  <select
                    id="shipping-profile"
                    value={
                      selectedShippingProfileId
                    }
                    disabled={organizeLoading}
                    onChange={(event) =>
                      setSelectedShippingProfileId(
                        event.target.value
                      )
                    }
                    className={
                      NATIVE_SELECT_CLASS
                    }
                    style={{
                      colorScheme:
                        "light",
                    }}
                  >
                    <option
                      value=""
                      className="bg-white text-black"
                    >
                      {organizeLoading
                        ? "Loading..."
                        : "Select shipping profile"}
                    </option>
                    {shippingProfiles.map(
                      (profile) => (
                        <option
                          className="bg-white text-black"
                          key={profile.id}
                          value={profile.id}
                        >
                          {profile.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <Label htmlFor="sales-channel">
                    Sales Channel
                  </Label>
                  <select
                    id="sales-channel"
                    value={
                      selectedSalesChannelId
                    }
                    disabled={organizeLoading}
                    onChange={(event) =>
                      setSelectedSalesChannelId(
                        event.target.value
                      )
                    }
                    className={
                      NATIVE_SELECT_CLASS
                    }
                    style={{
                      colorScheme:
                        "light",
                    }}
                  >
                    <option
                      value=""
                      className="bg-white text-black"
                    >
                      {organizeLoading
                        ? "Loading..."
                        : "Select sales channel"}
                    </option>
                    {salesChannels.map(
                      (channel) => (
                        <option
                          className="bg-white text-black"
                          key={channel.id}
                          value={channel.id}
                        >
                          {channel.name}
                          {channel.is_disabled
                            ? " (Disabled)"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-ui-border-base p-4">
                <input
                  type="checkbox"
                  checked={discountable}
                  onChange={(event) =>
                    setDiscountable(
                      event.target.checked
                    )
                  }
                />
                <div>
                  <Text className="font-medium">
                    Discountable
                  </Text>
                  <Text className="text-ui-fg-muted">
                    Allow promotions and discounts to apply to this product.
                  </Text>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* STYLE WITH */}
      <div className="border-b p-6">
        <Heading
          level="h2"
          className="mb-1"
        >
          Style With
        </Heading>

        <Text className="text-ui-fg-subtle">
          Curate up to 4 complementary products. The storefront reads only these product IDs, so product titles, images, and prices stay up to date automatically.
        </Text>

        <div className="mt-5 max-w-2xl">
          <Label htmlFor="style-with-search">
            Search products
          </Label>

          <Input
            id="style-with-search"
            className="mt-2"
            placeholder="Search by product title or handle..."
            value={styleWithSearch}
            disabled={
              styleWithProducts.length >=
              4
            }
            onChange={(event) =>
              setStyleWithSearch(
                event.target.value
              )
            }
          />

          {styleWithProducts.length >=
            4 && (
            <Text className="mt-2 text-ui-fg-muted">
              Maximum 4 Style With products selected.
            </Text>
          )}

          {styleWithSearching && (
            <Text className="mt-2 text-ui-fg-muted">
              Searching products...
            </Text>
          )}

          {styleWithSearchResults.length >
            0 && (
            <div className="mt-2 overflow-hidden rounded-lg border border-ui-border-base bg-white">
              {styleWithSearchResults.map(
                (product) => (
                  <button
                    key={
                      product.id
                    }
                    type="button"
                    onClick={() =>
                      addStyleWithProduct(
                        product
                      )
                    }
                    className="flex w-full items-center gap-3 border-b border-ui-border-base px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                  >
                    {product.thumbnail ? (
                      <img
                        src={
                          product.thumbnail
                        }
                        alt=""
                        className="h-12 w-10 shrink-0 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-10 shrink-0 bg-ui-bg-subtle" />
                    )}

                    <div className="min-w-0 flex-1">
                      <Text className="truncate font-medium">
                        {
                          product.title
                        }
                      </Text>

                      <Text className="truncate text-ui-fg-muted">
                        /products/
                        {
                          product.handle
                        }
                      </Text>
                    </div>

                    <Text className="text-ui-fg-interactive">
                      Add
                    </Text>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {styleWithProducts.length >
          0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {styleWithProducts.map(
              (
                product,
                index
              ) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border border-ui-border-base bg-white p-3"
                >
                  {product.thumbnail ? (
                    <img
                      src={
                        product.thumbnail
                      }
                      alt=""
                      className="h-16 w-12 shrink-0 object-contain"
                    />
                  ) : (
                    <div className="h-16 w-12 shrink-0 bg-ui-bg-subtle" />
                  )}

                  <div className="min-w-0 flex-1">
                    <Text className="truncate font-medium">
                      {product.title}
                    </Text>

                    <Text className="text-ui-fg-muted">
                      Position{" "}
                      {index + 1}
                    </Text>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      type="button"
                      size="small"
                      variant="secondary"
                      disabled={
                        index === 0
                      }
                      onClick={() =>
                        moveStyleWithProduct(
                          product.id,
                          "previous"
                        )
                      }
                    >
                      ↑
                    </Button>

                    <Button
                      type="button"
                      size="small"
                      variant="secondary"
                      disabled={
                        index ===
                        styleWithProducts.length -
                          1
                      }
                      onClick={() =>
                        moveStyleWithProduct(
                          product.id,
                          "next"
                        )
                      }
                    >
                      ↓
                    </Button>

                    <Button
                      type="button"
                      size="small"
                      variant="danger"
                      onClick={() =>
                        removeStyleWithProduct(
                          product.id
                        )
                      }
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <Text className="mt-4 text-ui-fg-muted">
            No curated products selected. The storefront can fall back to collection/tag recommendations.
          </Text>
        )}

        <Text className="mt-4 text-ui-fg-muted">
          {styleWithProducts.length} / 4 selected
        </Text>
      </div>

      {/* COLOR + SIZE */}
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        {builderMode === "edit" && (
          <div className="lg:col-span-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
            <Text className="font-medium">
              Variant structure locked in Edit mode
            </Text>

            <Text className="mt-1 text-ui-fg-muted">
              Existing colors and sizes are shown for reference and keep their current variant IDs. Add/remove variant combinations in Medusa's standard product editor.
            </Text>
          </div>
        )}

        {/* COLORS */}
        <section>
          <Heading
            level="h2"
            className="mb-1"
          >
            Colors
          </Heading>

          <Text className="text-ui-fg-subtle">
            Type a color. Existing global values are reused automatically; a new value can be added directly from here.
          </Text>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Type color, e.g. Ocean Mist"
              value={colorSearch}
              onChange={(event) => {
                setColorSearch(
                  event.target.value
                )
                setOptionValueError("")
              }}
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault()
                  createOrSelectGlobalValue(
                    "color"
                  )
                }
              }}
            />

            <Button
              type="button"
              variant="secondary"
              disabled={
                !colorSearch.trim() ||
                addingColorValue
              }
              onClick={() =>
                createOrSelectGlobalValue(
                  "color"
                )
              }
            >
              {addingColorValue
                ? "Adding..."
                : "Add / Select"}
            </Button>
          </div>

          <div className="mt-3 flex min-h-9 flex-wrap gap-2">
            {selectedColors.map(
              (color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    toggleColor(
                      color
                    )
                  }
                  title="Remove color"
                >
                  <Badge color="blue">
                    {color} ×
                  </Badge>
                </button>
              )
            )}

            {!selectedColors.length && (
              <Text className="text-ui-fg-muted">
                No colors selected.
              </Text>
            )}
          </div>

          {!!colorSearch.trim() && (
            <div className="mt-3 overflow-hidden rounded-md border border-ui-border-base">
              {filteredColors.map(
                (item) => {
                  const selected =
                    selectedColors.includes(
                      item.value
                    )

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (
                          !selected
                        ) {
                          setSelectedColors(
                            (previous) => [
                              ...previous,
                              item.value,
                            ]
                          )
                        }
                        setColorSearch("")
                      }}
                      className="flex w-full items-center justify-between border-b border-ui-border-base px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                    >
                      <span>
                        {item.value}
                      </span>

                      <span>
                        {selected
                          ? "Selected"
                          : "Select"}
                      </span>
                    </button>
                  )
                }
              )}

              {!colorValues.some(
                (item) =>
                  item.value
                    .trim()
                    .toLowerCase() ===
                  normalizeOptionInput(
                    colorSearch,
                    "color"
                  ).toLowerCase()
              ) && (
                <button
                  type="button"
                  disabled={
                    addingColorValue
                  }
                  onClick={() =>
                    createOrSelectGlobalValue(
                      "color"
                    )
                  }
                  className="flex w-full items-center justify-between bg-ui-bg-subtle px-4 py-3 text-left font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    + Add “
                    {normalizeOptionInput(
                      colorSearch,
                      "color"
                    )}
                    ” to global Color
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* SIZES */}
        <section>
          <Heading
            level="h2"
            className="mb-1"
          >
            Sizes
          </Heading>

          <Text className="text-ui-fg-subtle">
            Type a size. Existing global values are reused; missing values can be created here without opening Product Options.
          </Text>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Type size, e.g. XXL"
              value={sizeSearch}
              onChange={(event) => {
                setSizeSearch(
                  event.target.value
                )
                setOptionValueError("")
              }}
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault()
                  createOrSelectGlobalValue(
                    "size"
                  )
                }
              }}
            />

            <Button
              type="button"
              variant="secondary"
              disabled={
                !sizeSearch.trim() ||
                addingSizeValue
              }
              onClick={() =>
                createOrSelectGlobalValue(
                  "size"
                )
              }
            >
              {addingSizeValue
                ? "Adding..."
                : "Add / Select"}
            </Button>
          </div>

          <div className="mt-3 flex min-h-9 flex-wrap gap-2">
            {selectedSizes.map(
              (size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    toggleSize(
                      size
                    )
                  }
                  title="Remove size"
                >
                  <Badge color="green">
                    {size} ×
                  </Badge>
                </button>
              )
            )}

            {!selectedSizes.length && (
              <Text className="text-ui-fg-muted">
                No sizes selected.
              </Text>
            )}
          </div>

          {!!sizeSearch.trim() && (
            <div className="mt-3 overflow-hidden rounded-md border border-ui-border-base">
              {filteredSizes.map(
                (item) => {
                  const selected =
                    selectedSizes.includes(
                      item.value
                    )

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (
                          !selected
                        ) {
                          setSelectedSizes(
                            (previous) => [
                              ...previous,
                              item.value,
                            ]
                          )
                        }
                        setSizeSearch("")
                      }}
                      className="flex w-full items-center justify-between border-b border-ui-border-base px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                    >
                      <span>
                        {item.value}
                      </span>

                      <span>
                        {selected
                          ? "Selected"
                          : "Select"}
                      </span>
                    </button>
                  )
                }
              )}

              {!sizeValues.some(
                (item) =>
                  item.value
                    .trim()
                    .toLowerCase() ===
                  normalizeOptionInput(
                    sizeSearch,
                    "size"
                  ).toLowerCase()
              ) && (
                <button
                  type="button"
                  disabled={
                    addingSizeValue
                  }
                  onClick={() =>
                    createOrSelectGlobalValue(
                      "size"
                    )
                  }
                  className="flex w-full items-center justify-between bg-ui-bg-subtle px-4 py-3 text-left font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    + Add “
                    {normalizeOptionInput(
                      sizeSearch,
                      "size"
                    )}
                    ” to global Size
                  </span>
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {optionValueError && (
        <div className="border-t px-6 py-4">
          <Text className="text-ui-fg-error">
            {optionValueError}
          </Text>
        </div>
      )}

      {createError && (
        <div className="border-t px-6 py-4">
          <Text className="text-ui-fg-error">
            {createError}
          </Text>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-6 py-4">
        <Text className="text-ui-fg-muted">
          {builderMode === "edit"
            ? "Existing variants: "
            : ""}
          {selectedColors.length}{" "}
          colors ×{" "}
          {selectedSizes.length}{" "}
          sizes ={" "}
          {selectedColors.length *
            selectedSizes.length}{" "}
          variants
        </Text>

        <Button
          disabled={
            !canContinue
          }
          onClick={
            handleContinue
          }
        >
          {creatingProduct
            ? builderMode ===
              "edit"
              ? "Saving Changes..."
              : "Creating Product..."
            : builderMode ===
              "edit"
              ? "Save Changes"
              : "Create Product"}
        </Button>
      </div>
    </Container>
  )
}

export const config =
  defineRouteConfig({
    label: "Product Builder",
  })

export default ProductBuilderPage