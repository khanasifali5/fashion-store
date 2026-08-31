import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

type HomepageSection = {
  id: string
  type: string
  title?: string | null
  position: number
  is_active: boolean
  config?: Record<string, unknown> | null
}

type SectionTypeOption = {
  value: string
  label: string
  description: string
  group: "shop" | "editorial" | "campaign" | "layout"
}

type AdminCollection = {
  id: string
  title: string
  handle: string
}

type ShowcaseSource =
  | "collection"
  | "category"
  | "manual"
  | "new_arrivals"

type AdminCategory = {
  id: string
  name: string
  handle: string
  parent_category_id?: string | null
}

type AdminProductPrice = {
  amount?: number
  currency_code?: string
}

type AdminProductVariant = {
  prices?: AdminProductPrice[]
}

type AdminProductOptionValue = {
  id?: string
  value?: string
}

type AdminProductOption = {
  id?: string
  title?: string | null
  values?: AdminProductOptionValue[]
}

type AdminProduct = {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
  options?: AdminProductOption[]
  variants?: AdminProductVariant[]
}

type CollectionCardDraft = {
  collection_handle: string
  title: string
  subtitle: string
  image_url: string
  button_text: string
  custom_url: string
  content_offset_x: number
  content_offset_y: number
}

const createEmptyCollectionCard = (): CollectionCardDraft => ({
  collection_handle: "",
  title: "",
  subtitle: "",
  image_url: "",
  button_text: "Shop Now",
  custom_url: "",
  content_offset_x: 0,
  content_offset_y: 0,
})


type ImageMosaicItemDraft = {
  image_url: string
  image_alt: string
  link_url: string
  size: "small" | "wide" | "tall" | "large"
  image_position: "center" | "top" | "bottom" | "left" | "right"
}

const createEmptyMosaicItem = (): ImageMosaicItemDraft => ({
  image_url: "",
  image_alt: "",
  link_url: "",
  size: "small",
  image_position: "center",
})


type ShopTheLookHotspotDraft = {
  id: string
  x: number
  y: number
  product_id: string
  product_handle: string
  product_title: string
  product_thumbnail: string
  price_label: string
  label: string
}

const createEmptyShopHotspot = (
  x = 50,
  y = 50
): ShopTheLookHotspotDraft => ({
  id: `hotspot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  x,
  y,
  product_id: "",
  product_handle: "",
  product_title: "",
  product_thumbnail: "",
  price_label: "",
  label: "",
})

type CategoryShowcaseDestinationType =
  | "category"
  | "collection"
  | "custom"

type CategoryShowcaseItemDraft = {
  id: string
  title: string
  subtitle: string
  image_url: string
  image_alt: string
  link_url: string
  button_text: string

  /*
   * Per-card media framing.
   *
   * cover   = fill the card; crop is allowed
   * contain = show the full source image; no crop
   */
  image_fit: "cover" | "contain"
  image_position_x: number
  image_position_y: number
  image_zoom: number

  /*
   * Admin-only destination metadata.
   *
   * Storefront remains backward-compatible because link_url
   * is still the final URL consumed by the existing section.
   */
  destination_type: CategoryShowcaseDestinationType
  category_id: string
  collection_handle: string
}

const createCategoryItem = (): CategoryShowcaseItemDraft => ({
  id: `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  subtitle: "",
  image_url: "",
  image_alt: "",
  link_url: "",
  button_text: "Shop Now",
  image_fit: "cover",
  image_position_x: 50,
  image_position_y: 50,
  image_zoom: 1,
  destination_type: "category",
  category_id: "",
  collection_handle: "",
})

const EDITORIAL_FONT_OPTIONS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "\"Times New Roman\", Times, serif", label: "Times New Roman" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "\"Trebuchet MS\", sans-serif", label: "Trebuchet MS" },
  { value: "\"Courier New\", monospace", label: "Courier New" },
  { value: "Garamond, Georgia, serif", label: "Garamond" },
  { value: "system-ui, sans-serif", label: "System UI" },
]

const DEFAULT_EDITORIAL_COLORS = [
  "#FFFFFF", "#000000", "#111111", "#24211E", "#F7F4EF", "#EFE8DD",
  "#E8D7C5", "#D8C3A5", "#B88A5A", "#A96F3C", "#8B5E3C", "#6B4F3A",
  "#D9C4B0", "#C9A268", "#B48A52", "#8D6E63", "#5D4037", "#263238",
  "#37474F", "#455A64", "#607D8B", "#0F4C5C", "#1B4965", "#2A6F97",
  "#006D77", "#2D6A4F", "#52796F", "#7F5539", "#9C6644", "#A4133C",
  "#C9184A", "#D00000", "#6A040F", "#5A189A", "#3C096C", "#4361EE",
  "#3A0CA3", "#F4A261", "#E9C46A", "#FFB703",
]

const SAFAFI_BRAND_COLORS = [
  {
    name: "SAFAFI Gold",
    value: "#A97838",
  },
  {
    name: "Warm Gold",
    value: "#B48A52",
  },
  {
    name: "Deep Brown",
    value: "#2A211C",
  },
  {
    name: "Cream",
    value: "#F8F4EC",
  },
  {
    name: "White",
    value: "#FFFFFF",
  },
  {
    name: "Black",
    value: "#000000",
  },
] as const

const SECTION_TYPES: SectionTypeOption[] = [
  {
    value: "product_showcase",
    label: "Product Showcase",
    description: "Show products from a collection or curated source.",
    group: "shop",
  },
  {
    value: "collection_cards",
    label: "Collection Cards",
    description: "Visual cards that lead customers into collections.",
    group: "shop",
  },
  {
    value: "category_showcase",
    label: "Category Showcase",
    description: "Visual cards for Women, Men, Girls, Boys, Bags and more.",
    group: "shop",
  },
  {
    value: "shop_the_look",
    label: "Shop the Look",
    description: "Lifestyle image with linked shoppable products.",
    group: "shop",
  },

  {
    value: "editorial_split",
    label: "Image + Text",
    description: "Editorial media on one side with copy and CTA on the other.",
    group: "editorial",
  },
  {
    value: "featured_story",
    label: "Featured Story",
    description: "Large editorial story with image or video, copy and CTA.",
    group: "editorial",
  },
  {
    value: "image_mosaic",
    label: "Lookbook / Mosaic",
    description: "Fashion editorial grid with mixed image sizes.",
    group: "editorial",
  },
  {
    value: "editorial_text",
    label: "Editorial Text",
    description: "Brand story, introduction, quote or campaign copy.",
    group: "editorial",
  },

  {
    value: "campaign_banner",
    label: "Campaign Banner",
    description: "Full-width promotional or seasonal campaign.",
    group: "campaign",
  },
  {
    value: "video_story",
    label: "Video Story",
    description: "Video-led brand or campaign storytelling.",
    group: "campaign",
  },
  {
    value: "marquee",
    label: "Announcement / Marquee",
    description: "Lightweight moving campaign or brand message.",
    group: "campaign",
  },

  {
    value: "spacer",
    label: "Spacer / Divider",
    description: "Control breathing room or add a subtle divider.",
    group: "layout",
  },
]

const SECTION_GROUPS = [
  {
    key: "shop" as const,
    label: "Shop",
    description: "Products, categories, collections and shoppable content.",
  },
  {
    key: "editorial" as const,
    label: "Editorial",
    description: "Stories, lookbooks and brand-led content.",
  },
  {
    key: "campaign" as const,
    label: "Campaign & Media",
    description: "Seasonal campaigns, video and announcements.",
  },
  {
    key: "layout" as const,
    label: "Layout",
    description: "Simple structural spacing and dividers.",
  },
]

const HomepageSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [previewProducts, setPreviewProducts] = useState<AdminProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  const [type, setType] = useState("product_showcase")
  const [title, setTitle] = useState("")
  const [position, setPosition] = useState("0")
  const [isActive, setIsActive] = useState(true)
  const [showcaseSource, setShowcaseSource] = useState<ShowcaseSource>("collection")
  const [showcaseCollection, setShowcaseCollection] = useState("")
  const [showcaseCategoryId, setShowcaseCategoryId] = useState("")
  const [showcaseManualProducts, setShowcaseManualProducts] = useState<AdminProduct[]>([])
  const [showcaseProductQuery, setShowcaseProductQuery] = useState("")
  const [showcaseProductResults, setShowcaseProductResults] = useState<AdminProduct[]>([])
  const [showcaseProductSearchLoading, setShowcaseProductSearchLoading] = useState(false)
  const [showcaseSubtitle, setShowcaseSubtitle] = useState("")
  const [showcaseLayout, setShowcaseLayout] = useState("grid")
  const [showcaseDesktopColumns, setShowcaseDesktopColumns] = useState("4")
  const [showcaseProductCount, setShowcaseProductCount] = useState("8")
  const [showcaseImageRatio, setShowcaseImageRatio] = useState("portrait")
  const [showcaseWidth, setShowcaseWidth] = useState("contained")
  const [showcaseTopSpacing, setShowcaseTopSpacing] = useState("48")
  const [showcaseBottomSpacing, setShowcaseBottomSpacing] = useState("48")
  const [showcaseBackground, setShowcaseBackground] = useState("#FFFFFF")
  const [showcaseShowPrice, setShowcaseShowPrice] = useState(true)
  const [showcaseShowBadge, setShowcaseShowBadge] = useState(true)
  const [showcaseShowSwatches, setShowcaseShowSwatches] = useState(true)
  const [showcaseShowQuickAdd, setShowcaseShowQuickAdd] = useState(false)
  const [showcaseDesktopVisible, setShowcaseDesktopVisible] = useState(true)
  const [showcaseMobileVisible, setShowcaseMobileVisible] = useState(true)

  // Collection Cards
  const [collectionCards, setCollectionCards] = useState<CollectionCardDraft[]>([
    createEmptyCollectionCard(),
    createEmptyCollectionCard(),
    createEmptyCollectionCard(),
    createEmptyCollectionCard(),
  ])
  const [collectionCardsDesktopColumns, setCollectionCardsDesktopColumns] = useState("4")
  const [collectionCardsMobileColumns, setCollectionCardsMobileColumns] = useState("2")
  const [collectionCardsImageRatio, setCollectionCardsImageRatio] = useState("portrait")
  const [collectionCardsWidth, setCollectionCardsWidth] = useState("full")
  const [collectionCardsTopSpacing, setCollectionCardsTopSpacing] = useState("48")
  const [collectionCardsBottomSpacing, setCollectionCardsBottomSpacing] = useState("48")
  const [collectionCardsGap, setCollectionCardsGap] = useState("16")
  const [collectionCardsBackground, setCollectionCardsBackground] = useState("#FFFFFF")
  const [collectionCardsTextPosition, setCollectionCardsTextPosition] = useState("bottom-center")
  const [collectionCardsOverlayOpacity, setCollectionCardsOverlayOpacity] = useState("12")

  // Collection card typography / CTA styling
  const [collectionCardsTitleColor, setCollectionCardsTitleColor] = useState("#FFFFFF")
  const [collectionCardsTitleSize, setCollectionCardsTitleSize] = useState("30")
  const [collectionCardsTitleMobileSize, setCollectionCardsTitleMobileSize] = useState("20")
  const [collectionCardsTitleWeight, setCollectionCardsTitleWeight] = useState("500")

  const [collectionCardsSubtitleColor, setCollectionCardsSubtitleColor] = useState("#FFFFFF")
  const [collectionCardsSubtitleSize, setCollectionCardsSubtitleSize] = useState("14")

  const [collectionCardsButtonStyle, setCollectionCardsButtonStyle] = useState("filled")
  const [collectionCardsButtonBgColor, setCollectionCardsButtonBgColor] = useState("#FFFFFF")
  const [collectionCardsButtonTextColor, setCollectionCardsButtonTextColor] = useState("#111111")
  const [collectionCardsButtonBorderColor, setCollectionCardsButtonBorderColor] = useState("#FFFFFF")
  const [collectionCardsButtonSize, setCollectionCardsButtonSize] = useState("12")
  const [collectionCardsButtonRadius, setCollectionCardsButtonRadius] = useState("0")
  const [collectionCardsButtonPaddingX, setCollectionCardsButtonPaddingX] = useState("18")
  const [collectionCardsButtonPaddingY, setCollectionCardsButtonPaddingY] = useState("10")

  const [collectionCardsDesktopVisible, setCollectionCardsDesktopVisible] = useState(true)
  const [collectionCardsMobileVisible, setCollectionCardsMobileVisible] = useState(true)
  const [uploadingCollectionCardIndex, setUploadingCollectionCardIndex] = useState<number | null>(null)

  // Editorial Split
  const [editorialLayout, setEditorialLayout] = useState("image-left")
  const [editorialWidth, setEditorialWidth] = useState("full")
  const [editorialMinHeight, setEditorialMinHeight] = useState("620")
  const [editorialImageUrl, setEditorialImageUrl] = useState("")
  const [editorialImageAlt, setEditorialImageAlt] = useState("")
  const [editorialImageFit, setEditorialImageFit] = useState("cover")
  const [editorialImagePosition, setEditorialImagePosition] = useState("center")
  const [editorialEyebrow, setEditorialEyebrow] = useState("")
  const [editorialHeading, setEditorialHeading] = useState("")
  const [editorialBody, setEditorialBody] = useState("")
  const [editorialButtonText, setEditorialButtonText] = useState("Shop Now")
  const [editorialButtonUrl, setEditorialButtonUrl] = useState("")
  const [editorialContentAlign, setEditorialContentAlign] = useState("left")
  const [editorialContentVertical, setEditorialContentVertical] = useState("center")
  const [editorialContentPadding, setEditorialContentPadding] = useState("64")
  const [editorialBackground, setEditorialBackground] = useState("#F7F4EF")
  const [editorialTextColor, setEditorialTextColor] = useState("#111111")
  const [editorialEyebrowColor, setEditorialEyebrowColor] = useState("#B48A52")
  const [editorialHeadingFont, setEditorialHeadingFont] = useState("Georgia, serif")
  const [editorialHeadingSize, setEditorialHeadingSize] = useState("52")
  const [editorialHeadingMobileSize, setEditorialHeadingMobileSize] = useState("34")
  const [editorialHeadingWeight, setEditorialHeadingWeight] = useState("500")
  const [editorialBodyFont, setEditorialBodyFont] = useState("Arial, sans-serif")
  const [editorialBodySize, setEditorialBodySize] = useState("16")
  const [editorialButtonFont, setEditorialButtonFont] = useState("Arial, sans-serif")
  const [editorialButtonStyle, setEditorialButtonStyle] = useState("filled")
  const [editorialButtonBg, setEditorialButtonBg] = useState("#111111")
  const [editorialButtonColor, setEditorialButtonColor] = useState("#FFFFFF")
  const [editorialButtonBorder, setEditorialButtonBorder] = useState("#111111")
  const [editorialButtonRadius, setEditorialButtonRadius] = useState("0")
  const [editorialButtonSize, setEditorialButtonSize] = useState("12")
  const [editorialButtonPaddingX, setEditorialButtonPaddingX] = useState("24")
  const [editorialButtonPaddingY, setEditorialButtonPaddingY] = useState("14")
  const [editorialTopSpacing, setEditorialTopSpacing] = useState("0")
  const [editorialBottomSpacing, setEditorialBottomSpacing] = useState("0")
  const [editorialMobileOrder, setEditorialMobileOrder] = useState("image-first")
  const [editorialDesktopVisible, setEditorialDesktopVisible] = useState(true)
  const [editorialMobileVisible, setEditorialMobileVisible] = useState(true)
  const [uploadingEditorialImage, setUploadingEditorialImage] = useState(false)
  const [editorialCustomColors, setEditorialCustomColors] = useState<string[]>([])


  // Image Mosaic / Lookbook
  const [mosaicItems, setMosaicItems] = useState<ImageMosaicItemDraft[]>([
    { ...createEmptyMosaicItem(), size: "large" },
    createEmptyMosaicItem(),
    { ...createEmptyMosaicItem(), size: "tall" },
    { ...createEmptyMosaicItem(), size: "wide" },
  ])
  const [mosaicWidth, setMosaicWidth] = useState("full")
  const [mosaicDesktopColumns, setMosaicDesktopColumns] = useState("4")
  const [mosaicMobileColumns, setMosaicMobileColumns] = useState("2")
  const [mosaicRowHeight, setMosaicRowHeight] = useState("240")
  const [mosaicMobileRowHeight, setMosaicMobileRowHeight] = useState("180")
  const [mosaicGap, setMosaicGap] = useState("12")
  const [mosaicBackground, setMosaicBackground] = useState("#FFFFFF")
  const [mosaicTopSpacing, setMosaicTopSpacing] = useState("48")
  const [mosaicBottomSpacing, setMosaicBottomSpacing] = useState("48")
  const [mosaicDesktopVisible, setMosaicDesktopVisible] = useState(true)
  const [mosaicMobileVisible, setMosaicMobileVisible] = useState(true)
  const [uploadingMosaicIndex, setUploadingMosaicIndex] = useState<number | null>(null)

  // Shop the Look
  const [shopImageUrl, setShopImageUrl] = useState("")
  const [shopImageAlt, setShopImageAlt] = useState("")
  const [shopImagePosition, setShopImagePosition] = useState("center")
  const [shopWidth, setShopWidth] = useState("full")
  const [shopDesktopHeight, setShopDesktopHeight] = useState("760")
  const [shopMobileHeight, setShopMobileHeight] = useState("560")
  const [shopBackground, setShopBackground] = useState("#FFFFFF")
  const [shopTopSpacing, setShopTopSpacing] = useState("48")
  const [shopBottomSpacing, setShopBottomSpacing] = useState("48")
  const [shopDesktopVisible, setShopDesktopVisible] = useState(true)
  const [shopMobileVisible, setShopMobileVisible] = useState(true)
  const [shopShowProductCard, setShopShowProductCard] = useState(true)
  const [shopHotspotColor, setShopHotspotColor] = useState("#FFFFFF")
  const [shopHotspotRingColor, setShopHotspotRingColor] = useState("#111111")
  const [shopHotspotSize, setShopHotspotSize] = useState("22")
  const [shopHotspots, setShopHotspots] = useState<ShopTheLookHotspotDraft[]>([])
  const [shopProductQuery, setShopProductQuery] = useState("")
  const [shopProductResults, setShopProductResults] = useState<AdminProduct[]>([])
  const [shopProductsLoading, setShopProductsLoading] = useState(false)
  const [uploadingShopImage, setUploadingShopImage] = useState(false)

  // Spacer / Divider
  const [spacerHeight, setSpacerHeight] = useState("64")
  const [spacerMobileHeight, setSpacerMobileHeight] = useState("40")
  const [spacerShowDivider, setSpacerShowDivider] = useState(false)
  const [spacerDividerThickness, setSpacerDividerThickness] = useState("1")
  const [spacerDividerWidth, setSpacerDividerWidth] = useState("100")
  const [spacerDividerStyle, setSpacerDividerStyle] = useState("solid")
  const [spacerDividerColor, setSpacerDividerColor] = useState("#D9D9D9")
  const [spacerBackground, setSpacerBackground] = useState("#FFFFFF")
  const [spacerWidth, setSpacerWidth] = useState("full")
  const [spacerTopSpacing, setSpacerTopSpacing] = useState("0")
  const [spacerBottomSpacing, setSpacerBottomSpacing] = useState("0")
  const [spacerDesktopVisible, setSpacerDesktopVisible] = useState(true)
  const [spacerMobileVisible, setSpacerMobileVisible] = useState(true)

  // Editorial Text
  const [editorialTextEyebrow, setEditorialTextEyebrow] = useState("")
  const [editorialTextHeading, setEditorialTextHeading] = useState("")
  const [editorialTextBody, setEditorialTextBody] = useState("")
  const [editorialTextQuote, setEditorialTextQuote] = useState("")
  const [editorialTextButtonText, setEditorialTextButtonText] = useState("")
  const [editorialTextButtonUrl, setEditorialTextButtonUrl] = useState("")
  const [editorialTextAlign, setEditorialTextAlign] = useState("center")
  const [editorialTextWidth, setEditorialTextWidth] = useState("contained")
  const [editorialTextMaxWidth, setEditorialTextMaxWidth] = useState("900")
  const [editorialTextBackground, setEditorialTextBackground] = useState("#FFFFFF")
  const [editorialTextMainColor, setEditorialTextMainColor] = useState("#111111")
  const [editorialTextAccentColor, setEditorialTextAccentColor] = useState("#9A7446")
  const [editorialTextHeadingFont, setEditorialTextHeadingFont] = useState("Georgia, serif")
  const [editorialTextBodyFont, setEditorialTextBodyFont] = useState("Arial, sans-serif")
  const [editorialTextHeadingSize, setEditorialTextHeadingSize] = useState("52")
  const [editorialTextMobileHeadingSize, setEditorialTextMobileHeadingSize] = useState("34")
  const [editorialTextBodySize, setEditorialTextBodySize] = useState("17")
  const [editorialTextQuoteSize, setEditorialTextQuoteSize] = useState("28")
  const [editorialTextHeadingWeight, setEditorialTextHeadingWeight] = useState("500")
  const [editorialTextButtonStyle, setEditorialTextButtonStyle] = useState("underline")
  const [editorialTextButtonBg, setEditorialTextButtonBg] = useState("#111111")
  const [editorialTextButtonColor, setEditorialTextButtonColor] = useState("#111111")
  const [editorialTextButtonBorder, setEditorialTextButtonBorder] = useState("#111111")
  const [editorialTextTopSpacing, setEditorialTextTopSpacing] = useState("72")
  const [editorialTextBottomSpacing, setEditorialTextBottomSpacing] = useState("72")
  const [editorialTextDesktopVisible, setEditorialTextDesktopVisible] = useState(true)
  const [editorialTextMobileVisible, setEditorialTextMobileVisible] = useState(true)

  // Video Story
  const [videoStoryVideoUrl, setVideoStoryVideoUrl] = useState("")
  const [videoStoryPosterUrl, setVideoStoryPosterUrl] = useState("")
  const [videoStoryHeading, setVideoStoryHeading] = useState("")
  const [videoStorySubtitle, setVideoStorySubtitle] = useState("")
  const [videoStoryButtonText, setVideoStoryButtonText] = useState("Discover")
  const [videoStoryButtonUrl, setVideoStoryButtonUrl] = useState("")
  const [videoStoryAutoplay, setVideoStoryAutoplay] = useState(true)
  const [videoStoryMuted, setVideoStoryMuted] = useState(true)
  const [videoStoryLoop, setVideoStoryLoop] = useState(true)
  const [videoStoryControls, setVideoStoryControls] = useState(false)
  const [videoStoryObjectPosition, setVideoStoryObjectPosition] = useState("center")
  const [videoStoryWidth, setVideoStoryWidth] = useState("full")
  const [videoStoryDesktopHeight, setVideoStoryDesktopHeight] = useState("760")
  const [videoStoryMobileHeight, setVideoStoryMobileHeight] = useState("600")
  const [videoStoryContentAlign, setVideoStoryContentAlign] = useState("center")
  const [videoStoryContentVertical, setVideoStoryContentVertical] = useState("center")
  const [videoStoryOverlayColor, setVideoStoryOverlayColor] = useState("#000000")
  const [videoStoryOverlayOpacity, setVideoStoryOverlayOpacity] = useState("25")
  const [videoStoryTextColor, setVideoStoryTextColor] = useState("#FFFFFF")
  const [videoStoryHeadingFont, setVideoStoryHeadingFont] = useState("Georgia, serif")
  const [videoStoryHeadingSize, setVideoStoryHeadingSize] = useState("60")
  const [videoStoryMobileHeadingSize, setVideoStoryMobileHeadingSize] = useState("38")
  const [videoStoryBodyFont, setVideoStoryBodyFont] = useState("Arial, sans-serif")
  const [videoStorySubtitleSize, setVideoStorySubtitleSize] = useState("16")
  const [videoStoryButtonStyle, setVideoStoryButtonStyle] = useState("outline")
  const [videoStoryButtonBg, setVideoStoryButtonBg] = useState("#FFFFFF")
  const [videoStoryButtonColor, setVideoStoryButtonColor] = useState("#FFFFFF")
  const [videoStoryButtonBorder, setVideoStoryButtonBorder] = useState("#FFFFFF")
  const [videoStoryTopSpacing, setVideoStoryTopSpacing] = useState("48")
  const [videoStoryBottomSpacing, setVideoStoryBottomSpacing] = useState("48")
  const [videoStoryDesktopVisible, setVideoStoryDesktopVisible] = useState(true)
  const [videoStoryMobileVisible, setVideoStoryMobileVisible] = useState(true)
  const [uploadingVideoStory, setUploadingVideoStory] = useState<"video" | "poster" | null>(null)

  // Marquee
  const [marqueeItems, setMarqueeItems] = useState<string[]>([
    "New Arrivals",
    "Worldwide Shipping",
    "Discover The Collection",
  ])
  const [marqueeSpeed, setMarqueeSpeed] = useState("28")
  const [marqueeDirection, setMarqueeDirection] = useState("left")
  const [marqueePauseOnHover, setMarqueePauseOnHover] = useState(true)
  const [marqueeSeparator, setMarqueeSeparator] = useState("✦")
  const [marqueeFont, setMarqueeFont] = useState("Arial, sans-serif")
  const [marqueeFontSize, setMarqueeFontSize] = useState("18")
  const [marqueeMobileFontSize, setMarqueeMobileFontSize] = useState("14")
  const [marqueeFontWeight, setMarqueeFontWeight] = useState("500")
  const [marqueeLetterSpacing, setMarqueeLetterSpacing] = useState("2")
  const [marqueeTextTransform, setMarqueeTextTransform] = useState("uppercase")
  const [marqueeBackground, setMarqueeBackground] = useState("#111111")
  const [marqueeTextColor, setMarqueeTextColor] = useState("#FFFFFF")
  const [marqueeSeparatorColor, setMarqueeSeparatorColor] = useState("#FFFFFF")
  const [marqueePaddingY, setMarqueePaddingY] = useState("16")
  const [marqueeItemGap, setMarqueeItemGap] = useState("36")
  const [marqueeTopSpacing, setMarqueeTopSpacing] = useState("0")
  const [marqueeBottomSpacing, setMarqueeBottomSpacing] = useState("0")
  const [marqueeDesktopVisible, setMarqueeDesktopVisible] = useState(true)
  const [marqueeMobileVisible, setMarqueeMobileVisible] = useState(true)

  // Category Showcase
  const [categoryItems, setCategoryItems] = useState<CategoryShowcaseItemDraft[]>([
    createCategoryItem(),
    createCategoryItem(),
    createCategoryItem(),
    createCategoryItem(),
  ])
  const [categoryDesktopColumns, setCategoryDesktopColumns] = useState("4")
  const [categoryImageRatio, setCategoryImageRatio] = useState("portrait")
  const [categoryWidth, setCategoryWidth] = useState("full")
  const [categoryGap, setCategoryGap] = useState("16")
  const [categoryBackground, setCategoryBackground] = useState("#F8F4EC")
  const [categoryTopSpacing, setCategoryTopSpacing] = useState("48")
  const [categoryBottomSpacing, setCategoryBottomSpacing] = useState("48")
  const [categoryOverlayOpacity, setCategoryOverlayOpacity] = useState("0")
  const [categoryTextPosition, setCategoryTextPosition] = useState("bottom-left")
  const [categoryTextColor, setCategoryTextColor] = useState("#2A211C")
  const [categoryTitleSize, setCategoryTitleSize] = useState("28")
  const [categorySubtitleSize, setCategorySubtitleSize] = useState("14")
  const [categoryButtonBg, setCategoryButtonBg] = useState("#2A211C")
  const [categoryButtonColor, setCategoryButtonColor] = useState("#FFFFFF")
  const [categoryButtonBorder, setCategoryButtonBorder] = useState("#2A211C")
  const [categoryDesktopVisible, setCategoryDesktopVisible] = useState(true)
  const [categoryMobileVisible, setCategoryMobileVisible] = useState(true)
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null)

  // Featured Story
  const [featuredLayout, setFeaturedLayout] = useState("overlay")
  const [featuredMediaType, setFeaturedMediaType] = useState("image")
  const [featuredMediaUrl, setFeaturedMediaUrl] = useState("")
  const [featuredMediaAlt, setFeaturedMediaAlt] = useState("")
  const [featuredObjectPosition, setFeaturedObjectPosition] = useState("center")
  const [featuredWidth, setFeaturedWidth] = useState("full")
  const [featuredDesktopHeight, setFeaturedDesktopHeight] = useState("720")
  const [featuredMobileHeight, setFeaturedMobileHeight] = useState("560")
  const [featuredEyebrow, setFeaturedEyebrow] = useState("")
  const [featuredHeading, setFeaturedHeading] = useState("")
  const [featuredBody, setFeaturedBody] = useState("")
  const [featuredButtonText, setFeaturedButtonText] = useState("Discover")
  const [featuredButtonUrl, setFeaturedButtonUrl] = useState("")
  const [featuredContentAlign, setFeaturedContentAlign] = useState("left")
  const [featuredContentVertical, setFeaturedContentVertical] = useState("center")
  const [featuredContentSide, setFeaturedContentSide] = useState("right")
  const [featuredContentMaxWidth, setFeaturedContentMaxWidth] = useState("620")
  const [featuredContentPadding, setFeaturedContentPadding] = useState("56")
  const [featuredOverlayColor, setFeaturedOverlayColor] = useState("#000000")
  const [featuredOverlayOpacity, setFeaturedOverlayOpacity] = useState("28")
  const [featuredPanelBackground, setFeaturedPanelBackground] = useState("#F4F0EA")
  const [featuredTextColor, setFeaturedTextColor] = useState("#FFFFFF")
  const [featuredEyebrowColor, setFeaturedEyebrowColor] = useState("#FFFFFF")
  const [featuredHeadingFont, setFeaturedHeadingFont] = useState("Georgia, serif")
  const [featuredHeadingSize, setFeaturedHeadingSize] = useState("58")
  const [featuredHeadingMobileSize, setFeaturedHeadingMobileSize] = useState("36")
  const [featuredHeadingWeight, setFeaturedHeadingWeight] = useState("500")
  const [featuredBodyFont, setFeaturedBodyFont] = useState("Arial, sans-serif")
  const [featuredBodySize, setFeaturedBodySize] = useState("16")
  const [featuredButtonFont, setFeaturedButtonFont] = useState("Arial, sans-serif")
  const [featuredButtonStyle, setFeaturedButtonStyle] = useState("filled")
  const [featuredButtonBg, setFeaturedButtonBg] = useState("#FFFFFF")
  const [featuredButtonColor, setFeaturedButtonColor] = useState("#111111")
  const [featuredButtonBorder, setFeaturedButtonBorder] = useState("#FFFFFF")
  const [featuredButtonRadius, setFeaturedButtonRadius] = useState("0")
  const [featuredButtonSize, setFeaturedButtonSize] = useState("12")
  const [featuredButtonPaddingX, setFeaturedButtonPaddingX] = useState("24")
  const [featuredButtonPaddingY, setFeaturedButtonPaddingY] = useState("14")
  const [featuredTopSpacing, setFeaturedTopSpacing] = useState("48")
  const [featuredBottomSpacing, setFeaturedBottomSpacing] = useState("48")
  const [featuredDesktopVisible, setFeaturedDesktopVisible] = useState(true)
  const [featuredMobileVisible, setFeaturedMobileVisible] = useState(true)
  const [uploadingFeaturedMedia, setUploadingFeaturedMedia] = useState(false)

  // Campaign Banner
  const [campaignMediaType, setCampaignMediaType] = useState("image")
  const [campaignMediaUrl, setCampaignMediaUrl] = useState("")
  const [campaignMediaAlt, setCampaignMediaAlt] = useState("")
  const [campaignObjectPosition, setCampaignObjectPosition] = useState("center")

  // Campaign Studio — precise crop / focal controls.
  const [campaignMediaFit, setCampaignMediaFit] = useState("cover")
  const [campaignFocalX, setCampaignFocalX] = useState("50")
  const [campaignFocalY, setCampaignFocalY] = useState("50")
  const [campaignMediaZoom, setCampaignMediaZoom] = useState("1")
  const [campaignMediaBackground, setCampaignMediaBackground] = useState("#F8F4EC")

  const [campaignMobileMediaType, setCampaignMobileMediaType] = useState("image")
  const [campaignMobileMediaUrl, setCampaignMobileMediaUrl] = useState("")
  const [campaignMobileHeight, setCampaignMobileHeight] = useState("500")
  const [uploadingCampaignMobileMedia, setUploadingCampaignMobileMedia] = useState(false)

  /*
   * Campaign Banner keeps the proportional master on desktop/tablet.
   * Mobile can switch to optional artwork + a taller frame.
   */
  const [campaignHeight, setCampaignHeight] = useState("620")
  const [campaignWidth, setCampaignWidth] = useState("full")
  const [campaignEyebrow, setCampaignEyebrow] = useState("")
  const [campaignHeading, setCampaignHeading] = useState("")
  const [campaignBody, setCampaignBody] = useState("")
  const [campaignPrimaryText, setCampaignPrimaryText] = useState("Shop Now")
  const [campaignPrimaryUrl, setCampaignPrimaryUrl] = useState("")
  const [campaignSecondaryText, setCampaignSecondaryText] = useState("")
  const [campaignSecondaryUrl, setCampaignSecondaryUrl] = useState("")
  const [campaignContentAlign, setCampaignContentAlign] = useState("center")

  /*
   * Content Position and Text Alignment are intentionally separate.
   *
   * Example:
   * content position = right
   * text alignment = center
   *
   * This lets the editorial block sit on the right side while the
   * heading/body/buttons remain centered inside that block.
   */
  const [campaignTextAlign, setCampaignTextAlign] = useState("center")

  const [campaignContentVertical, setCampaignContentVertical] = useState("center")
  const [campaignContentPadding, setCampaignContentPadding] = useState("40")
  const [campaignContentMaxWidth, setCampaignContentMaxWidth] = useState("560")

  // Editorial typography / divider controls.
  const [campaignHeadingLineHeight, setCampaignHeadingLineHeight] = useState("0.98")
  const [campaignHeadingLetterSpacing, setCampaignHeadingLetterSpacing] = useState("-0.03")
  const [campaignBodyLineHeight, setCampaignBodyLineHeight] = useState("1.55")
  const [campaignDividerEnabled, setCampaignDividerEnabled] = useState(true)
  const [campaignDividerWidth, setCampaignDividerWidth] = useState("88")
  const [campaignDividerThickness, setCampaignDividerThickness] = useState("2")
  const [campaignDividerColor, setCampaignDividerColor] = useState("#A97838")

  const [campaignOverlayColor, setCampaignOverlayColor] = useState("#000000")
  const [campaignOverlayOpacity, setCampaignOverlayOpacity] = useState("28")
  const [campaignTextColor, setCampaignTextColor] = useState("#FFFFFF")
  const [campaignEyebrowColor, setCampaignEyebrowColor] = useState("#FFFFFF")
  const [campaignHeadingFont, setCampaignHeadingFont] = useState("Georgia, serif")
  const [campaignHeadingSize, setCampaignHeadingSize] = useState("64")
  const [campaignHeadingWeight, setCampaignHeadingWeight] = useState("500")
  const [campaignBodyFont, setCampaignBodyFont] = useState("Arial, sans-serif")
  const [campaignBodySize, setCampaignBodySize] = useState("16")
  const [campaignButtonFont, setCampaignButtonFont] = useState("Arial, sans-serif")
  const [campaignPrimaryStyle, setCampaignPrimaryStyle] = useState("filled")
  const [campaignPrimaryBg, setCampaignPrimaryBg] = useState("#FFFFFF")
  const [campaignPrimaryColor, setCampaignPrimaryColor] = useState("#111111")
  const [campaignPrimaryBorder, setCampaignPrimaryBorder] = useState("#FFFFFF")
  const [campaignSecondaryStyle, setCampaignSecondaryStyle] = useState("outline")
  const [campaignSecondaryColor, setCampaignSecondaryColor] = useState("#FFFFFF")
  const [campaignSecondaryBorder, setCampaignSecondaryBorder] = useState("#FFFFFF")
  const [campaignButtonRadius, setCampaignButtonRadius] = useState("0")
  const [campaignButtonSize, setCampaignButtonSize] = useState("12")
  const [campaignButtonPaddingX, setCampaignButtonPaddingX] = useState("24")
  const [campaignButtonPaddingY, setCampaignButtonPaddingY] = useState("14")
  const [campaignTopSpacing, setCampaignTopSpacing] = useState("0")
  const [campaignBottomSpacing, setCampaignBottomSpacing] = useState("0")
  const [campaignDesktopVisible, setCampaignDesktopVisible] = useState(true)
  const [campaignMobileVisible, setCampaignMobileVisible] = useState(true)
  const [uploadingCampaignMedia, setUploadingCampaignMedia] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [isDraggingPreview, setIsDraggingPreview] = useState(false)
  const previewDragOffsetRef = useRef({ x: 0, y: 0 })
  const showcasePreviewRailRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("homepage-editorial-colors")
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setEditorialCustomColors(
          parsed.filter((item) => typeof item === "string")
        )
      }
    } catch {}
  }, [])

  const saveEditorialColor = (color: string) => {
    const normalized = color.trim().toUpperCase()
    if (!/^#[0-9A-F]{6}$/.test(normalized)) {
      alert("Use a valid HEX color, for example #C9A268.")
      return
    }
    setEditorialCustomColors((current) => {
      if (current.includes(normalized)) return current
      const next = [...current, normalized]
      window.localStorage.setItem("homepage-editorial-colors", JSON.stringify(next))
      return next
    })
  }

  const removeEditorialColor = (color: string) => {
    setEditorialCustomColors((current) => {
      const next = current.filter((item) => item !== color)
      window.localStorage.setItem("homepage-editorial-colors", JSON.stringify(next))
      return next
    })
  }

  const uploadEditorialImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return
    try {
      setUploadingEditorialImage(true)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]
      if (!uploaded?.url) throw new Error("Upload did not return a file URL")
      setEditorialImageUrl(uploaded.url)
    } catch (error) {
      console.error("Failed to upload editorial image:", error)
      alert("Editorial image could not be uploaded.")
    } finally {
      setUploadingEditorialImage(false)
    }
  }


  const updateMosaicItem = (index: number, patch: Partial<ImageMosaicItemDraft>) => {
    setMosaicItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  const addMosaicItem = () => {
    setMosaicItems((current) => [...current, createEmptyMosaicItem()])
  }

  const removeMosaicItem = (index: number) => {
    setMosaicItems((current) =>
      current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const moveMosaicItem = (index: number, direction: "up" | "down") => {
    setMosaicItems((current) => {
      const target = direction === "up" ? index - 1 : index + 1
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const uploadMosaicImage = async (index: number, file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      if (file) alert("Please upload an image file.")
      return
    }

    try {
      setUploadingMosaicIndex(index)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]
      if (!uploaded?.url) throw new Error("Upload did not return a file URL")
      updateMosaicItem(index, { image_url: uploaded.url })
    } catch (error) {
      console.error("Failed to upload mosaic image:", error)
      alert("Mosaic image could not be uploaded.")
    } finally {
      setUploadingMosaicIndex(null)
    }
  }

  const uploadShopImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      if (file) alert("Please upload an image file.")
      return
    }

    try {
      setUploadingShopImage(true)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]
      if (!uploaded?.url) throw new Error("Upload did not return a file URL")
      setShopImageUrl(uploaded.url)
    } catch (error) {
      console.error("Failed to upload Shop the Look image:", error)
      alert("Shop the Look image could not be uploaded.")
    } finally {
      setUploadingShopImage(false)
    }
  }

  const updateShopHotspot = (
    id: string,
    patch: Partial<ShopTheLookHotspotDraft>
  ) => {
    setShopHotspots((current) =>
      current.map((item) => item.id === id ? { ...item, ...patch } : item)
    )
  }

  const removeShopHotspot = (id: string) => {
    setShopHotspots((current) => current.filter((item) => item.id !== id))
  }

  const addShopHotspot = (x = 50, y = 50) => {
    setShopHotspots((current) => [...current, createEmptyShopHotspot(x, y)])
  }

  const searchShopProducts = async () => {
    const q = shopProductQuery.trim()
    if (!q) {
      setShopProductResults([])
      return
    }

    try {
      setShopProductsLoading(true)
      const response = await sdk.admin.product.list({
        q,
        limit: 20,
        fields: "id,title,handle,thumbnail,+metadata,*options,*options.values,*variants.prices",
      } as any)
      setShopProductResults(
        (response.products || []) as unknown as AdminProduct[]
      )
    } catch (error) {
      console.error("Failed to search Shop the Look products:", error)
      setShopProductResults([])
    } finally {
      setShopProductsLoading(false)
    }
  }

  const formatShopProductPrice = (product: AdminProduct) => {
    const price = product.variants?.[0]?.prices?.[0]
    if (!price || typeof price.amount !== "number") return ""
    const currency = (price.currency_code || "").toUpperCase()
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
      }).format(price.amount)
    } catch {
      return `${price.amount} ${currency}`.trim()
    }
  }

  const assignProductToHotspot = (
    hotspotId: string,
    product: AdminProduct
  ) => {
    updateShopHotspot(hotspotId, {
      product_id: product.id,
      product_handle: product.handle || "",
      product_title: product.title,
      product_thumbnail: product.thumbnail || "",
      price_label: formatShopProductPrice(product),
      label: product.title,
    })
  }

  const uploadVideoStoryFile = async (
    kind: "video" | "poster",
    file?: File
  ) => {
    if (!file) return
    if (kind === "video" && !file.type.startsWith("video/")) {
      alert("Please upload a video file.")
      return
    }
    if (kind === "poster" && !file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }

    try {
      setUploadingVideoStory(kind)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]
      if (!uploaded?.url) throw new Error("Upload did not return a file URL")
      if (kind === "video") setVideoStoryVideoUrl(uploaded.url)
      else setVideoStoryPosterUrl(uploaded.url)
    } catch (error) {
      console.error("Failed to upload Video Story media:", error)
      alert("Video Story media could not be uploaded.")
    } finally {
      setUploadingVideoStory(null)
    }
  }

  const updateCategoryItem = (
    id: string,
    patch: Partial<CategoryShowcaseItemDraft>
  ) => {
    setCategoryItems((current) =>
      current.map((item) => item.id === id ? { ...item, ...patch } : item)
    )
  }

  const uploadCategoryImage = async (
    id: string,
    file?: File
  ) => {
    if (!file || !file.type.startsWith("image/")) {
      if (file) alert("Please upload an image file.")
      return
    }

    try {
      setUploadingCategoryId(id)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]
      if (!uploaded?.url) throw new Error("Upload did not return a file URL")
      updateCategoryItem(id, { image_url: uploaded.url })
    } catch (error) {
      console.error("Failed to upload category image:", error)
      alert("Category image could not be uploaded.")
    } finally {
      setUploadingCategoryId(null)
    }
  }

  const uploadFeaturedMedia = async (file?: File) => {
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      alert("Please upload an image or video file.")
      return
    }

    try {
      setUploadingFeaturedMedia(true)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]

      if (!uploaded?.url) {
        throw new Error("Upload did not return a file URL")
      }

      setFeaturedMediaType(isVideo ? "video" : "image")
      setFeaturedMediaUrl(uploaded.url)
    } catch (error) {
      console.error("Failed to upload Featured Story media:", error)
      alert("Featured Story media could not be uploaded.")
    } finally {
      setUploadingFeaturedMedia(false)
    }
  }

  const uploadCampaignMedia = async (file?: File) => {
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      alert("Please upload an image or video file.")
      return
    }

    try {
      setUploadingCampaignMedia(true)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]

      if (!uploaded?.url) {
        throw new Error("Upload did not return a file URL")
      }

      setCampaignMediaType(isVideo ? "video" : "image")
      setCampaignMediaUrl(uploaded.url)
    } catch (error) {
      console.error("Failed to upload campaign media:", error)
      alert("Campaign media could not be uploaded.")
    } finally {
      setUploadingCampaignMedia(false)
    }
  }

  const uploadCampaignMobileMedia = async (file?: File) => {
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      alert("Please upload an image or video file.")
      return
    }

    try {
      setUploadingCampaignMobileMedia(true)

      const response = await sdk.admin.upload.create({
        files: [file],
      })

      const uploaded = response.files?.[0]

      if (!uploaded?.url) {
        throw new Error("Upload did not return a file URL")
      }

      setCampaignMobileMediaType(
        isVideo ? "video" : "image"
      )
      setCampaignMobileMediaUrl(
        uploaded.url
      )
    } catch (error) {
      console.error(
        "Failed to upload campaign mobile media:",
        error
      )
      alert(
        "Campaign mobile media could not be uploaded."
      )
    } finally {
      setUploadingCampaignMobileMedia(false)
    }
  }

  const selectedType = useMemo(
    () => SECTION_TYPES.find((item) => item.value === type),
    [type]
  )

  const selectedCollection = useMemo(
    () =>
      collections.find(
        (collection) => collection.handle === showcaseCollection
      ),
    [collections, showcaseCollection]
  )

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => category.id === showcaseCategoryId
      ),
    [categories, showcaseCategoryId]
  )

  const getCategoryPath = (categoryId: string) => {
    const handles: string[] = []
    const visited = new Set<string>()
    let current = categories.find(
      (category) => category.id === categoryId
    )

    while (current && !visited.has(current.id)) {
      visited.add(current.id)

      if (current.handle) {
        handles.unshift(current.handle)
      }

      current = current.parent_category_id
        ? categories.find(
            (category) =>
              category.id === current?.parent_category_id
          )
        : undefined
    }

    return handles.join("/")
  }

  const getCategoryLabelPath = (categoryId: string) => {
    const names: string[] = []
    const visited = new Set<string>()
    let current = categories.find(
      (category) => category.id === categoryId
    )

    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      names.unshift(current.name || current.handle)

      current = current.parent_category_id
        ? categories.find(
            (category) =>
              category.id === current?.parent_category_id
          )
        : undefined
    }

    return names.join(" › ")
  }

  const getLegacyCategoryIdFromLink = (
    linkUrl: string
  ) => {
    if (!linkUrl.startsWith("/categories/")) {
      return ""
    }

    const finalHandle =
      linkUrl
        .replace(/^\/categories\//, "")
        .split("/")
        .filter(Boolean)
        .at(-1) || ""

    return (
      categories.find(
        (category) =>
          category.handle === finalHandle
      )?.id || ""
    )
  }

  const getLegacyCollectionHandleFromLink = (
    linkUrl: string
  ) => {
    if (!linkUrl.startsWith("/collections/")) {
      return ""
    }

    return (
      linkUrl
        .replace(/^\/collections\//, "")
        .split("/")
        .filter(Boolean)[0] || ""
    )
  }

  const setCategoryShowcaseDestinationType = (
    item: CategoryShowcaseItemDraft,
    destinationType: CategoryShowcaseDestinationType
  ) => {
    updateCategoryItem(item.id, {
      destination_type: destinationType,
      category_id:
        destinationType === "category"
          ? item.category_id ||
            getLegacyCategoryIdFromLink(item.link_url)
          : "",
      collection_handle:
        destinationType === "collection"
          ? item.collection_handle ||
            getLegacyCollectionHandleFromLink(item.link_url)
          : "",
    })
  }

  const setCategoryShowcaseCategory = (
    item: CategoryShowcaseItemDraft,
    categoryId: string
  ) => {
    const category =
      categories.find(
        (candidate) =>
          candidate.id === categoryId
      )

    if (!category) {
      updateCategoryItem(item.id, {
        category_id: "",
        link_url: "",
      })
      return
    }

    const path =
      getCategoryPath(category.id)

    updateCategoryItem(item.id, {
      destination_type: "category",
      category_id: category.id,
      collection_handle: "",
      link_url:
        path
          ? `/categories/${path}`
          : `/categories/${category.handle}`,
      title:
        item.title || category.name,
      image_alt:
        item.image_alt || category.name,
    })
  }

  const setCategoryShowcaseCollection = (
    item: CategoryShowcaseItemDraft,
    collectionHandle: string
  ) => {
    const collection =
      collections.find(
        (candidate) =>
          candidate.handle === collectionHandle
      )

    if (!collection) {
      updateCategoryItem(item.id, {
        collection_handle: "",
        link_url: "",
      })
      return
    }

    updateCategoryItem(item.id, {
      destination_type: "collection",
      category_id: "",
      collection_handle:
        collection.handle,
      link_url:
        `/collections/${collection.handle}`,
      title:
        item.title || collection.title,
      image_alt:
        item.image_alt || collection.title,
    })
  }

  useEffect(() => {
    if (!isDraggingPreview) return

    const handleMouseMove = (event: MouseEvent) => {
      const panelWidth = 430
      const padding = 12
      const visibleGrip = 72

      // Horizontal: keep enough of the panel visible so it can always
      // be grabbed again, but allow movement across the full viewport.
      const x = Math.min(
        Math.max(
          -(panelWidth - visibleGrip),
          event.clientX - previewDragOffsetRef.current.x
        ),
        window.innerWidth - visibleGrip
      )

      // Vertical: allow the preview header to travel almost all the way
      // to the bottom of the viewport instead of limiting movement by
      // the panel's full height.
      const y = Math.min(
        Math.max(
          padding,
          event.clientY - previewDragOffsetRef.current.y
        ),
        Math.max(padding, window.innerHeight - visibleGrip)
      )

      setPreviewPosition({ x, y })
    }

    const handleMouseUp = () => setIsDraggingPreview(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingPreview])

  const startPreviewDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const panel = event.currentTarget.closest(
      "[data-homepage-preview]"
    ) as HTMLElement | null

    if (!panel) return

    const rect = panel.getBoundingClientRect()

    previewDragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    setPreviewPosition({ x: rect.left, y: rect.top })
    setIsDraggingPreview(true)
  }

  const resetPreviewPosition = () => {
    setPreviewPosition({
      x: Math.max(12, window.innerWidth - 430 - 20),
      y: 96,
    })
  }

  const loadCollections = async () => {
    try {
      setCollectionsLoading(true)

      const response = await sdk.admin.productCollection.list({
        limit: 100,
      })

      setCollections(
        (response.collections || []).map((collection) => ({
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
        }))
      )
    } catch (error) {
      console.error("Failed to load collections:", error)
      setCollections([])
    } finally {
      setCollectionsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)

      const response = await sdk.client.fetch<{
        product_categories: AdminCategory[]
      }>("/admin/product-categories", {
        method: "GET",
        query: {
          limit: 200,
          fields: "id,name,handle,parent_category_id",
        },
      })

      setCategories(
        (response.product_categories || [])
          .filter((category) => Boolean(category?.id))
          .sort((a, b) =>
            (a.name || a.handle).localeCompare(
              b.name || b.handle
            )
          )
      )
    } catch (error) {
      console.error("Failed to load product categories:", error)
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const searchShowcaseProducts = async () => {
    const q = showcaseProductQuery.trim()

    if (!q) {
      setShowcaseProductResults([])
      return
    }

    try {
      setShowcaseProductSearchLoading(true)

      const response = await sdk.admin.product.list({
        q,
        limit: 20,
        fields: "id,title,handle,thumbnail,+metadata,*options,*options.values,*variants.prices",
      } as any)

      setShowcaseProductResults(
        (response.products || []) as unknown as AdminProduct[]
      )
    } catch (error) {
      console.error("Failed to search showcase products:", error)
      setShowcaseProductResults([])
    } finally {
      setShowcaseProductSearchLoading(false)
    }
  }

  const loadShowcaseManualProductsByIds = async (
    ids: string[]
  ) => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)))

    if (!uniqueIds.length) {
      setShowcaseManualProducts([])
      return
    }

    try {
      const response = await sdk.admin.product.list({
        id: uniqueIds,
        limit: Math.max(uniqueIds.length, 1),
        fields: "id,title,handle,thumbnail,*variants.prices",
      } as any)

      const products =
        (response.products || []) as unknown as AdminProduct[]

      const byId = new Map(
        products.map((product) => [product.id, product])
      )

      setShowcaseManualProducts(
        uniqueIds
          .map((id) => byId.get(id))
          .filter((product): product is AdminProduct => Boolean(product))
      )
    } catch (error) {
      console.error("Failed to load selected showcase products:", error)
      setShowcaseManualProducts([])
    }
  }

  const addShowcaseManualProduct = (product: AdminProduct) => {
    setShowcaseManualProducts((current) => {
      if (current.some((item) => item.id === product.id)) {
        return current
      }

      return [...current, product].slice(0, 16)
    })
  }

  const removeShowcaseManualProduct = (productId: string) => {
    setShowcaseManualProducts((current) =>
      current.filter((product) => product.id !== productId)
    )
  }

  const moveShowcaseManualProduct = (
    index: number,
    direction: "up" | "down"
  ) => {
    setShowcaseManualProducts((current) => {
      const target = direction === "up" ? index - 1 : index + 1

      if (target < 0 || target >= current.length) {
        return current
      }

      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const loadPreviewProducts = async () => {
    const limit = Math.max(
      1,
      Math.min(Number(showcaseProductCount) || 8, 16)
    )

    if (showcaseSource === "manual") {
      const manualIds =
        showcaseManualProducts
          .map((product) => product.id)
          .filter(Boolean)
          .slice(0, limit)

      if (!manualIds.length) {
        setPreviewProducts([])
        return
      }

      try {
        setProductsLoading(true)

        const response =
          await sdk.admin.product.list({
            id: manualIds,
            limit: manualIds.length,
            fields:
              "id,title,handle,thumbnail,+metadata,*options,*options.values,*variants.prices",
          } as any)

        const products =
          (response.products || []) as unknown as AdminProduct[]

        const byId = new Map(
          products.map((product) => [
            product.id,
            product,
          ])
        )

        setPreviewProducts(
          manualIds
            .map((id) => byId.get(id))
            .filter(
              (product): product is AdminProduct =>
                Boolean(product)
            )
        )
      } catch (error) {
        console.error(
          "Failed to load manual showcase preview products:",
          error
        )
        setPreviewProducts([])
      } finally {
        setProductsLoading(false)
      }

      return
    }

    if (
      showcaseSource === "collection" &&
      !selectedCollection?.id
    ) {
      setPreviewProducts([])
      return
    }

    if (
      showcaseSource === "category" &&
      !selectedCategory?.id
    ) {
      setPreviewProducts([])
      return
    }

    try {
      setProductsLoading(true)

      const query: Record<string, unknown> = {
        limit,
        fields: "id,title,handle,thumbnail,+metadata,*options,*options.values,*variants.prices",
      }

      if (
        showcaseSource === "collection" &&
        selectedCollection?.id
      ) {
        query.collection_id = [selectedCollection.id]
      }

      if (
        showcaseSource === "category" &&
        selectedCategory?.id
      ) {
        query.category_id = [selectedCategory.id]
      }

      if (showcaseSource === "new_arrivals") {
        query.order = "-created_at"
      }

      const response = await sdk.admin.product.list(query as any)

      setPreviewProducts(
        (response.products || []) as unknown as AdminProduct[]
      )
    } catch (error) {
      console.error("Failed to load showcase preview products:", error)
      setPreviewProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const getPreviewPrimaryImage = (
    product: AdminProduct
  ) => {
    const configured =
      product.metadata
        ?.showcase_primary_image_url

    return typeof configured ===
      "string" &&
      configured.trim()
      ? configured.trim()
      : product.thumbnail || ""
  }

  const getPreviewColors = (
    product: AdminProduct
  ) => {
    const option =
      product.options?.find(
        (item) => {
          const title =
            item.title
              ?.trim()
              .toLowerCase()

          return (
            title === "color" ||
            title === "colour" ||
            title === "colors" ||
            title === "colours"
          )
        }
      )

    return Array.from(
      new Set(
        (option?.values || [])
          .map((value) =>
            String(
              value.value || ""
            ).trim()
          )
          .filter(Boolean)
      )
    )
  }

  const getPreviewSwatch = (
    product: AdminProduct,
    color: string
  ) => {
    const raw =
      product.metadata
        ?.showcase_color_swatches

    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return null
    }

    const entry =
      Object.entries(
        raw as Record<
          string,
          unknown
        >
      ).find(
        ([key]) =>
          key
            .trim()
            .toLowerCase() ===
          color
            .trim()
            .toLowerCase()
      )?.[1]

    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry)
    ) {
      return null
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
      return null
    }

    return {
      imageUrl,
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

  const moveShowcasePreview = (
    direction: "left" | "right"
  ) => {
    const rail =
      showcasePreviewRailRef.current

    if (!rail) {
      return
    }

    const firstSlide =
      rail.querySelector<HTMLElement>(
        "[data-showcase-preview-slide]"
      )

    const styles =
      window.getComputedStyle(rail)

    const gap =
      Number.parseFloat(
        styles.columnGap ||
          styles.gap ||
          "0"
      ) || 0

    const step =
      (firstSlide?.offsetWidth ||
        rail.clientWidth) +
      gap

    rail.scrollBy({
      left:
        direction === "right"
          ? step
          : -step,
      behavior: "smooth",
    })
  }

  const loadSections = async () => {
    try {
      setLoading(true)
      const response = await sdk.client.fetch<{
        homepage_sections: HomepageSection[]
      }>("/admin/homepage-sections", { method: "GET" })

      setSections(response.homepage_sections || [])
    } catch (error) {
      console.error("Failed to load homepage sections:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSections()
    loadCollections()
    loadCategories()
  }, [])

  useEffect(() => {
    if (type !== "product_showcase") {
      return
    }

    loadPreviewProducts()
  }, [
    type,
    showcaseSource,
    selectedCollection?.id,
    selectedCategory?.id,
    showcaseProductCount,
    showcaseManualProducts,
  ])

  const updateCollectionCard = (
    index: number,
    patch: Partial<CollectionCardDraft>
  ) => {
    setCollectionCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card
      )
    )
  }

  const addCollectionCard = () => {
    setCollectionCards((current) => [
      ...current,
      createEmptyCollectionCard(),
    ])
  }

  const removeCollectionCard = (index: number) => {
    setCollectionCards((current) =>
      current.length <= 1
        ? current
        : current.filter((_, cardIndex) => cardIndex !== index)
    )
  }

  const uploadCollectionCardImage = async (
    index: number,
    file?: File
  ) => {
    if (!file) return

    try {
      setUploadingCollectionCardIndex(index)
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = response.files?.[0]

      if (!uploaded?.url) {
        throw new Error("Upload did not return a file URL")
      }

      updateCollectionCard(index, { image_url: uploaded.url })
    } catch (error) {
      console.error("Failed to upload collection card image:", error)
      alert("Collection card image could not be uploaded.")
    } finally {
      setUploadingCollectionCardIndex(null)
    }
  }


  const handleCollectionCardDrop = (
    index: number,
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault()

    if (uploadingCollectionCardIndex !== null) {
      return
    }

    const file =
      Array.from(event.dataTransfer.files).find(
        (item) =>
          item.type.startsWith("image/")
      )

    if (!file) {
      alert("Please drop an image file.")
      return
    }

    uploadCollectionCardImage(index, file)
  }

  const resetForm = () => {
    setEditingId(null)
    setEditorOpen(false)
    setPreviewOpen(false)
    setType("product_showcase")
    setTitle("")
    setPosition("0")
    setIsActive(true)

    setShowcaseSource("collection")
    setShowcaseCollection("")
    setShowcaseCategoryId("")
    setShowcaseManualProducts([])
    setShowcaseProductQuery("")
    setShowcaseProductResults([])
    setShowcaseSubtitle("")
    setShowcaseLayout("grid")
    setShowcaseDesktopColumns("4")
    setShowcaseProductCount("8")
    setShowcaseImageRatio("portrait")
    setShowcaseWidth("contained")
    setShowcaseTopSpacing("48")
    setShowcaseBottomSpacing("48")
    setShowcaseBackground("#FFFFFF")
    setShowcaseShowPrice(true)
    setShowcaseShowBadge(true)
    setShowcaseShowSwatches(true)
    setShowcaseShowQuickAdd(false)
    setShowcaseDesktopVisible(true)
    setShowcaseMobileVisible(true)

    setCollectionCards([
      createEmptyCollectionCard(),
      createEmptyCollectionCard(),
      createEmptyCollectionCard(),
      createEmptyCollectionCard(),
    ])
    setCollectionCardsDesktopColumns("4")
    setCollectionCardsMobileColumns("2")
    setCollectionCardsImageRatio("portrait")
    setCollectionCardsWidth("full")
    setCollectionCardsTopSpacing("48")
    setCollectionCardsBottomSpacing("48")
    setCollectionCardsGap("16")
    setCollectionCardsBackground("#FFFFFF")
    setCollectionCardsTextPosition("bottom-center")
    setCollectionCardsOverlayOpacity("12")
    setCollectionCardsTitleColor("#FFFFFF")
    setCollectionCardsTitleSize("30")
    setCollectionCardsTitleMobileSize("20")
    setCollectionCardsTitleWeight("500")
    setCollectionCardsSubtitleColor("#FFFFFF")
    setCollectionCardsSubtitleSize("14")
    setCollectionCardsButtonStyle("filled")
    setCollectionCardsButtonBgColor("#FFFFFF")
    setCollectionCardsButtonTextColor("#111111")
    setCollectionCardsButtonBorderColor("#FFFFFF")
    setCollectionCardsButtonSize("12")
    setCollectionCardsButtonRadius("0")
    setCollectionCardsButtonPaddingX("18")
    setCollectionCardsButtonPaddingY("10")
    setCollectionCardsDesktopVisible(true)
    setCollectionCardsMobileVisible(true)

    setEditorialLayout("image-left")
    setEditorialWidth("full")
    setEditorialMinHeight("620")
    setEditorialImageUrl("")
    setEditorialImageAlt("")
    setEditorialImageFit("cover")
    setEditorialImagePosition("center")
    setEditorialEyebrow("")
    setEditorialHeading("")
    setEditorialBody("")
    setEditorialButtonText("Shop Now")
    setEditorialButtonUrl("")
    setEditorialContentAlign("left")
    setEditorialContentVertical("center")
    setEditorialContentPadding("64")
    setEditorialBackground("#F7F4EF")
    setEditorialTextColor("#111111")
    setEditorialEyebrowColor("#B48A52")
    setEditorialHeadingFont("Georgia, serif")
    setEditorialHeadingSize("52")
    setEditorialHeadingMobileSize("34")
    setEditorialHeadingWeight("500")
    setEditorialBodyFont("Arial, sans-serif")
    setEditorialBodySize("16")
    setEditorialButtonFont("Arial, sans-serif")
    setEditorialButtonStyle("filled")
    setEditorialButtonBg("#111111")
    setEditorialButtonColor("#FFFFFF")
    setEditorialButtonBorder("#111111")
    setEditorialButtonRadius("0")
    setEditorialButtonSize("12")
    setEditorialButtonPaddingX("24")
    setEditorialButtonPaddingY("14")
    setEditorialTopSpacing("0")
    setEditorialBottomSpacing("0")
    setEditorialMobileOrder("image-first")
    setEditorialDesktopVisible(true)
    setEditorialMobileVisible(true)

    setMosaicItems([
      { ...createEmptyMosaicItem(), size: "large" },
      createEmptyMosaicItem(),
      { ...createEmptyMosaicItem(), size: "tall" },
      { ...createEmptyMosaicItem(), size: "wide" },
    ])
    setMosaicWidth("full")
    setMosaicDesktopColumns("4")
    setMosaicMobileColumns("2")
    setMosaicRowHeight("240")
    setMosaicMobileRowHeight("180")
    setMosaicGap("12")
    setMosaicBackground("#FFFFFF")
    setMosaicTopSpacing("48")
    setMosaicBottomSpacing("48")
    setMosaicDesktopVisible(true)
    setMosaicMobileVisible(true)

    setShopImageUrl("")
    setShopImageAlt("")
    setShopImagePosition("center")
    setShopWidth("full")
    setShopDesktopHeight("760")
    setShopMobileHeight("560")
    setShopBackground("#FFFFFF")
    setShopTopSpacing("48")
    setShopBottomSpacing("48")
    setShopDesktopVisible(true)
    setShopMobileVisible(true)
    setShopShowProductCard(true)
    setShopHotspotColor("#FFFFFF")
    setShopHotspotRingColor("#111111")
    setShopHotspotSize("22")
    setShopHotspots([])
    setShopProductQuery("")
    setShopProductResults([])

    setSpacerHeight("64")
    setSpacerMobileHeight("40")
    setSpacerShowDivider(false)
    setSpacerDividerThickness("1")
    setSpacerDividerWidth("100")
    setSpacerDividerStyle("solid")
    setSpacerDividerColor("#D9D9D9")
    setSpacerBackground("#FFFFFF")
    setSpacerWidth("full")
    setSpacerTopSpacing("0")
    setSpacerBottomSpacing("0")
    setSpacerDesktopVisible(true)
    setSpacerMobileVisible(true)

    setEditorialTextEyebrow("")
    setEditorialTextHeading("")
    setEditorialTextBody("")
    setEditorialTextQuote("")
    setEditorialTextButtonText("")
    setEditorialTextButtonUrl("")
    setEditorialTextAlign("center")
    setEditorialTextWidth("contained")
    setEditorialTextMaxWidth("900")
    setEditorialTextBackground("#FFFFFF")
    setEditorialTextMainColor("#111111")
    setEditorialTextAccentColor("#9A7446")
    setEditorialTextHeadingFont("Georgia, serif")
    setEditorialTextBodyFont("Arial, sans-serif")
    setEditorialTextHeadingSize("52")
    setEditorialTextMobileHeadingSize("34")
    setEditorialTextBodySize("17")
    setEditorialTextQuoteSize("28")
    setEditorialTextHeadingWeight("500")
    setEditorialTextButtonStyle("underline")
    setEditorialTextButtonBg("#111111")
    setEditorialTextButtonColor("#111111")
    setEditorialTextButtonBorder("#111111")
    setEditorialTextTopSpacing("72")
    setEditorialTextBottomSpacing("72")
    setEditorialTextDesktopVisible(true)
    setEditorialTextMobileVisible(true)

    setVideoStoryVideoUrl("")
    setVideoStoryPosterUrl("")
    setVideoStoryHeading("")
    setVideoStorySubtitle("")
    setVideoStoryButtonText("Discover")
    setVideoStoryButtonUrl("")
    setVideoStoryAutoplay(true)
    setVideoStoryMuted(true)
    setVideoStoryLoop(true)
    setVideoStoryControls(false)
    setVideoStoryObjectPosition("center")
    setVideoStoryWidth("full")
    setVideoStoryDesktopHeight("760")
    setVideoStoryMobileHeight("600")
    setVideoStoryContentAlign("center")
    setVideoStoryContentVertical("center")
    setVideoStoryOverlayColor("#000000")
    setVideoStoryOverlayOpacity("25")
    setVideoStoryTextColor("#FFFFFF")
    setVideoStoryHeadingFont("Georgia, serif")
    setVideoStoryHeadingSize("60")
    setVideoStoryMobileHeadingSize("38")
    setVideoStoryBodyFont("Arial, sans-serif")
    setVideoStorySubtitleSize("16")
    setVideoStoryButtonStyle("outline")
    setVideoStoryButtonBg("#FFFFFF")
    setVideoStoryButtonColor("#FFFFFF")
    setVideoStoryButtonBorder("#FFFFFF")
    setVideoStoryTopSpacing("48")
    setVideoStoryBottomSpacing("48")
    setVideoStoryDesktopVisible(true)
    setVideoStoryMobileVisible(true)

    setMarqueeItems([
      "New Arrivals",
      "Worldwide Shipping",
      "Discover The Collection",
    ])
    setMarqueeSpeed("28")
    setMarqueeDirection("left")
    setMarqueePauseOnHover(true)
    setMarqueeSeparator("✦")
    setMarqueeFont("Arial, sans-serif")
    setMarqueeFontSize("18")
    setMarqueeMobileFontSize("14")
    setMarqueeFontWeight("500")
    setMarqueeLetterSpacing("2")
    setMarqueeTextTransform("uppercase")
    setMarqueeBackground("#111111")
    setMarqueeTextColor("#FFFFFF")
    setMarqueeSeparatorColor("#FFFFFF")
    setMarqueePaddingY("16")
    setMarqueeItemGap("36")
    setMarqueeTopSpacing("0")
    setMarqueeBottomSpacing("0")
    setMarqueeDesktopVisible(true)
    setMarqueeMobileVisible(true)

    setCategoryItems([
      createCategoryItem(),
      createCategoryItem(),
      createCategoryItem(),
      createCategoryItem(),
    ])
    setCategoryDesktopColumns("4")
    setCategoryImageRatio("portrait")
    setCategoryWidth("full")
    setCategoryGap("16")
    setCategoryBackground("#FFFFFF")
    setCategoryTopSpacing("48")
    setCategoryBottomSpacing("48")
    setCategoryOverlayOpacity("18")
    setCategoryTextPosition("bottom-left")
    setCategoryTextColor("#FFFFFF")
    setCategoryTitleSize("28")
    setCategorySubtitleSize("14")
    setCategoryButtonBg("#FFFFFF")
    setCategoryButtonColor("#FFFFFF")
    setCategoryButtonBorder("#FFFFFF")
    setCategoryDesktopVisible(true)
    setCategoryMobileVisible(true)

    setFeaturedLayout("overlay")
    setFeaturedMediaType("image")
    setFeaturedMediaUrl("")
    setFeaturedMediaAlt("")
    setFeaturedObjectPosition("center")
    setFeaturedWidth("full")
    setFeaturedDesktopHeight("720")
    setFeaturedMobileHeight("560")
    setFeaturedEyebrow("")
    setFeaturedHeading("")
    setFeaturedBody("")
    setFeaturedButtonText("Discover")
    setFeaturedButtonUrl("")
    setFeaturedContentAlign("left")
    setFeaturedContentVertical("center")
    setFeaturedContentSide("right")
    setFeaturedContentMaxWidth("620")
    setFeaturedContentPadding("56")
    setFeaturedOverlayColor("#000000")
    setFeaturedOverlayOpacity("28")
    setFeaturedPanelBackground("#F4F0EA")
    setFeaturedTextColor("#FFFFFF")
    setFeaturedEyebrowColor("#FFFFFF")
    setFeaturedHeadingFont("Georgia, serif")
    setFeaturedHeadingSize("58")
    setFeaturedHeadingMobileSize("36")
    setFeaturedHeadingWeight("500")
    setFeaturedBodyFont("Arial, sans-serif")
    setFeaturedBodySize("16")
    setFeaturedButtonFont("Arial, sans-serif")
    setFeaturedButtonStyle("filled")
    setFeaturedButtonBg("#FFFFFF")
    setFeaturedButtonColor("#111111")
    setFeaturedButtonBorder("#FFFFFF")
    setFeaturedButtonRadius("0")
    setFeaturedButtonSize("12")
    setFeaturedButtonPaddingX("24")
    setFeaturedButtonPaddingY("14")
    setFeaturedTopSpacing("48")
    setFeaturedBottomSpacing("48")
    setFeaturedDesktopVisible(true)
    setFeaturedMobileVisible(true)

    setCampaignMediaType("image")
    setCampaignMediaUrl("")
    setCampaignMediaAlt("")
    setCampaignObjectPosition("center")
    setCampaignMediaFit("cover")
    setCampaignFocalX("50")
    setCampaignFocalY("50")
    setCampaignMediaZoom("1")
    setCampaignMediaBackground("#F8F4EC")
    setCampaignMobileMediaType("image")
    setCampaignMobileMediaUrl("")
    setCampaignMobileHeight("500")
    setCampaignHeight("620")
    setCampaignWidth("full")
    setCampaignEyebrow("")
    setCampaignHeading("")
    setCampaignBody("")
    setCampaignPrimaryText("Shop Now")
    setCampaignPrimaryUrl("")
    setCampaignSecondaryText("")
    setCampaignSecondaryUrl("")
    setCampaignContentAlign("center")
    setCampaignTextAlign("center")
    setCampaignContentVertical("center")
    setCampaignContentPadding("40")
    setCampaignContentMaxWidth("560")
    setCampaignHeadingLineHeight("0.98")
    setCampaignHeadingLetterSpacing("-0.03")
    setCampaignBodyLineHeight("1.55")
    setCampaignDividerEnabled(true)
    setCampaignDividerWidth("88")
    setCampaignDividerThickness("2")
    setCampaignDividerColor("#A97838")
    setCampaignOverlayColor("#000000")
    setCampaignOverlayOpacity("28")
    setCampaignTextColor("#FFFFFF")
    setCampaignEyebrowColor("#FFFFFF")
    setCampaignHeadingFont("Georgia, serif")
    setCampaignHeadingSize("64")
    setCampaignHeadingWeight("500")
    setCampaignBodyFont("Arial, sans-serif")
    setCampaignBodySize("16")
    setCampaignButtonFont("Arial, sans-serif")
    setCampaignPrimaryStyle("filled")
    setCampaignPrimaryBg("#FFFFFF")
    setCampaignPrimaryColor("#111111")
    setCampaignPrimaryBorder("#FFFFFF")
    setCampaignSecondaryStyle("outline")
    setCampaignSecondaryColor("#FFFFFF")
    setCampaignSecondaryBorder("#FFFFFF")
    setCampaignButtonRadius("0")
    setCampaignButtonSize("12")
    setCampaignButtonPaddingX("24")
    setCampaignButtonPaddingY("14")
    setCampaignTopSpacing("0")
    setCampaignBottomSpacing("0")
    setCampaignDesktopVisible(true)
    setCampaignMobileVisible(true)
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    try {
      setSaving(true)

      const nextPosition =
        sections.length > 0
          ? Math.max(
              ...sections.map(
                (section) =>
                  Number(section.position) || 0
              )
            ) + 10
          : 0

      const body = {
        type,
        title: title.trim() || null,
        position: editingId
          ? Number(position) || 0
          : nextPosition,
        is_active: isActive,
        config:
          type === "product_showcase"
            ? {
                source_type: showcaseSource,
                collection_handle:
                  showcaseSource === "collection"
                    ? showcaseCollection || null
                    : null,
                category_id:
                  showcaseSource === "category"
                    ? showcaseCategoryId || null
                    : null,
                category_handle:
                  showcaseSource === "category"
                    ? selectedCategory?.handle || null
                    : null,
                category_name:
                  showcaseSource === "category"
                    ? selectedCategory?.name || null
                    : null,
                category_path:
                  showcaseSource === "category" && showcaseCategoryId
                    ? getCategoryPath(showcaseCategoryId) || null
                    : null,
                manual_product_ids:
                  showcaseSource === "manual"
                    ? showcaseManualProducts.map((product) => product.id)
                    : [],
                subtitle: showcaseSubtitle || null,
                layout: showcaseLayout,
                desktop_columns: Number(showcaseDesktopColumns),
                product_count: Number(showcaseProductCount),
                image_ratio: showcaseImageRatio,
                width: showcaseWidth,
                top_spacing: Number(showcaseTopSpacing),
                bottom_spacing: Number(showcaseBottomSpacing),
                background: showcaseBackground,
                show_price: showcaseShowPrice,
                show_badge: showcaseShowBadge,
                show_swatches: showcaseShowSwatches,
                show_quick_add: showcaseShowQuickAdd,
                desktop_visible: showcaseDesktopVisible,
                mobile_visible: showcaseMobileVisible,
              }
            : type === "collection_cards"
              ? {
                  cards: collectionCards
                    .filter((card) => card.collection_handle || card.image_url || card.title)
                    .map((card) => ({
                      collection_handle: card.collection_handle || null,
                      title: card.title || null,
                      subtitle: card.subtitle || null,
                      image_url: card.image_url || null,
                      button_text: card.button_text || null,
                      custom_url: card.custom_url || null,
                      content_offset_x: Number(card.content_offset_x) || 0,
                      content_offset_y: Number(card.content_offset_y) || 0,
                    })),
                  desktop_columns: Number(collectionCardsDesktopColumns),
                  mobile_columns: Number(collectionCardsMobileColumns),
                  image_ratio: collectionCardsImageRatio,
                  width: collectionCardsWidth,
                  top_spacing: Number(collectionCardsTopSpacing),
                  bottom_spacing: Number(collectionCardsBottomSpacing),
                  gap: Number(collectionCardsGap),
                  background: collectionCardsBackground,
                  text_position: collectionCardsTextPosition,
                  overlay_opacity: Number(collectionCardsOverlayOpacity),
                  title_color: collectionCardsTitleColor,
                  title_size: Number(collectionCardsTitleSize),
                  title_mobile_size: Number(collectionCardsTitleMobileSize),
                  title_weight: Number(collectionCardsTitleWeight),
                  subtitle_color: collectionCardsSubtitleColor,
                  subtitle_size: Number(collectionCardsSubtitleSize),
                  button_style: collectionCardsButtonStyle,
                  button_bg_color: collectionCardsButtonBgColor,
                  button_text_color: collectionCardsButtonTextColor,
                  button_border_color: collectionCardsButtonBorderColor,
                  button_size: Number(collectionCardsButtonSize),
                  button_radius: Number(collectionCardsButtonRadius),
                  button_padding_x: Number(collectionCardsButtonPaddingX),
                  button_padding_y: Number(collectionCardsButtonPaddingY),
                  desktop_visible: collectionCardsDesktopVisible,
                  mobile_visible: collectionCardsMobileVisible,
                }
              : type === "editorial_split"
                ? {
                    layout: editorialLayout,
                    width: editorialWidth,
                    min_height: Number(editorialMinHeight),
                    image_url: editorialImageUrl || null,
                    image_alt: editorialImageAlt || null,
                    image_fit: editorialImageFit,
                    image_position: editorialImagePosition,
                    eyebrow: editorialEyebrow || null,
                    heading: editorialHeading || null,
                    body: editorialBody || null,
                    button_text: editorialButtonText || null,
                    button_url: editorialButtonUrl || null,
                    content_align: editorialContentAlign,
                    content_vertical: editorialContentVertical,
                    content_padding: Number(editorialContentPadding),
                    background: editorialBackground,
                    text_color: editorialTextColor,
                    eyebrow_color: editorialEyebrowColor,
                    heading_font: editorialHeadingFont,
                    heading_size: Number(editorialHeadingSize),
                    heading_mobile_size: Number(editorialHeadingMobileSize),
                    heading_weight: Number(editorialHeadingWeight),
                    body_font: editorialBodyFont,
                    body_size: Number(editorialBodySize),
                    button_font: editorialButtonFont,
                    button_style: editorialButtonStyle,
                    button_bg: editorialButtonBg,
                    button_color: editorialButtonColor,
                    button_border: editorialButtonBorder,
                    button_radius: Number(editorialButtonRadius),
                    button_size: Number(editorialButtonSize),
                    button_padding_x: Number(editorialButtonPaddingX),
                    button_padding_y: Number(editorialButtonPaddingY),
                    top_spacing: Number(editorialTopSpacing),
                    bottom_spacing: Number(editorialBottomSpacing),
                    mobile_order: editorialMobileOrder,
                    desktop_visible: editorialDesktopVisible,
                    mobile_visible: editorialMobileVisible,
                  }
                : type === "image_mosaic"
                  ? {
                      items: mosaicItems
                        .filter((item) => item.image_url)
                        .map((item) => ({
                          image_url: item.image_url,
                          image_alt: item.image_alt || null,
                          link_url: item.link_url || null,
                          size: item.size,
                          image_position: item.image_position,
                        })),
                      width: mosaicWidth,
                      desktop_columns: Number(mosaicDesktopColumns),
                      mobile_columns: Number(mosaicMobileColumns),
                      row_height: Number(mosaicRowHeight),
                      mobile_row_height: Number(mosaicMobileRowHeight),
                      gap: Number(mosaicGap),
                      background: mosaicBackground,
                      top_spacing: Number(mosaicTopSpacing),
                      bottom_spacing: Number(mosaicBottomSpacing),
                      desktop_visible: mosaicDesktopVisible,
                      mobile_visible: mosaicMobileVisible,
                    }
                  : type === "shop_the_look"
                    ? {
                        image_url: shopImageUrl || null,
                        image_alt: shopImageAlt || null,
                        image_position: shopImagePosition,
                        width: shopWidth,
                        desktop_height: Number(shopDesktopHeight),
                        mobile_height: Number(shopMobileHeight),
                        background: shopBackground,
                        top_spacing: Number(shopTopSpacing),
                        bottom_spacing: Number(shopBottomSpacing),
                        desktop_visible: shopDesktopVisible,
                        mobile_visible: shopMobileVisible,
                        show_product_card: shopShowProductCard,
                        hotspot_color: shopHotspotColor,
                        hotspot_ring_color: shopHotspotRingColor,
                        hotspot_size: Number(shopHotspotSize),
                        hotspots: shopHotspots.map((item) => ({
                          id: item.id,
                          x: Number(item.x),
                          y: Number(item.y),
                          product_id: item.product_id || null,
                          product_handle: item.product_handle || null,
                          product_title: item.product_title || null,
                          product_thumbnail: item.product_thumbnail || null,
                          price_label: item.price_label || null,
                          label: item.label || null,
                        })),
                      }
                : type === "spacer"
                  ? {
                      height: Number(spacerHeight),
                      mobile_height: Number(spacerMobileHeight),
                      show_divider: spacerShowDivider,
                      divider_thickness: Number(spacerDividerThickness),
                      divider_width: Number(spacerDividerWidth),
                      divider_style: spacerDividerStyle,
                      divider_color: spacerDividerColor,
                      background: spacerBackground,
                      width: spacerWidth,
                      top_spacing: Number(spacerTopSpacing),
                      bottom_spacing: Number(spacerBottomSpacing),
                      desktop_visible: spacerDesktopVisible,
                      mobile_visible: spacerMobileVisible,
                    }
                : type === "editorial_text"
                  ? {
                      eyebrow: editorialTextEyebrow || null,
                      heading: editorialTextHeading || null,
                      body: editorialTextBody || null,
                      quote: editorialTextQuote || null,
                      button_text: editorialTextButtonText || null,
                      button_url: editorialTextButtonUrl || null,
                      align: editorialTextAlign,
                      width: editorialTextWidth,
                      max_width: Number(editorialTextMaxWidth),
                      background: editorialTextBackground,
                      text_color: editorialTextMainColor,
                      accent_color: editorialTextAccentColor,
                      heading_font: editorialTextHeadingFont,
                      body_font: editorialTextBodyFont,
                      heading_size: Number(editorialTextHeadingSize),
                      mobile_heading_size: Number(editorialTextMobileHeadingSize),
                      body_size: Number(editorialTextBodySize),
                      quote_size: Number(editorialTextQuoteSize),
                      heading_weight: Number(editorialTextHeadingWeight),
                      button_style: editorialTextButtonStyle,
                      button_bg: editorialTextButtonBg,
                      button_color: editorialTextButtonColor,
                      button_border: editorialTextButtonBorder,
                      top_spacing: Number(editorialTextTopSpacing),
                      bottom_spacing: Number(editorialTextBottomSpacing),
                      desktop_visible: editorialTextDesktopVisible,
                      mobile_visible: editorialTextMobileVisible,
                    }
                : type === "video_story"
                  ? {
                      video_url: videoStoryVideoUrl || null,
                      poster_url: videoStoryPosterUrl || null,
                      heading: videoStoryHeading || null,
                      subtitle: videoStorySubtitle || null,
                      button_text: videoStoryButtonText || null,
                      button_url: videoStoryButtonUrl || null,
                      autoplay: videoStoryAutoplay,
                      muted: videoStoryMuted,
                      loop: videoStoryLoop,
                      controls: videoStoryControls,
                      object_position: videoStoryObjectPosition,
                      width: videoStoryWidth,
                      desktop_height: Number(videoStoryDesktopHeight),
                      mobile_height: Number(videoStoryMobileHeight),
                      content_align: videoStoryContentAlign,
                      content_vertical: videoStoryContentVertical,
                      overlay_color: videoStoryOverlayColor,
                      overlay_opacity: Number(videoStoryOverlayOpacity),
                      text_color: videoStoryTextColor,
                      heading_font: videoStoryHeadingFont,
                      heading_size: Number(videoStoryHeadingSize),
                      mobile_heading_size: Number(videoStoryMobileHeadingSize),
                      body_font: videoStoryBodyFont,
                      subtitle_size: Number(videoStorySubtitleSize),
                      button_style: videoStoryButtonStyle,
                      button_bg: videoStoryButtonBg,
                      button_color: videoStoryButtonColor,
                      button_border: videoStoryButtonBorder,
                      top_spacing: Number(videoStoryTopSpacing),
                      bottom_spacing: Number(videoStoryBottomSpacing),
                      desktop_visible: videoStoryDesktopVisible,
                      mobile_visible: videoStoryMobileVisible,
                    }
                : type === "marquee"
                  ? {
                      items: marqueeItems.map((item) => item.trim()).filter(Boolean),
                      speed: Number(marqueeSpeed),
                      direction: marqueeDirection,
                      pause_on_hover: marqueePauseOnHover,
                      separator: marqueeSeparator,
                      font: marqueeFont,
                      font_size: Number(marqueeFontSize),
                      mobile_font_size: Number(marqueeMobileFontSize),
                      font_weight: Number(marqueeFontWeight),
                      letter_spacing: Number(marqueeLetterSpacing),
                      text_transform: marqueeTextTransform,
                      background: marqueeBackground,
                      text_color: marqueeTextColor,
                      separator_color: marqueeSeparatorColor,
                      padding_y: Number(marqueePaddingY),
                      item_gap: Number(marqueeItemGap),
                      top_spacing: Number(marqueeTopSpacing),
                      bottom_spacing: Number(marqueeBottomSpacing),
                      desktop_visible: marqueeDesktopVisible,
                      mobile_visible: marqueeMobileVisible,
                    }
                : type === "category_showcase"
                  ? {
                      items: categoryItems
                        .filter((item) => item.image_url || item.title)
                        .map(({ id, ...item }) => item),
                      desktop_columns: Number(categoryDesktopColumns),
                      image_ratio: categoryImageRatio,
                      width: categoryWidth,
                      gap: Number(categoryGap),
                      background: categoryBackground,
                      top_spacing: Number(categoryTopSpacing),
                      bottom_spacing: Number(categoryBottomSpacing),
                      overlay_opacity: Number(categoryOverlayOpacity),
                      text_position: categoryTextPosition,
                      text_color: categoryTextColor,
                      title_size: Number(categoryTitleSize),
                      subtitle_size: Number(categorySubtitleSize),
                      button_style: "filled",
                      button_bg: categoryButtonBg,
                      button_color: categoryButtonColor,
                      button_border: categoryButtonBorder,
                      desktop_visible: categoryDesktopVisible,
                      mobile_visible: categoryMobileVisible,
                    }
                : type === "featured_story"
                  ? {
                      layout: featuredLayout,
                      media_type: featuredMediaType,
                      media_url: featuredMediaUrl || null,
                      media_alt: featuredMediaAlt || null,
                      object_position: featuredObjectPosition,
                      width: featuredWidth,
                      desktop_height: Number(featuredDesktopHeight),
                      mobile_height: Number(featuredMobileHeight),
                      eyebrow: featuredEyebrow || null,
                      heading: featuredHeading || null,
                      body: featuredBody || null,
                      button_text: featuredButtonText || null,
                      button_url: featuredButtonUrl || null,
                      content_align: featuredContentAlign,
                      content_vertical: featuredContentVertical,
                      content_side: featuredContentSide,
                      content_max_width: Number(featuredContentMaxWidth),
                      content_padding: Number(featuredContentPadding),
                      overlay_color: featuredOverlayColor,
                      overlay_opacity: Number(featuredOverlayOpacity),
                      panel_background: featuredPanelBackground,
                      text_color: featuredTextColor,
                      eyebrow_color: featuredEyebrowColor,
                      heading_font: featuredHeadingFont,
                      heading_size: Number(featuredHeadingSize),
                      heading_mobile_size: Number(featuredHeadingMobileSize),
                      heading_weight: Number(featuredHeadingWeight),
                      body_font: featuredBodyFont,
                      body_size: Number(featuredBodySize),
                      button_font: featuredButtonFont,
                      button_style: featuredButtonStyle,
                      button_bg: featuredButtonBg,
                      button_color: featuredButtonColor,
                      button_border: featuredButtonBorder,
                      button_radius: Number(featuredButtonRadius),
                      button_size: Number(featuredButtonSize),
                      button_padding_x: Number(featuredButtonPaddingX),
                      button_padding_y: Number(featuredButtonPaddingY),
                      top_spacing: Number(featuredTopSpacing),
                      bottom_spacing: Number(featuredBottomSpacing),
                      desktop_visible: featuredDesktopVisible,
                      mobile_visible: featuredMobileVisible,
                    }
                : type === "campaign_banner"
                  ? {
                      media_type: campaignMediaType,
                      media_url: campaignMediaUrl || null,
                      media_alt: campaignMediaAlt || null,
                      object_position: campaignObjectPosition,

                      // Campaign Studio media controls.
                      media_fit: campaignMediaFit,
                      focal_x: Number(campaignFocalX),
                      focal_y: Number(campaignFocalY),
                      media_zoom: Number(campaignMediaZoom),
                      media_background: campaignMediaBackground,

                      mobile_media_type: campaignMobileMediaType,
                      mobile_media_url: campaignMobileMediaUrl || null,
                      mobile_height: Number(campaignMobileHeight),

                      /*
                       * Hybrid responsive master:
                       * desktop/tablet preserve proportional composition;
                       * mobile can use optional artwork + taller frame.
                       */
                      responsive_mode: "hybrid",
                      height: Number(campaignHeight),
                      width: campaignWidth,
                      eyebrow: campaignEyebrow || null,
                      heading: campaignHeading || null,
                      body: campaignBody || null,
                      primary_text: campaignPrimaryText || null,
                      primary_url: campaignPrimaryUrl || null,
                      secondary_text: campaignSecondaryText || null,
                      secondary_url: campaignSecondaryUrl || null,
                      content_align: campaignContentAlign,
                      text_align: campaignTextAlign,
                      content_vertical: campaignContentVertical,
                      content_padding: Number(campaignContentPadding),
                      content_max_width: Number(campaignContentMaxWidth),

                      heading_line_height: Number(campaignHeadingLineHeight),
                      heading_letter_spacing: Number(campaignHeadingLetterSpacing),
                      body_line_height: Number(campaignBodyLineHeight),

                      divider_enabled: campaignDividerEnabled,
                      divider_width: Number(campaignDividerWidth),
                      divider_thickness: Number(campaignDividerThickness),
                      divider_color: campaignDividerColor,

                      overlay_color: campaignOverlayColor,
                      overlay_opacity: Number(campaignOverlayOpacity),
                      text_color: campaignTextColor,
                      eyebrow_color: campaignEyebrowColor,
                      heading_font: campaignHeadingFont,
                      heading_size: Number(campaignHeadingSize),
                      heading_weight: Number(campaignHeadingWeight),
                      body_font: campaignBodyFont,
                      body_size: Number(campaignBodySize),
                      button_font: campaignButtonFont,
                      primary_style: campaignPrimaryStyle,
                      primary_bg: campaignPrimaryBg,
                      primary_color: campaignPrimaryColor,
                      primary_border: campaignPrimaryBorder,
                      secondary_style: campaignSecondaryStyle,
                      secondary_color: campaignSecondaryColor,
                      secondary_border: campaignSecondaryBorder,
                      button_radius: Number(campaignButtonRadius),
                      button_size: Number(campaignButtonSize),
                      button_padding_x: Number(campaignButtonPaddingX),
                      button_padding_y: Number(campaignButtonPaddingY),
                      top_spacing: Number(campaignTopSpacing),
                      bottom_spacing: Number(campaignBottomSpacing),
                      desktop_visible: campaignDesktopVisible,
                      mobile_visible: campaignMobileVisible,
                    }
                  : {},
      }

      await sdk.client.fetch(
        editingId
          ? `/admin/homepage-sections/${editingId}`
          : "/admin/homepage-sections",
        {
          method: "POST",
          body,
        }
      )

      resetForm()
      await loadSections()
    } catch (error) {
      console.error("Failed to save homepage section:", error)
      alert("Homepage section could not be saved. Check backend terminal.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (section: HomepageSection) => {
    setEditingId(section.id)
    setEditorOpen(true)
    setPreviewOpen(false)
    setType(section.type)
    setTitle(section.title || "")
    setPosition(String(section.position ?? 0))
    setIsActive(section.is_active !== false)

    const config = (section.config || {}) as Record<string, unknown>

    const savedShowcaseSource = String(
      config.source_type ?? "collection"
    )

    setShowcaseSource(
      ["collection", "category", "manual", "new_arrivals"].includes(
        savedShowcaseSource
      )
        ? (savedShowcaseSource as ShowcaseSource)
        : "collection"
    )
    setShowcaseCollection(String(config.collection_handle ?? ""))
    setShowcaseCategoryId(String(config.category_id ?? ""))
    setShowcaseProductQuery("")
    setShowcaseProductResults([])

    const manualProductIds = Array.isArray(config.manual_product_ids)
      ? (config.manual_product_ids as unknown[])
          .map((id) => String(id))
          .filter(Boolean)
      : []

    setShowcaseManualProducts([])
    if (manualProductIds.length) {
      void loadShowcaseManualProductsByIds(manualProductIds)
    }

    setShowcaseSubtitle(String(config.subtitle ?? ""))
    setShowcaseLayout(String(config.layout ?? "grid"))
    setShowcaseDesktopColumns(String(config.desktop_columns ?? 4))
    setShowcaseProductCount(String(config.product_count ?? 8))
    setShowcaseImageRatio(String(config.image_ratio ?? "portrait"))
    setShowcaseWidth(String(config.width ?? "contained"))
    setShowcaseTopSpacing(String(config.top_spacing ?? 48))
    setShowcaseBottomSpacing(String(config.bottom_spacing ?? 48))
    setShowcaseBackground(String(config.background ?? "#FFFFFF"))
    setShowcaseShowPrice(config.show_price !== false)
    setShowcaseShowBadge(config.show_badge !== false)
    setShowcaseShowSwatches(config.show_swatches !== false)
    setShowcaseShowQuickAdd(config.show_quick_add === true)
    setShowcaseDesktopVisible(config.desktop_visible !== false)
    setShowcaseMobileVisible(config.mobile_visible !== false)

    const rawCards = Array.isArray(config.cards) ? config.cards : []
    const nextCards = rawCards
      .map((raw) => {
        const card = (raw || {}) as Record<string, unknown>
        return {
          collection_handle: String(card.collection_handle ?? ""),
          title: String(card.title ?? ""),
          subtitle: String(card.subtitle ?? ""),
          image_url: String(card.image_url ?? ""),
          button_text: String(card.button_text ?? "Shop Now"),
          custom_url: String(card.custom_url ?? ""),
          content_offset_x: Number(card.content_offset_x ?? 0),
          content_offset_y: Number(card.content_offset_y ?? 0),
        }
      })

    while (nextCards.length < 2) {
      nextCards.push(createEmptyCollectionCard())
    }

    setCollectionCards(nextCards.length ? nextCards : [
      createEmptyCollectionCard(),
      createEmptyCollectionCard(),
      createEmptyCollectionCard(),
    ])
    setCollectionCardsDesktopColumns(String(config.desktop_columns ?? 4))
    setCollectionCardsMobileColumns(String(config.mobile_columns ?? 2))
    setCollectionCardsImageRatio(String(config.image_ratio ?? "portrait"))
    setCollectionCardsWidth(String(config.width ?? "full"))
    setCollectionCardsTopSpacing(String(config.top_spacing ?? 48))
    setCollectionCardsBottomSpacing(String(config.bottom_spacing ?? 48))
    setCollectionCardsGap(String(config.gap ?? 16))
    setCollectionCardsBackground(String(config.background ?? "#FFFFFF"))
    setCollectionCardsTextPosition(String(config.text_position ?? "bottom-center"))
    setCollectionCardsOverlayOpacity(String(config.overlay_opacity ?? 12))
    setCollectionCardsTitleColor(String(config.title_color ?? "#FFFFFF"))
    setCollectionCardsTitleSize(String(config.title_size ?? 30))
    setCollectionCardsTitleMobileSize(String(config.title_mobile_size ?? 20))
    setCollectionCardsTitleWeight(String(config.title_weight ?? 500))
    setCollectionCardsSubtitleColor(String(config.subtitle_color ?? "#FFFFFF"))
    setCollectionCardsSubtitleSize(String(config.subtitle_size ?? 14))
    setCollectionCardsButtonStyle(String(config.button_style ?? "filled"))
    setCollectionCardsButtonBgColor(String(config.button_bg_color ?? "#FFFFFF"))
    setCollectionCardsButtonTextColor(String(config.button_text_color ?? "#111111"))
    setCollectionCardsButtonBorderColor(String(config.button_border_color ?? "#FFFFFF"))
    setCollectionCardsButtonSize(String(config.button_size ?? 12))
    setCollectionCardsButtonRadius(String(config.button_radius ?? 0))
    setCollectionCardsButtonPaddingX(String(config.button_padding_x ?? 18))
    setCollectionCardsButtonPaddingY(String(config.button_padding_y ?? 10))
    setCollectionCardsDesktopVisible(config.desktop_visible !== false)
    setCollectionCardsMobileVisible(config.mobile_visible !== false)

    if (section.type === "editorial_split") {
      setEditorialLayout(String(config.layout ?? "image-left"))
      setEditorialWidth(String(config.width ?? "full"))
      setEditorialMinHeight(String(config.min_height ?? 620))
      setEditorialImageUrl(String(config.image_url ?? ""))
      setEditorialImageAlt(String(config.image_alt ?? ""))
      setEditorialImageFit(String(config.image_fit ?? "cover"))
      setEditorialImagePosition(String(config.image_position ?? "center"))
      setEditorialEyebrow(String(config.eyebrow ?? ""))
      setEditorialHeading(String(config.heading ?? ""))
      setEditorialBody(String(config.body ?? ""))
      setEditorialButtonText(String(config.button_text ?? "Shop Now"))
      setEditorialButtonUrl(String(config.button_url ?? ""))
      setEditorialContentAlign(String(config.content_align ?? "left"))
      setEditorialContentVertical(String(config.content_vertical ?? "center"))
      setEditorialContentPadding(String(config.content_padding ?? 64))
      setEditorialBackground(String(config.background ?? "#F7F4EF"))
      setEditorialTextColor(String(config.text_color ?? "#111111"))
      setEditorialEyebrowColor(String(config.eyebrow_color ?? "#B48A52"))
      setEditorialHeadingFont(String(config.heading_font ?? "Georgia, serif"))
      setEditorialHeadingSize(String(config.heading_size ?? 52))
      setEditorialHeadingMobileSize(String(config.heading_mobile_size ?? 34))
      setEditorialHeadingWeight(String(config.heading_weight ?? 500))
      setEditorialBodyFont(String(config.body_font ?? "Arial, sans-serif"))
      setEditorialBodySize(String(config.body_size ?? 16))
      setEditorialButtonFont(String(config.button_font ?? "Arial, sans-serif"))
      setEditorialButtonStyle(String(config.button_style ?? "filled"))
      setEditorialButtonBg(String(config.button_bg ?? "#111111"))
      setEditorialButtonColor(String(config.button_color ?? "#FFFFFF"))
      setEditorialButtonBorder(String(config.button_border ?? "#111111"))
      setEditorialButtonRadius(String(config.button_radius ?? 0))
      setEditorialButtonSize(String(config.button_size ?? 12))
      setEditorialButtonPaddingX(String(config.button_padding_x ?? 24))
      setEditorialButtonPaddingY(String(config.button_padding_y ?? 14))
      setEditorialTopSpacing(String(config.top_spacing ?? 0))
      setEditorialBottomSpacing(String(config.bottom_spacing ?? 0))
      setEditorialMobileOrder(String(config.mobile_order ?? "image-first"))
      setEditorialDesktopVisible(config.desktop_visible !== false)
      setEditorialMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "image_mosaic") {
      const rawItems = Array.isArray(config.items) ? config.items : []
      const nextItems = rawItems.map((raw) => {
        const item = (raw || {}) as Record<string, unknown>
        return {
          image_url: String(item.image_url ?? ""),
          image_alt: String(item.image_alt ?? ""),
          link_url: String(item.link_url ?? ""),
          size: (["small", "wide", "tall", "large"].includes(String(item.size))
            ? String(item.size)
            : "small") as ImageMosaicItemDraft["size"],
          image_position: (["center", "top", "bottom", "left", "right"].includes(String(item.image_position))
            ? String(item.image_position)
            : "center") as ImageMosaicItemDraft["image_position"],
        }
      })
      setMosaicItems(nextItems.length ? nextItems : [createEmptyMosaicItem()])
      setMosaicWidth(String(config.width ?? "full"))
      setMosaicDesktopColumns(String(config.desktop_columns ?? 4))
      setMosaicMobileColumns(String(config.mobile_columns ?? 2))
      setMosaicRowHeight(String(config.row_height ?? 240))
      setMosaicMobileRowHeight(String(config.mobile_row_height ?? 180))
      setMosaicGap(String(config.gap ?? 12))
      setMosaicBackground(String(config.background ?? "#FFFFFF"))
      setMosaicTopSpacing(String(config.top_spacing ?? 48))
      setMosaicBottomSpacing(String(config.bottom_spacing ?? 48))
      setMosaicDesktopVisible(config.desktop_visible !== false)
      setMosaicMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "spacer") {
      setSpacerHeight(String(config.height ?? 64))
      setSpacerMobileHeight(String(config.mobile_height ?? 40))
      setSpacerShowDivider(config.show_divider === true)
      setSpacerDividerThickness(String(config.divider_thickness ?? 1))
      setSpacerDividerWidth(String(config.divider_width ?? 100))
      setSpacerDividerStyle(String(config.divider_style ?? "solid"))
      setSpacerDividerColor(String(config.divider_color ?? "#D9D9D9"))
      setSpacerBackground(String(config.background ?? "#FFFFFF"))
      setSpacerWidth(String(config.width ?? "full"))
      setSpacerTopSpacing(String(config.top_spacing ?? 0))
      setSpacerBottomSpacing(String(config.bottom_spacing ?? 0))
      setSpacerDesktopVisible(config.desktop_visible !== false)
      setSpacerMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "editorial_text") {
      setEditorialTextEyebrow(String(config.eyebrow ?? ""))
      setEditorialTextHeading(String(config.heading ?? ""))
      setEditorialTextBody(String(config.body ?? ""))
      setEditorialTextQuote(String(config.quote ?? ""))
      setEditorialTextButtonText(String(config.button_text ?? ""))
      setEditorialTextButtonUrl(String(config.button_url ?? ""))
      setEditorialTextAlign(String(config.align ?? "center"))
      setEditorialTextWidth(String(config.width ?? "contained"))
      setEditorialTextMaxWidth(String(config.max_width ?? 900))
      setEditorialTextBackground(String(config.background ?? "#FFFFFF"))
      setEditorialTextMainColor(String(config.text_color ?? "#111111"))
      setEditorialTextAccentColor(String(config.accent_color ?? "#9A7446"))
      setEditorialTextHeadingFont(String(config.heading_font ?? "Georgia, serif"))
      setEditorialTextBodyFont(String(config.body_font ?? "Arial, sans-serif"))
      setEditorialTextHeadingSize(String(config.heading_size ?? 52))
      setEditorialTextMobileHeadingSize(String(config.mobile_heading_size ?? 34))
      setEditorialTextBodySize(String(config.body_size ?? 17))
      setEditorialTextQuoteSize(String(config.quote_size ?? 28))
      setEditorialTextHeadingWeight(String(config.heading_weight ?? 500))
      setEditorialTextButtonStyle(String(config.button_style ?? "underline"))
      setEditorialTextButtonBg(String(config.button_bg ?? "#111111"))
      setEditorialTextButtonColor(String(config.button_color ?? "#111111"))
      setEditorialTextButtonBorder(String(config.button_border ?? "#111111"))
      setEditorialTextTopSpacing(String(config.top_spacing ?? 72))
      setEditorialTextBottomSpacing(String(config.bottom_spacing ?? 72))
      setEditorialTextDesktopVisible(config.desktop_visible !== false)
      setEditorialTextMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "video_story") {
      setVideoStoryVideoUrl(String(config.video_url ?? ""))
      setVideoStoryPosterUrl(String(config.poster_url ?? ""))
      setVideoStoryHeading(String(config.heading ?? ""))
      setVideoStorySubtitle(String(config.subtitle ?? ""))
      setVideoStoryButtonText(String(config.button_text ?? "Discover"))
      setVideoStoryButtonUrl(String(config.button_url ?? ""))
      setVideoStoryAutoplay(config.autoplay !== false)
      setVideoStoryMuted(config.muted !== false)
      setVideoStoryLoop(config.loop !== false)
      setVideoStoryControls(config.controls === true)
      setVideoStoryObjectPosition(String(config.object_position ?? "center"))
      setVideoStoryWidth(String(config.width ?? "full"))
      setVideoStoryDesktopHeight(String(config.desktop_height ?? 760))
      setVideoStoryMobileHeight(String(config.mobile_height ?? 600))
      setVideoStoryContentAlign(String(config.content_align ?? "center"))
      setVideoStoryContentVertical(String(config.content_vertical ?? "center"))
      setVideoStoryOverlayColor(String(config.overlay_color ?? "#000000"))
      setVideoStoryOverlayOpacity(String(config.overlay_opacity ?? 25))
      setVideoStoryTextColor(String(config.text_color ?? "#FFFFFF"))
      setVideoStoryHeadingFont(String(config.heading_font ?? "Georgia, serif"))
      setVideoStoryHeadingSize(String(config.heading_size ?? 60))
      setVideoStoryMobileHeadingSize(String(config.mobile_heading_size ?? 38))
      setVideoStoryBodyFont(String(config.body_font ?? "Arial, sans-serif"))
      setVideoStorySubtitleSize(String(config.subtitle_size ?? 16))
      setVideoStoryButtonStyle(String(config.button_style ?? "outline"))
      setVideoStoryButtonBg(String(config.button_bg ?? "#FFFFFF"))
      setVideoStoryButtonColor(String(config.button_color ?? "#FFFFFF"))
      setVideoStoryButtonBorder(String(config.button_border ?? "#FFFFFF"))
      setVideoStoryTopSpacing(String(config.top_spacing ?? 48))
      setVideoStoryBottomSpacing(String(config.bottom_spacing ?? 48))
      setVideoStoryDesktopVisible(config.desktop_visible !== false)
      setVideoStoryMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "marquee") {
      const loadedItems = Array.isArray(config.items)
        ? config.items.map((item) => String(item)).filter(Boolean)
        : []
      setMarqueeItems(
        loadedItems.length
          ? loadedItems
          : ["New Arrivals", "Worldwide Shipping", "Discover The Collection"]
      )
      setMarqueeSpeed(String(config.speed ?? 28))
      setMarqueeDirection(String(config.direction ?? "left"))
      setMarqueePauseOnHover(config.pause_on_hover !== false)
      setMarqueeSeparator(String(config.separator ?? "✦"))
      setMarqueeFont(String(config.font ?? "Arial, sans-serif"))
      setMarqueeFontSize(String(config.font_size ?? 18))
      setMarqueeMobileFontSize(String(config.mobile_font_size ?? 14))
      setMarqueeFontWeight(String(config.font_weight ?? 500))
      setMarqueeLetterSpacing(String(config.letter_spacing ?? 2))
      setMarqueeTextTransform(String(config.text_transform ?? "uppercase"))
      setMarqueeBackground(String(config.background ?? "#111111"))
      setMarqueeTextColor(String(config.text_color ?? "#FFFFFF"))
      setMarqueeSeparatorColor(String(config.separator_color ?? "#FFFFFF"))
      setMarqueePaddingY(String(config.padding_y ?? 16))
      setMarqueeItemGap(String(config.item_gap ?? 36))
      setMarqueeTopSpacing(String(config.top_spacing ?? 0))
      setMarqueeBottomSpacing(String(config.bottom_spacing ?? 0))
      setMarqueeDesktopVisible(config.desktop_visible !== false)
      setMarqueeMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "category_showcase") {
      const loadedItems: CategoryShowcaseItemDraft[] =
        Array.isArray(config.items)
        ? (config.items as Record<string, unknown>[]).map<CategoryShowcaseItemDraft>((item, index) => {
            const linkUrl =
              String(item.link_url ?? "")

            const storedDestination =
              String(item.destination_type ?? "")

            const destinationType:
              CategoryShowcaseDestinationType =
              storedDestination === "category" ||
              storedDestination === "collection" ||
              storedDestination === "custom"
                ? storedDestination
                : linkUrl.startsWith("/categories/")
                  ? "category"
                  : linkUrl.startsWith("/collections/")
                    ? "collection"
                    : "custom"

            return {
              id: `category-${index}-${Date.now()}`,
              title: String(item.title ?? ""),
              subtitle: String(item.subtitle ?? ""),
              image_url: String(item.image_url ?? ""),
              image_alt: String(item.image_alt ?? ""),
              link_url: linkUrl,
              button_text: String(item.button_text ?? "Shop Now"),

              image_fit:
                (
                  String(item.image_fit ?? "cover") === "contain"
                    ? "contain"
                    : "cover"
                ) as CategoryShowcaseItemDraft["image_fit"],

              image_position_x:
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(item.image_position_x ?? 50)
                  )
                ),

              image_position_y:
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(item.image_position_y ?? 50)
                  )
                ),

              image_zoom:
                Math.max(
                  1,
                  Math.min(
                    1.8,
                    Number(item.image_zoom ?? 1)
                  )
                ),

              destination_type: destinationType,
              category_id: String(item.category_id ?? ""),
              collection_handle: String(item.collection_handle ?? ""),
            }
          })
        : []
      setCategoryItems(loadedItems.length ? loadedItems : [createCategoryItem()])
      setCategoryDesktopColumns(String(config.desktop_columns ?? 4))
      setCategoryImageRatio(String(config.image_ratio ?? "portrait"))
      setCategoryWidth(String(config.width ?? "full"))
      setCategoryGap(String(config.gap ?? 16))
      setCategoryBackground(String(config.background ?? "#FFFFFF"))
      setCategoryTopSpacing(String(config.top_spacing ?? 48))
      setCategoryBottomSpacing(String(config.bottom_spacing ?? 48))
      setCategoryOverlayOpacity(String(config.overlay_opacity ?? 18))
      setCategoryTextPosition(String(config.text_position ?? "bottom-left"))
      setCategoryTextColor(String(config.text_color ?? "#FFFFFF"))
      setCategoryTitleSize(String(config.title_size ?? 28))
      setCategorySubtitleSize(String(config.subtitle_size ?? 14))
      setCategoryButtonBg(String(config.button_bg ?? "#FFFFFF"))
      setCategoryButtonColor(String(config.button_color ?? "#FFFFFF"))
      setCategoryButtonBorder(String(config.button_border ?? "#FFFFFF"))
      setCategoryDesktopVisible(config.desktop_visible !== false)
      setCategoryMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "featured_story") {
      setFeaturedLayout(String(config.layout ?? "overlay"))
      setFeaturedMediaType(String(config.media_type ?? "image"))
      setFeaturedMediaUrl(String(config.media_url ?? ""))
      setFeaturedMediaAlt(String(config.media_alt ?? ""))
      setFeaturedObjectPosition(String(config.object_position ?? "center"))
      setFeaturedWidth(String(config.width ?? "full"))
      setFeaturedDesktopHeight(String(config.desktop_height ?? 720))
      setFeaturedMobileHeight(String(config.mobile_height ?? 560))
      setFeaturedEyebrow(String(config.eyebrow ?? ""))
      setFeaturedHeading(String(config.heading ?? ""))
      setFeaturedBody(String(config.body ?? ""))
      setFeaturedButtonText(String(config.button_text ?? "Discover"))
      setFeaturedButtonUrl(String(config.button_url ?? ""))
      setFeaturedContentAlign(String(config.content_align ?? "left"))
      setFeaturedContentVertical(String(config.content_vertical ?? "center"))
      setFeaturedContentSide(String(config.content_side ?? "right"))
      setFeaturedContentMaxWidth(String(config.content_max_width ?? 620))
      setFeaturedContentPadding(String(config.content_padding ?? 56))
      setFeaturedOverlayColor(String(config.overlay_color ?? "#000000"))
      setFeaturedOverlayOpacity(String(config.overlay_opacity ?? 28))
      setFeaturedPanelBackground(String(config.panel_background ?? "#F4F0EA"))
      setFeaturedTextColor(String(config.text_color ?? "#FFFFFF"))
      setFeaturedEyebrowColor(String(config.eyebrow_color ?? "#FFFFFF"))
      setFeaturedHeadingFont(String(config.heading_font ?? "Georgia, serif"))
      setFeaturedHeadingSize(String(config.heading_size ?? 58))
      setFeaturedHeadingMobileSize(String(config.heading_mobile_size ?? 36))
      setFeaturedHeadingWeight(String(config.heading_weight ?? 500))
      setFeaturedBodyFont(String(config.body_font ?? "Arial, sans-serif"))
      setFeaturedBodySize(String(config.body_size ?? 16))
      setFeaturedButtonFont(String(config.button_font ?? "Arial, sans-serif"))
      setFeaturedButtonStyle(String(config.button_style ?? "filled"))
      setFeaturedButtonBg(String(config.button_bg ?? "#FFFFFF"))
      setFeaturedButtonColor(String(config.button_color ?? "#111111"))
      setFeaturedButtonBorder(String(config.button_border ?? "#FFFFFF"))
      setFeaturedButtonRadius(String(config.button_radius ?? 0))
      setFeaturedButtonSize(String(config.button_size ?? 12))
      setFeaturedButtonPaddingX(String(config.button_padding_x ?? 24))
      setFeaturedButtonPaddingY(String(config.button_padding_y ?? 14))
      setFeaturedTopSpacing(String(config.top_spacing ?? 48))
      setFeaturedBottomSpacing(String(config.bottom_spacing ?? 48))
      setFeaturedDesktopVisible(config.desktop_visible !== false)
      setFeaturedMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "campaign_banner") {
      setCampaignMediaType(String(config.media_type ?? "image"))
      setCampaignMediaUrl(String(config.media_url ?? ""))
      setCampaignMediaAlt(String(config.media_alt ?? ""))
      setCampaignObjectPosition(String(config.object_position ?? "center"))
      setCampaignMediaFit(String(config.media_fit ?? "cover"))
      setCampaignFocalX(String(config.focal_x ?? 50))
      setCampaignFocalY(String(config.focal_y ?? 50))
      setCampaignMediaZoom(String(config.media_zoom ?? 1))
      setCampaignMediaBackground(String(config.media_background ?? "#F8F4EC"))
      setCampaignMobileMediaType(String(config.mobile_media_type ?? "image"))
      setCampaignMobileMediaUrl(String(config.mobile_media_url ?? ""))
      setCampaignMobileHeight(String(config.mobile_height ?? 500))
      setCampaignHeight(String(config.height ?? 620))
      setCampaignWidth(String(config.width ?? "full"))
      setCampaignEyebrow(String(config.eyebrow ?? ""))
      setCampaignHeading(String(config.heading ?? ""))
      setCampaignBody(String(config.body ?? ""))
      setCampaignPrimaryText(String(config.primary_text ?? "Shop Now"))
      setCampaignPrimaryUrl(String(config.primary_url ?? ""))
      setCampaignSecondaryText(String(config.secondary_text ?? ""))
      setCampaignSecondaryUrl(String(config.secondary_url ?? ""))
      setCampaignContentAlign(String(config.content_align ?? "center"))
      setCampaignTextAlign(
        String(
          config.text_align ??
          config.content_align ??
          "center"
        )
      )
      setCampaignContentVertical(String(config.content_vertical ?? "center"))
      setCampaignContentPadding(String(config.content_padding ?? 40))
      setCampaignContentMaxWidth(String(config.content_max_width ?? 560))
      setCampaignHeadingLineHeight(String(config.heading_line_height ?? 0.98))
      setCampaignHeadingLetterSpacing(String(config.heading_letter_spacing ?? -0.03))
      setCampaignBodyLineHeight(String(config.body_line_height ?? 1.55))
      setCampaignDividerEnabled(config.divider_enabled !== false)
      setCampaignDividerWidth(String(config.divider_width ?? 88))
      setCampaignDividerThickness(String(config.divider_thickness ?? 2))
      setCampaignDividerColor(String(config.divider_color ?? "#A97838"))
      setCampaignOverlayColor(String(config.overlay_color ?? "#000000"))
      setCampaignOverlayOpacity(String(config.overlay_opacity ?? 28))
      setCampaignTextColor(String(config.text_color ?? "#FFFFFF"))
      setCampaignEyebrowColor(String(config.eyebrow_color ?? "#FFFFFF"))
      setCampaignHeadingFont(String(config.heading_font ?? "Georgia, serif"))
      setCampaignHeadingSize(String(config.heading_size ?? 64))
      setCampaignHeadingWeight(String(config.heading_weight ?? 500))
      setCampaignBodyFont(String(config.body_font ?? "Arial, sans-serif"))
      setCampaignBodySize(String(config.body_size ?? 16))
      setCampaignButtonFont(String(config.button_font ?? "Arial, sans-serif"))
      setCampaignPrimaryStyle(String(config.primary_style ?? "filled"))
      setCampaignPrimaryBg(String(config.primary_bg ?? "#FFFFFF"))
      setCampaignPrimaryColor(String(config.primary_color ?? "#111111"))
      setCampaignPrimaryBorder(String(config.primary_border ?? "#FFFFFF"))
      setCampaignSecondaryStyle(String(config.secondary_style ?? "outline"))
      setCampaignSecondaryColor(String(config.secondary_color ?? "#FFFFFF"))
      setCampaignSecondaryBorder(String(config.secondary_border ?? "#FFFFFF"))
      setCampaignButtonRadius(String(config.button_radius ?? 0))
      setCampaignButtonSize(String(config.button_size ?? 12))
      setCampaignButtonPaddingX(String(config.button_padding_x ?? 24))
      setCampaignButtonPaddingY(String(config.button_padding_y ?? 14))
      setCampaignTopSpacing(String(config.top_spacing ?? 0))
      setCampaignBottomSpacing(String(config.bottom_spacing ?? 0))
      setCampaignDesktopVisible(config.desktop_visible !== false)
      setCampaignMobileVisible(config.mobile_visible !== false)
    }

    if (section.type === "shop_the_look") {
      setShopImageUrl(String(config.image_url ?? ""))
      setShopImageAlt(String(config.image_alt ?? ""))
      setShopImagePosition(String(config.image_position ?? "center"))
      setShopWidth(String(config.width ?? "full"))
      setShopDesktopHeight(String(config.desktop_height ?? 760))
      setShopMobileHeight(String(config.mobile_height ?? 560))
      setShopBackground(String(config.background ?? "#FFFFFF"))
      setShopTopSpacing(String(config.top_spacing ?? 48))
      setShopBottomSpacing(String(config.bottom_spacing ?? 48))
      setShopDesktopVisible(config.desktop_visible !== false)
      setShopMobileVisible(config.mobile_visible !== false)
      setShopShowProductCard(config.show_product_card !== false)
      setShopHotspotColor(String(config.hotspot_color ?? "#FFFFFF"))
      setShopHotspotRingColor(String(config.hotspot_ring_color ?? "#111111"))
      setShopHotspotSize(String(config.hotspot_size ?? 22))

      const nextHotspots = Array.isArray(config.hotspots)
        ? (config.hotspots as Record<string, unknown>[]).map((item, index) => ({
            id: String(item.id ?? `hotspot-${index}`),
            x: Number(item.x ?? 50),
            y: Number(item.y ?? 50),
            product_id: String(item.product_id ?? ""),
            product_handle: String(item.product_handle ?? ""),
            product_title: String(item.product_title ?? ""),
            product_thumbnail: String(item.product_thumbnail ?? ""),
            price_label: String(item.price_label ?? ""),
            label: String(item.label ?? item.product_title ?? ""),
          }))
        : []

      setShopHotspots(nextHotspots)
      setShopProductQuery("")
      setShopProductResults([])
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openCreateEditor = () => {
    resetForm()
    setEditorOpen(true)
    setPreviewOpen(false)
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const duplicateSection = async (
    section: HomepageSection
  ) => {
    try {
      const nextPosition =
        sections.length > 0
          ? Math.max(
              ...sections.map(
                (item) =>
                  Number(item.position) || 0
              )
            ) + 10
          : 0

      await sdk.client.fetch(
        "/admin/homepage-sections",
        {
          method: "POST",
          body: {
            type: section.type,
            title: `${
              section.title ||
              SECTION_TYPES.find(
                (item) =>
                  item.value ===
                  section.type
              )?.label ||
              "Section"
            } Copy`,
            position: nextPosition,
            is_active: false,
            config: section.config
              ? JSON.parse(
                  JSON.stringify(
                    section.config
                  )
                )
              : null,
          },
        }
      )

      await loadSections()
    } catch (error) {
      console.error(
        "Failed to duplicate homepage section:",
        error
      )
      alert(
        "Section could not be duplicated."
      )
    }
  }

  const getSectionSummary = (
    section: HomepageSection
  ) => {
    const config =
      (section.config || {}) as Record<
        string,
        any
      >

    if (
      section.type ===
      "product_showcase"
    ) {
      const sourceType = String(
        config.source_type || "collection"
      )

      const source =
        sourceType === "category"
          ? `Category: ${config.category_name || config.category_handle || "Selected"}`
          : sourceType === "manual"
            ? `Manual: ${Array.isArray(config.manual_product_ids) ? config.manual_product_ids.length : 0} selected`
            : sourceType === "new_arrivals"
              ? "New Arrivals"
              : config.collection_handle
                ? `Collection: ${config.collection_handle}`
                : "Product showcase"

      const count =
        Number(config.product_count) ||
        0

      return count
        ? `${source} · up to ${count} products`
        : source
    }

    if (
      section.type ===
      "collection_cards"
    ) {
      const count =
        Array.isArray(config.cards)
          ? config.cards.length
          : 0

      return `${count} collection card${
        count === 1 ? "" : "s"
      }`
    }

    if (
      section.type ===
      "category_showcase"
    ) {
      const count =
        Array.isArray(config.items)
          ? config.items.length
          : 0

      return `${count} category card${
        count === 1 ? "" : "s"
      }`
    }

    if (
      section.type ===
      "shop_the_look"
    ) {
      const count =
        Array.isArray(config.hotspots)
          ? config.hotspots.length
          : 0

      return `${count} linked product${
        count === 1 ? "" : "s"
      }`
    }

    if (
      section.type ===
      "image_mosaic"
    ) {
      const count =
        Array.isArray(config.items)
          ? config.items.length
          : 0

      return `${count} lookbook image${
        count === 1 ? "" : "s"
      }`
    }

    if (
      section.type ===
      "marquee"
    ) {
      const count =
        Array.isArray(config.items)
          ? config.items.length
          : 0

      return `${count} announcement${
        count === 1 ? "" : "s"
      }`
    }

    if (
      section.type ===
        "campaign_banner" ||
      section.type ===
        "featured_story"
    ) {
      return `${
        config.media_type === "video"
          ? "Video"
          : "Image"
      } · ${
        config.width || "full"
      } width`
    }

    if (
      section.type ===
      "video_story"
    ) {
      return "Video-led story"
    }

    if (
      section.type ===
      "spacer"
    ) {
      return `${
        Number(config.height) || 0
      }px desktop spacing`
    }

    return "Homepage content section"
  }

  const handleDelete = async (section: HomepageSection) => {
    if (!window.confirm(`Delete "${section.title || section.type}" section?`)) {
      return
    }

    try {
      await sdk.client.fetch(`/admin/homepage-sections/${section.id}`, {
        method: "DELETE",
      })

      if (editingId === section.id) resetForm()
      await loadSections()
    } catch (error) {
      console.error("Failed to delete homepage section:", error)
      alert("Section could not be deleted.")
    }
  }

  const toggleSection = async (section: HomepageSection) => {
    try {
      await sdk.client.fetch(`/admin/homepage-sections/${section.id}`, {
        method: "POST",
        body: { is_active: !section.is_active },
      })

      await loadSections()
    } catch (error) {
      console.error("Failed to toggle section:", error)
      alert("Section status could not be updated.")
    }
  }

  /*
   * Homepage order must never depend on duplicate position values.
   *
   * Older sections can have identical positions (for example 0, 0, 10, 10).
   * The previous implementation only swapped the two numeric values, so
   * swapping 0 with 0 made no database change at all.
   *
   * Keep the current API order as a stable tie-breaker, then after every
   * arrow move normalize ALL section positions to:
   *
   * 0, 10, 20, 30, ...
   *
   * This makes future reordering deterministic and permanently repairs
   * legacy duplicate positions at the same time.
   */
  const getOrderedSections = (
    source: HomepageSection[]
  ) =>
    source
      .map((section, originalIndex) => ({
        section,
        originalIndex,
      }))
      .sort((a, b) => {
        const positionDifference =
          (Number(a.section.position) || 0) -
          (Number(b.section.position) || 0)

        if (positionDifference) {
          return positionDifference
        }

        return (
          a.originalIndex -
          b.originalIndex
        )
      })
      .map(({ section }) => section)

  const moveSection = async (
    section: HomepageSection,
    direction: "up" | "down"
  ) => {
    const ordered =
      getOrderedSections(sections)

    const index =
      ordered.findIndex(
        (item) =>
          item.id === section.id
      )

    if (index < 0) {
      return
    }

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1

    if (
      targetIndex < 0 ||
      targetIndex >= ordered.length
    ) {
      return
    }

    /*
     * Move the section in memory first.
     * Do not swap potentially duplicated position numbers.
     */
    const nextOrder =
      [...ordered]

    const [moved] =
      nextOrder.splice(index, 1)

    nextOrder.splice(
      targetIndex,
      0,
      moved
    )

    /*
     * Give every section a unique canonical position.
     * Using gaps of 10 keeps the data human-readable and leaves
     * room for future insertion strategies if needed.
     */
    const normalized =
      nextOrder.map(
        (item, orderIndex) => ({
          item,
          position:
            orderIndex * 10,
        })
      )

    /*
     * Optimistically reflect the new order immediately so repeated
     * clicks feel responsive even before the reload finishes.
     */
    setSections(
      normalized.map(
        ({ item, position }) => ({
          ...item,
          position,
        })
      )
    )

    try {
      await Promise.all(
        normalized.map(
          ({
            item,
            position,
          }) =>
            sdk.client.fetch(
              `/admin/homepage-sections/${item.id}`,
              {
                method: "POST",
                body: {
                  position,
                },
              }
            )
        )
      )

      await loadSections()
    } catch (error) {
      console.error(
        "Failed to reorder sections:",
        error
      )

      alert(
        "Section order could not be updated."
      )

      /*
       * Restore the database-backed order if any update failed.
       */
      await loadSections()
    }
  }

  const sortedSections =
    getOrderedSections(sections)

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-[1500px]">
        <div className="flex flex-col gap-4 border-b border-gray-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
              Storefront
            </p>
            <h1 className="mt-2 text-xl font-medium">
              Homepage Builder
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Arrange the homepage in sections. Keep the structure simple, edit one section at a time, and hide anything that is not ready.
            </p>
          </div>

          {!editorOpen && (
            <button
              type="button"
              onClick={openCreateEditor}
              className="inline-flex h-10 items-center justify-center border border-white bg-white px-4 text-[12px] font-medium text-black transition-opacity hover:opacity-80"
            >
              + Add Section
            </button>
          )}
        </div>

        <section className="py-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[14px] font-medium">
                Homepage Structure
              </h2>
              <p className="mt-1 text-[12px] text-gray-500">
                Sections appear on the storefront in this order.
              </p>
            </div>

            <span className="text-[11px] text-gray-500">
              {sortedSections.length} section{sortedSections.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5 overflow-hidden border border-gray-800">
            {loading ? (
              <div className="p-6 text-[12px] text-gray-500">
                Loading homepage sections...
              </div>
            ) : sortedSections.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-[13px] font-medium">
                  Your homepage has no sections yet.
                </p>
                <p className="mt-2 text-[12px] text-gray-500">
                  Add a section to start building the storefront.
                </p>
                <button
                  type="button"
                  onClick={openCreateEditor}
                  className="mt-5 border border-gray-600 px-4 py-2 text-[12px] hover:border-gray-400"
                >
                  + Add first section
                </button>
              </div>
            ) : (
              sortedSections.map((section, index) => {
                const typeInfo = SECTION_TYPES.find(
                  (item) => item.value === section.type
                )

                return (
                  <div
                    key={section.id}
                    className="group flex flex-col gap-4 border-b border-gray-800 p-4 last:border-b-0 lg:flex-row lg:items-center"
                  >
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className="mr-2 select-none text-gray-600"
                        aria-hidden="true"
                      >
                        ⋮⋮
                      </span>

                      <button
                        type="button"
                        title="Move section up"
                        aria-label="Move section up"
                        disabled={index === 0}
                        onClick={() =>
                          moveSection(section, "up")
                        }
                        className="h-8 w-8 border border-gray-800 text-[12px] disabled:opacity-20 hover:border-gray-600"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        title="Move section down"
                        aria-label="Move section down"
                        disabled={
                          index ===
                          sortedSections.length - 1
                        }
                        onClick={() =>
                          moveSection(section, "down")
                        }
                        className="h-8 w-8 border border-gray-800 text-[12px] disabled:opacity-20 hover:border-gray-600"
                      >
                        ↓
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="truncate text-[13px] font-medium">
                          {section.title ||
                            typeInfo?.label ||
                            section.type}
                        </p>

                        <span className="text-[10px] uppercase tracking-[0.12em] text-gray-500">
                          {typeInfo?.label ||
                            section.type}
                        </span>

                        <span
                          className={`text-[10px] ${
                            section.is_active
                              ? "text-green-400"
                              : "text-gray-600"
                          }`}
                        >
                          {section.is_active
                            ? "● Visible"
                            : "○ Hidden"}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[11px] text-gray-500">
                        {getSectionSummary(section)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(section)
                        }
                        className="border border-gray-700 px-3 py-2 text-[11px] hover:border-gray-500"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleSection(section)
                        }
                        className="border border-gray-700 px-3 py-2 text-[11px] hover:border-gray-500"
                      >
                        {section.is_active
                          ? "Hide"
                          : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          duplicateSection(section)
                        }
                        className="border border-gray-700 px-3 py-2 text-[11px] hover:border-gray-500"
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(section)
                        }
                        className="border border-red-950 px-3 py-2 text-[11px] text-red-400 hover:border-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {editorOpen && (
      <form
        onSubmit={handleSubmit}
        className="mt-2 border border-gray-800 p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
              {editingId ? "Editing section" : "New section"}
            </p>
            <h2 className="mt-1 text-[16px] font-medium">
              {editingId
                ? title || selectedType?.label || "Edit Section"
                : "Add Homepage Section"}
            </h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Keep the main controls simple. Existing advanced visual controls are preserved below for compatibility.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="text-[12px] underline underline-offset-4"
          >
            Cancel
          </button>
        </div>

        {!editingId && (
          <div className="mt-6">
            <p className="text-[12px] font-medium">
              Choose section type
            </p>

            <div className="mt-5 space-y-7">
              {SECTION_GROUPS.map((group) => {
                const items = SECTION_TYPES.filter(
                  (item) =>
                    item.group === group.key
                )

                return (
                  <div key={group.key}>
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                        {group.label}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-600">
                        {group.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {items.map((item) => {
                        const selected =
                          type === item.value

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                              setType(item.value)
                            }
                            className={`min-h-[104px] border p-4 text-left transition ${
                              selected
                                ? "border-white bg-white text-black"
                                : "border-gray-800 hover:border-gray-600"
                            }`}
                          >
                            <p className="text-[12px] font-medium">
                              {item.label}
                            </p>
                            <p
                              className={`mt-2 text-[11px] leading-5 ${
                                selected
                                  ? "text-black/60"
                                  : "text-gray-500"
                              }`}
                            >
                              {item.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-6 border-y border-gray-800 py-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
            Section type
          </p>
          <p className="mt-1 text-[12px] font-medium">
            {selectedType?.label}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-gray-500">
            {selectedType?.description}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <label className="text-[12px]">
            Section Title
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Example: New Arrivals"
              className="mt-2 w-full border border-gray-700 bg-transparent px-3 py-2.5 outline-none focus:border-gray-400"
            />
          </label>

          <div>
            <p className="text-[12px]">
              Storefront visibility
            </p>
            <label className="mt-2 flex h-[42px] cursor-pointer items-center gap-3 border border-gray-700 px-4">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(
                    event.target.checked
                  )
                }
              />
              <span className="text-[12px]">
                {isActive
                  ? "Visible"
                  : "Hidden"}
              </span>
            </label>
          </div>
        </div>

        {type === "product_showcase" && (
          <div className="mt-8 border border-gray-800 bg-[#111114] p-5">
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
                Commerce
              </p>
              <h3 className="mt-1 text-[14px] font-medium">
                Product Showcase
              </h3>
              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                Choose where products come from, then control the storefront presentation.
              </p>
            </div>

            <div>
              <p className="text-[12px] font-medium">Product Source</p>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {[
                  ["collection", "Collection", "Use products from one collection"],
                  ["category", "Category", "Use products from one category"],
                  ["manual", "Manual Products", "Choose and order products yourself"],
                  ["new_arrivals", "New Arrivals", "Automatically show newest products"],
                ].map(([value, label, description]) => {
                  const selected = showcaseSource === value

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setShowcaseSource(value as ShowcaseSource)
                      }
                      className={`min-h-[92px] border p-3 text-left ${
                        selected
                          ? "border-white bg-white text-black"
                          : "border-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <p className="text-[11px] font-medium">{label}</p>
                      <p
                        className={`mt-1 text-[10px] leading-4 ${
                          selected ? "text-black/60" : "text-gray-500"
                        }`}
                      >
                        {description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 border-t border-gray-800 pt-5">
              {showcaseSource === "collection" && (
                <label className="block max-w-xl text-[12px]">
                  Collection
                  <select
                    value={showcaseCollection}
                    onChange={(event) =>
                      setShowcaseCollection(event.target.value)
                    }
                    disabled={collectionsLoading}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5 disabled:opacity-50"
                  >
                    <option value="">
                      {collectionsLoading
                        ? "Loading collections..."
                        : "Choose a collection"}
                    </option>
                    {collections.map((collection) => (
                      <option
                        key={collection.id}
                        value={collection.handle}
                      >
                        {collection.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {showcaseSource === "category" && (
                <label className="block max-w-xl text-[12px]">
                  Category
                  <select
                    value={showcaseCategoryId}
                    onChange={(event) =>
                      setShowcaseCategoryId(event.target.value)
                    }
                    disabled={categoriesLoading}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5 disabled:opacity-50"
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : "Choose a category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name || category.handle}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {showcaseSource === "manual" && (
                <div>
                  <div className="flex max-w-2xl gap-2">
                    <input
                      value={showcaseProductQuery}
                      onChange={(event) =>
                        setShowcaseProductQuery(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          void searchShowcaseProducts()
                        }
                      }}
                      placeholder="Search products by title..."
                      className="min-w-0 flex-1 border border-gray-700 bg-transparent px-3 py-2.5 text-[12px] outline-none focus:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => void searchShowcaseProducts()}
                      className="border border-gray-700 px-4 text-[11px] hover:border-gray-500"
                    >
                      {showcaseProductSearchLoading ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {showcaseProductResults.length > 0 && (
                    <div className="mt-3 max-h-64 max-w-2xl overflow-auto border border-gray-800">
                      {showcaseProductResults.map((product) => {
                        const alreadySelected = showcaseManualProducts.some(
                          (item) => item.id === product.id
                        )

                        return (
                          <button
                            key={product.id}
                            type="button"
                            disabled={alreadySelected}
                            onClick={() => addShowcaseManualProduct(product)}
                            className="flex w-full items-center gap-3 border-b border-gray-800 p-3 text-left last:border-b-0 hover:bg-white/5 disabled:opacity-40"
                          >
                            <div className="h-12 w-9 shrink-0 overflow-hidden bg-gray-800">
                              {product.thumbnail && (
                                <img
                                  src={product.thumbnail}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px]">
                                {product.title}
                              </p>
                              <p className="mt-1 text-[10px] text-gray-500">
                                {alreadySelected ? "Already selected" : "Add product"}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-5 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium">
                        Selected Products
                      </p>
                      <span className="text-[10px] text-gray-500">
                        {showcaseManualProducts.length}/16
                      </span>
                    </div>

                    {showcaseManualProducts.length === 0 ? (
                      <div className="mt-2 border border-dashed border-gray-800 p-5 text-center text-[11px] text-gray-500">
                        Search and add products. Their order here is the storefront order.
                      </div>
                    ) : (
                      <div className="mt-2 border border-gray-800">
                        {showcaseManualProducts.map((product, index) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 border-b border-gray-800 p-3 last:border-b-0"
                          >
                            <span className="text-[10px] text-gray-600">{index + 1}</span>
                            <div className="h-12 w-9 shrink-0 overflow-hidden bg-gray-800">
                              {product.thumbnail && (
                                <img
                                  src={product.thumbnail}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <p className="min-w-0 flex-1 truncate text-[11px]">
                              {product.title}
                            </p>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveShowcaseManualProduct(index, "up")}
                              className="h-7 w-7 border border-gray-800 text-[10px] disabled:opacity-20"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={index === showcaseManualProducts.length - 1}
                              onClick={() => moveShowcaseManualProduct(index, "down")}
                              className="h-7 w-7 border border-gray-800 text-[10px] disabled:opacity-20"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeShowcaseManualProduct(product.id)}
                              className="text-[10px] text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showcaseSource === "new_arrivals" && (
                <div className="max-w-2xl border border-gray-800 p-4">
                  <p className="text-[11px] font-medium">Automatic source</p>
                  <p className="mt-1 text-[11px] leading-5 text-gray-500">
                    The newest products are selected automatically using product creation date. No manual maintenance is required.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-7 border-t border-gray-800 pt-6">
              <p className="text-[11px] font-medium">Presentation</p>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-[11px]">
                  Subtitle
                  <input
                    value={showcaseSubtitle}
                    onChange={(event) => setShowcaseSubtitle(event.target.value)}
                    placeholder="Optional small heading"
                    className="mt-2 w-full border border-gray-700 bg-transparent px-3 py-2.5"
                  />
                </label>

                <label className="text-[11px]">
                  Layout
                  <select
                    value={showcaseLayout}
                    onChange={(event) => setShowcaseLayout(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5"
                  >
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </label>

                <label className="text-[11px]">
                  Product Count
                  <select
                    value={showcaseProductCount}
                    onChange={(event) => setShowcaseProductCount(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5"
                  >
                    {[4, 6, 8, 10, 12, 16].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>

                <label className="text-[11px]">
                  Image Ratio
                  <select
                    value={showcaseImageRatio}
                    onChange={(event) => setShowcaseImageRatio(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="square">Square</option>
                    <option value="landscape">Landscape</option>
                    <option value="editorial">Editorial</option>
                  </select>
                </label>

                <label className="text-[11px]">
                  Desktop Columns
                  <select
                    value={showcaseDesktopColumns}
                    onChange={(event) => setShowcaseDesktopColumns(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5"
                  >
                    {[2, 3, 4, 5, 6].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>

                <div className="rounded-md border border-[#A97838]/35 bg-[#A97838]/[0.05] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D3AD79]">
                    Responsive Master
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-gray-500">
                    Set desktop density once. Tablet and mobile automatically reflow to readable product cards.
                  </p>
                </div>

                <label className="text-[11px]">
                  Section Width
                  <select
                    value={showcaseWidth}
                    onChange={(event) => setShowcaseWidth(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-[#1b1b1f] px-3 py-2.5"
                  >
                    <option value="contained">Contained</option>
                    <option value="wide">Wide</option>
                    <option value="full">Full Width</option>
                  </select>
                </label>

                <label className="text-[11px]">
                  Background
                  <div className="mt-2 flex h-[42px] items-center gap-3 border border-gray-700 px-3">
                    <input
                      type="color"
                      value={showcaseBackground}
                      onChange={(event) => setShowcaseBackground(event.target.value.toUpperCase())}
                      className="h-6 w-8 cursor-pointer bg-transparent"
                    />
                    <span className="text-[10px] text-gray-500">{showcaseBackground}</span>
                  </div>
                </label>
              </div>
            </div>

            <details className="mt-6 border-t border-gray-800 pt-5">
              <summary className="cursor-pointer text-[11px] font-medium">
                Advanced layout settings
              </summary>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-[11px]">
                  Top Spacing
                  <input
                    type="number"
                    value={showcaseTopSpacing}
                    onChange={(event) => setShowcaseTopSpacing(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-transparent px-3 py-2"
                  />
                </label>
                <label className="text-[11px]">
                  Bottom Spacing
                  <input
                    type="number"
                    value={showcaseBottomSpacing}
                    onChange={(event) => setShowcaseBottomSpacing(event.target.value)}
                    className="mt-2 w-full border border-gray-700 bg-transparent px-3 py-2"
                  />
                </label>
              </div>
            </details>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Show Price", showcaseShowPrice, setShowcaseShowPrice],
                ["Show Badge", showcaseShowBadge, setShowcaseShowBadge],
                ["Show Color Swatches", showcaseShowSwatches, setShowcaseShowSwatches],
                ["Show Quick Add", showcaseShowQuickAdd, setShowcaseShowQuickAdd],
                ["Desktop Visible", showcaseDesktopVisible, setShowcaseDesktopVisible],
                ["Mobile Visible", showcaseMobileVisible, setShowcaseMobileVisible],
              ].map(([label, checked, setter]) => (
                <label
                  key={String(label)}
                  className="flex cursor-pointer items-center gap-3 border border-gray-800 px-4 py-3 text-[11px]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checked)}
                    onChange={(event) =>
                      (setter as (value: boolean) => void)(event.target.checked)
                    }
                  />
                  {String(label)}
                </label>
              ))}
            </div>
          </div>
        )}


        {type === "editorial_split" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div>
              <h3 className="text-lg font-semibold">Editorial Split Settings</h3>
              <p className="mt-1 text-sm text-gray-400">
                Dynamic image + content section with reusable fonts, colors and CTA styles.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Desktop Layout", editorialLayout, setEditorialLayout, [["image-left","Image Left / Text Right"],["image-right","Text Left / Image Right"]]],
                ["Section Width", editorialWidth, setEditorialWidth, [["full","Full Width"],["wide","Wide"],["contained","Contained"]]],
                ["Content Align", editorialContentAlign, setEditorialContentAlign, [["left","Left"],["center","Center"],["right","Right"]]],
                ["Vertical Position", editorialContentVertical, setEditorialContentVertical, [["top","Top"],["center","Center"],["bottom","Bottom"]]],
                ["Mobile Order", editorialMobileOrder, setEditorialMobileOrder, [["image-first","Image First"],["content-first","Content First"]]],
                ["Image Fit", editorialImageFit, setEditorialImageFit, [["cover","Cover"],["contain","Contain"]]],
                ["Image Position", editorialImagePosition, setEditorialImagePosition, [["center","Center"],["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"]]],
              ].map(([label, value, setter, options]) => (
                <label key={label as string} className="text-sm">
                  {label as string}
                  <select
                    value={value as string}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    {(options as string[][]).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
              ))}

              <label className="text-sm">
                Desktop Min Height
                <input type="number" min="300" max="1200" value={editorialMinHeight}
                  onChange={(e) => setEditorialMinHeight(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Image / Media</h4>
                <label
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
                  onDrop={(e) => {
                    e.preventDefault()
                    uploadEditorialImage(Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/")))
                  }}
                  className="mt-4 flex min-h-[230px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-4 text-center hover:border-gray-400"
                >
                  {editorialImageUrl ? (
                    <>
                      <img src={editorialImageUrl} alt="" className="h-44 w-full rounded-lg object-cover" />
                      <span className="mt-3 text-xs">{uploadingEditorialImage ? "Uploading..." : "Drop another image to replace or click to browse"}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{uploadingEditorialImage ? "Uploading..." : "Drag & drop image here"}</span>
                      <span className="mt-1 text-xs text-gray-500">or click to browse</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingEditorialImage}
                    onChange={(e) => { uploadEditorialImage(e.target.files?.[0]); e.target.value = "" }} />
                </label>
                {editorialImageUrl && <button type="button" onClick={() => setEditorialImageUrl("")} className="mt-3 text-xs text-red-400 underline">Remove image</button>}
                <label className="mt-4 block text-sm">Image Alt Text
                  <input value={editorialImageAlt} onChange={(e) => setEditorialImageAlt(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
              </div>

              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Content</h4>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm">Eyebrow / Small Heading
                    <input value={editorialEyebrow} onChange={(e) => setEditorialEyebrow(e.target.value)} placeholder="New Collection"
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                  <label className="block text-sm">Main Heading
                    <textarea value={editorialHeading} onChange={(e) => setEditorialHeading(e.target.value)} rows={2}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                  <label className="block text-sm">Description
                    <textarea value={editorialBody} onChange={(e) => setEditorialBody(e.target.value)} rows={4}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm">Button Text
                      <input value={editorialButtonText} onChange={(e) => setEditorialButtonText(e.target.value)}
                        className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                    </label>
                    <label className="text-sm">Button URL
                      <input value={editorialButtonUrl} onChange={(e) => setEditorialButtonUrl(e.target.value)} placeholder="/collections/new"
                        className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Typography</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Heading Font", editorialHeadingFont, setEditorialHeadingFont],
                  ["Body Font", editorialBodyFont, setEditorialBodyFont],
                  ["Button Font", editorialButtonFont, setEditorialButtonFont],
                ].map(([label,value,setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <select value={value as string} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                      {EDITORIAL_FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                    </select>
                  </label>
                ))}
                <label className="text-sm">Heading Weight
                  <select value={editorialHeadingWeight} onChange={(e) => setEditorialHeadingWeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                    <option value="300">Light 300</option><option value="400">Regular 400</option><option value="500">Medium 500</option><option value="600">Semi Bold 600</option><option value="700">Bold 700</option>
                  </select>
                </label>
                {[
                  ["Desktop Heading Size", editorialHeadingSize, setEditorialHeadingSize],
                  ["Mobile Heading Size", editorialHeadingMobileSize, setEditorialHeadingMobileSize],
                  ["Body Size", editorialBodySize, setEditorialBodySize],
                  ["Button Size", editorialButtonSize, setEditorialButtonSize],
                ].map(([label,value,setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <input type="number" value={value as string} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Reusable Color Library</h4>
              <p className="mt-1 text-xs text-gray-500">Many colors are built in. Save a custom HEX once; it stays available for future Editorial Split sections in this admin browser. Hover a custom swatch to remove it.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...DEFAULT_EDITORIAL_COLORS, ...editorialCustomColors].map((color) => (
                  <div key={color} className="group relative">
                    <button type="button" title={color} onClick={() => setEditorialTextColor(color)}
                      className="h-8 w-8 rounded-full border border-gray-600" style={{ backgroundColor: color }} />
                    {editorialCustomColors.includes(color) && (
                      <button type="button" onClick={() => removeEditorialColor(color)}
                        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white group-hover:flex">×</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Section Background", editorialBackground, setEditorialBackground],
                  ["Main Text", editorialTextColor, setEditorialTextColor],
                  ["Eyebrow", editorialEyebrowColor, setEditorialEyebrowColor],
                  ["Button Background", editorialButtonBg, setEditorialButtonBg],
                  ["Button Text", editorialButtonColor, setEditorialButtonColor],
                  ["Button Border", editorialButtonBorder, setEditorialButtonBorder],
                ].map(([label,value,setter]) => (
                  <div key={label as string} className="rounded-lg border border-gray-700 p-3">
                    <label className="text-sm">{label as string}</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="h-9 w-12 rounded border border-gray-600 bg-transparent" />
                      <input value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs" />
                      <button type="button" onClick={() => saveEditorialColor(value as string)}
                        className="rounded-md border border-gray-600 px-2 text-[10px]">Save</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {[...DEFAULT_EDITORIAL_COLORS.slice(0, 18), ...editorialCustomColors].map((color) => (
                        <button key={`${label}-${color}`} type="button" title={color}
                          onClick={() => (setter as React.Dispatch<React.SetStateAction<string>>)(color)}
                          className="h-5 w-5 rounded-full border border-gray-600" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Button & Spacing</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Button Style
                  <select value={editorialButtonStyle} onChange={(e) => setEditorialButtonStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                    <option value="filled">Filled Box</option><option value="outline">Outline Box</option><option value="underline">Underline</option><option value="text">Text Only</option>
                  </select>
                </label>
                {[
                  ["Button Radius", editorialButtonRadius, setEditorialButtonRadius],
                  ["Button Padding X", editorialButtonPaddingX, setEditorialButtonPaddingX],
                  ["Button Padding Y", editorialButtonPaddingY, setEditorialButtonPaddingY],
                  ["Content Padding", editorialContentPadding, setEditorialContentPadding],
                  ["Top Spacing", editorialTopSpacing, setEditorialTopSpacing],
                  ["Bottom Spacing", editorialBottomSpacing, setEditorialBottomSpacing],
                ].map(([label,value,setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <input type="number" min="0" value={value as string}
                      onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                ))}
                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input type="checkbox" checked={editorialDesktopVisible} onChange={(e) => setEditorialDesktopVisible(e.target.checked)} /> Desktop Visible
                </label>
                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input type="checkbox" checked={editorialMobileVisible} onChange={(e) => setEditorialMobileVisible(e.target.checked)} /> Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}



        {type === "spacer" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div>
              <h3 className="text-lg font-semibold">Spacer / Divider Settings</h3>
              <p className="mt-1 text-sm text-gray-400">
                Control vertical breathing room or add a styled divider between homepage sections.
              </p>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Spacing & Width</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Desktop Height
                  <input type="number" min="0" value={spacerHeight}
                    onChange={(e) => setSpacerHeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Mobile Height
                  <input type="number" min="0" value={spacerMobileHeight}
                    onChange={(e) => setSpacerMobileHeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Top Spacing
                  <input type="number" min="0" value={spacerTopSpacing}
                    onChange={(e) => setSpacerTopSpacing(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Bottom Spacing
                  <input type="number" min="0" value={spacerBottomSpacing}
                    onChange={(e) => setSpacerBottomSpacing(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Section Width
                  <select value={spacerWidth} onChange={(e) => setSpacerWidth(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="contained">Contained</option>
                    <option value="wide">Wide</option>
                    <option value="full">Full</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-medium">Divider</h4>
                  <p className="mt-1 text-xs text-gray-400">Optional line centered inside the spacer.</p>
                </div>
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={spacerShowDivider}
                    onChange={(e) => setSpacerShowDivider(e.target.checked)} />
                  Show Divider
                </label>
              </div>

              {spacerShowDivider && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-sm">Thickness (px)
                    <input type="number" min="1" value={spacerDividerThickness}
                      onChange={(e) => setSpacerDividerThickness(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                  <label className="text-sm">Divider Width (%)
                    <input type="number" min="1" max="100" value={spacerDividerWidth}
                      onChange={(e) => setSpacerDividerWidth(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                  <label className="text-sm">Style
                    <select value={spacerDividerStyle} onChange={(e) => setSpacerDividerStyle(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </label>
                  <label className="text-sm">Divider Color
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={spacerDividerColor}
                        onChange={(e) => setSpacerDividerColor(e.target.value.toUpperCase())}
                        className="h-10 w-12 rounded border border-gray-600 bg-transparent" />
                      <input value={spacerDividerColor}
                        onChange={(e) => setSpacerDividerColor(e.target.value.toUpperCase())}
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs" />
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Appearance & Visibility</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm">Background
                  <div className="mt-2 flex gap-2">
                    <input type="color" value={spacerBackground}
                      onChange={(e) => setSpacerBackground(e.target.value.toUpperCase())}
                      className="h-10 w-12 rounded border border-gray-600 bg-transparent" />
                    <input value={spacerBackground}
                      onChange={(e) => setSpacerBackground(e.target.value.toUpperCase())}
                      className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs" />
                  </div>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={spacerDesktopVisible}
                    onChange={(e) => setSpacerDesktopVisible(e.target.checked)} />
                  Desktop Visible
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={spacerMobileVisible}
                    onChange={(e) => setSpacerMobileVisible(e.target.checked)} />
                  Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "editorial_text" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div>
              <h3 className="text-lg font-semibold">Editorial Text Settings</h3>
              <p className="mt-1 text-sm text-gray-400">Brand story, manifesto, campaign copy, quote or editorial introduction.</p>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Content</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm md:col-span-2">Eyebrow
                  <input value={editorialTextEyebrow} onChange={(e) => setEditorialTextEyebrow(e.target.value)}
                    placeholder="Our Story" className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm md:col-span-2">Heading
                  <textarea value={editorialTextHeading} onChange={(e) => setEditorialTextHeading(e.target.value)}
                    rows={2} className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm md:col-span-2">Body
                  <textarea value={editorialTextBody} onChange={(e) => setEditorialTextBody(e.target.value)}
                    rows={6} className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm md:col-span-2">Quote (optional)
                  <textarea value={editorialTextQuote} onChange={(e) => setEditorialTextQuote(e.target.value)}
                    rows={3} className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Button Text
                  <input value={editorialTextButtonText} onChange={(e) => setEditorialTextButtonText(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Button URL
                  <input value={editorialTextButtonUrl} onChange={(e) => setEditorialTextButtonUrl(e.target.value)}
                    placeholder="/about" className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Layout & Typography</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Alignment
                  <select value={editorialTextAlign} onChange={(e) => setEditorialTextAlign(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                  </select>
                </label>
                <label className="text-sm">Section Width
                  <select value={editorialTextWidth} onChange={(e) => setEditorialTextWidth(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="contained">Contained</option><option value="wide">Wide</option><option value="full">Full</option>
                  </select>
                </label>
                <label className="text-sm">Heading Font
                  <select value={editorialTextHeadingFont} onChange={(e) => setEditorialTextHeadingFont(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    {EDITORIAL_FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">Body Font
                  <select value={editorialTextBodyFont} onChange={(e) => setEditorialTextBodyFont(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    {EDITORIAL_FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                  </select>
                </label>
                {[
                  ["Content Max Width", editorialTextMaxWidth, setEditorialTextMaxWidth],
                  ["Heading Size", editorialTextHeadingSize, setEditorialTextHeadingSize],
                  ["Mobile Heading Size", editorialTextMobileHeadingSize, setEditorialTextMobileHeadingSize],
                  ["Body Size", editorialTextBodySize, setEditorialTextBodySize],
                  ["Quote Size", editorialTextQuoteSize, setEditorialTextQuoteSize],
                  ["Top Spacing", editorialTextTopSpacing, setEditorialTextTopSpacing],
                  ["Bottom Spacing", editorialTextBottomSpacing, setEditorialTextBottomSpacing],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <input type="number" min="0" value={value as string}
                      onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                ))}
                <label className="text-sm">Heading Weight
                  <select value={editorialTextHeadingWeight} onChange={(e) => setEditorialTextHeadingWeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="300">300</option><option value="400">400</option><option value="500">500</option>
                    <option value="600">600</option><option value="700">700</option>
                  </select>
                </label>
                <label className="text-sm">Button Style
                  <select value={editorialTextButtonStyle} onChange={(e) => setEditorialTextButtonStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="underline">Underline</option><option value="filled">Filled</option>
                    <option value="outline">Outline</option><option value="text">Text</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Colors & Visibility</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Background", editorialTextBackground, setEditorialTextBackground],
                  ["Text", editorialTextMainColor, setEditorialTextMainColor],
                  ["Accent", editorialTextAccentColor, setEditorialTextAccentColor],
                  ["Button BG", editorialTextButtonBg, setEditorialTextButtonBg],
                  ["Button Text", editorialTextButtonColor, setEditorialTextButtonColor],
                  ["Button Border", editorialTextButtonBorder, setEditorialTextButtonBorder],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="h-10 w-12 rounded border border-gray-600 bg-transparent" />
                      <input value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs" />
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={editorialTextDesktopVisible}
                    onChange={(e) => setEditorialTextDesktopVisible(e.target.checked)} /> Desktop Visible
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={editorialTextMobileVisible}
                    onChange={(e) => setEditorialTextMobileVisible(e.target.checked)} /> Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "video_story" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div>
              <h3 className="text-lg font-semibold">Video Story Settings</h3>
              <p className="mt-1 text-sm text-gray-400">
                Full-width editorial video with poster, overlay content and CTA.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {[
                ["video", "Video", videoStoryVideoUrl],
                ["poster", "Poster / Cover Image", videoStoryPosterUrl],
              ].map(([kind, label, url]) => (
                <div key={kind} className="rounded-xl border border-gray-700 p-4">
                  <h4 className="font-medium">{label}</h4>
                  <label
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
                    onDrop={(e) => {
                      e.preventDefault()
                      uploadVideoStoryFile(kind as "video" | "poster", Array.from(e.dataTransfer.files)[0])
                    }}
                    className="mt-4 flex min-h-[220px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-4 text-center"
                  >
                    {url ? (
                      kind === "video"
                        ? <video src={url} muted playsInline className="h-48 w-full rounded-lg object-cover" />
                        : <img src={url} alt="" className="h-48 w-full rounded-lg object-cover" />
                    ) : (
                      <span className="text-sm text-gray-400">
                        {uploadingVideoStory === kind ? "Uploading..." : `Drag & drop ${label.toLowerCase()} or click`}
                      </span>
                    )}
                    <input
                      type="file"
                      accept={kind === "video" ? "video/*" : "image/*"}
                      className="hidden"
                      onChange={(e) => {
                        uploadVideoStoryFile(kind as "video" | "poster", e.target.files?.[0])
                        e.target.value = ""
                      }}
                    />
                  </label>
                  {url && (
                    <button type="button"
                      onClick={() => kind === "video" ? setVideoStoryVideoUrl("") : setVideoStoryPosterUrl("")}
                      className="mt-3 text-xs text-red-400 underline">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Content</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm md:col-span-2">Heading
                  <input value={videoStoryHeading} onChange={(e) => setVideoStoryHeading(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm md:col-span-2">Subtitle
                  <textarea value={videoStorySubtitle} onChange={(e) => setVideoStorySubtitle(e.target.value)}
                    rows={3} className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Button Text
                  <input value={videoStoryButtonText} onChange={(e) => setVideoStoryButtonText(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Button URL
                  <input value={videoStoryButtonUrl} onChange={(e) => setVideoStoryButtonUrl(e.target.value)}
                    placeholder="/collections/new"
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Video & Layout</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Width
                  <select value={videoStoryWidth} onChange={(e) => setVideoStoryWidth(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="full">Full</option><option value="wide">Wide</option><option value="contained">Contained</option>
                  </select>
                </label>
                <label className="text-sm">Object Position
                  <select value={videoStoryObjectPosition} onChange={(e) => setVideoStoryObjectPosition(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option>
                    <option value="left">Left</option><option value="right">Right</option>
                  </select>
                </label>
                <label className="text-sm">Content Align
                  <select value={videoStoryContentAlign} onChange={(e) => setVideoStoryContentAlign(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                  </select>
                </label>
                <label className="text-sm">Content Vertical
                  <select value={videoStoryContentVertical} onChange={(e) => setVideoStoryContentVertical(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
                  </select>
                </label>
                {[
                  ["Desktop Height", videoStoryDesktopHeight, setVideoStoryDesktopHeight],
                  ["Mobile Height", videoStoryMobileHeight, setVideoStoryMobileHeight],
                  ["Overlay %", videoStoryOverlayOpacity, setVideoStoryOverlayOpacity],
                  ["Top Spacing", videoStoryTopSpacing, setVideoStoryTopSpacing],
                  ["Bottom Spacing", videoStoryBottomSpacing, setVideoStoryBottomSpacing],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <input type="number" min="0" value={value as string}
                      onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  ["Autoplay", videoStoryAutoplay, setVideoStoryAutoplay],
                  ["Muted", videoStoryMuted, setVideoStoryMuted],
                  ["Loop", videoStoryLoop, setVideoStoryLoop],
                  ["Show Controls", videoStoryControls, setVideoStoryControls],
                ].map(([label, checked, setter]) => (
                  <label key={label as string} className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                    <input type="checkbox" checked={checked as boolean}
                      onChange={(e) => (setter as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)} />
                    {label as string}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Typography & Colors</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Heading Font
                  <select value={videoStoryHeadingFont} onChange={(e) => setVideoStoryHeadingFont(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    {EDITORIAL_FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">Body Font
                  <select value={videoStoryBodyFont} onChange={(e) => setVideoStoryBodyFont(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    {EDITORIAL_FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                  </select>
                </label>
                {[
                  ["Heading Size", videoStoryHeadingSize, setVideoStoryHeadingSize],
                  ["Mobile Heading Size", videoStoryMobileHeadingSize, setVideoStoryMobileHeadingSize],
                  ["Subtitle Size", videoStorySubtitleSize, setVideoStorySubtitleSize],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <input type="number" value={value as string}
                      onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                ))}
                <label className="text-sm">Button Style
                  <select value={videoStoryButtonStyle} onChange={(e) => setVideoStoryButtonStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="filled">Filled</option><option value="outline">Outline</option>
                    <option value="underline">Underline</option><option value="text">Text</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Overlay", videoStoryOverlayColor, setVideoStoryOverlayColor],
                  ["Text", videoStoryTextColor, setVideoStoryTextColor],
                  ["Button BG", videoStoryButtonBg, setVideoStoryButtonBg],
                  ["Button Text", videoStoryButtonColor, setVideoStoryButtonColor],
                  ["Button Border", videoStoryButtonBorder, setVideoStoryButtonBorder],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="h-10 w-12 rounded border border-gray-600 bg-transparent" />
                      <input value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs" />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={videoStoryDesktopVisible}
                    onChange={(e) => setVideoStoryDesktopVisible(e.target.checked)} /> Desktop Visible
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={videoStoryMobileVisible}
                    onChange={(e) => setVideoStoryMobileVisible(e.target.checked)} /> Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "marquee" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div>
              <h3 className="text-lg font-semibold">Marquee Settings</h3>
              <p className="mt-1 text-sm text-gray-400">
                Create a continuously moving announcement or editorial text strip.
              </p>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium">Messages</h4>
                <button
                  type="button"
                  onClick={() => setMarqueeItems((items) => [...items, ""])}
                  className="rounded-md border border-gray-600 px-3 py-2 text-sm"
                >
                  + Add Message
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {marqueeItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={item}
                      onChange={(e) =>
                        setMarqueeItems((items) =>
                          items.map((value, i) => i === index ? e.target.value : value)
                        )
                      }
                      placeholder={`Message ${index + 1}`}
                      className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setMarqueeItems((items) => {
                          const next = [...items]
                          ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                          return next
                        })
                      }
                      className="rounded border border-gray-700 px-2 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === marqueeItems.length - 1}
                      onClick={() =>
                        setMarqueeItems((items) => {
                          const next = [...items]
                          ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                          return next
                        })
                      }
                      className="rounded border border-gray-700 px-2 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMarqueeItems((items) => items.filter((_, i) => i !== index))
                      }
                      className="rounded border border-red-900 px-3 text-xs text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Motion & Layout</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    Speed (seconds)
                    <input
                      type="number"
                      min="5"
                      value={marqueeSpeed}
                      onChange={(e) => setMarqueeSpeed(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Direction
                    <select
                      value={marqueeDirection}
                      onChange={(e) => setMarqueeDirection(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="left">Right → Left</option>
                      <option value="right">Left → Right</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Separator
                    <input
                      value={marqueeSeparator}
                      onChange={(e) => setMarqueeSeparator(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Item Gap
                    <input
                      type="number"
                      min="0"
                      value={marqueeItemGap}
                      onChange={(e) => setMarqueeItemGap(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  {[
                    ["Vertical Padding", marqueePaddingY, setMarqueePaddingY],
                    ["Top Spacing", marqueeTopSpacing, setMarqueeTopSpacing],
                    ["Bottom Spacing", marqueeBottomSpacing, setMarqueeBottomSpacing],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="text-sm">
                      {label as string}
                      <input
                        type="number"
                        min="0"
                        value={value as string}
                        onChange={(e) =>
                          (setter as React.Dispatch<React.SetStateAction<string>>)(
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                      />
                    </label>
                  ))}

                  <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={marqueePauseOnHover}
                      onChange={(e) => setMarqueePauseOnHover(e.target.checked)}
                    />
                    Pause on Hover
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Typography</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm md:col-span-2">
                    Font
                    <select
                      value={marqueeFont}
                      onChange={(e) => setMarqueeFont(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      {EDITORIAL_FONT_OPTIONS.map((font) => (
                        <option key={font.label} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm">
                    Desktop Size
                    <input
                      type="number"
                      min="8"
                      value={marqueeFontSize}
                      onChange={(e) => setMarqueeFontSize(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Mobile Size
                    <input
                      type="number"
                      min="8"
                      value={marqueeMobileFontSize}
                      onChange={(e) => setMarqueeMobileFontSize(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Weight
                    <select
                      value={marqueeFontWeight}
                      onChange={(e) => setMarqueeFontWeight(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="300">Light 300</option>
                      <option value="400">Regular 400</option>
                      <option value="500">Medium 500</option>
                      <option value="600">Semi Bold 600</option>
                      <option value="700">Bold 700</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Letter Spacing
                    <input
                      type="number"
                      step="0.5"
                      value={marqueeLetterSpacing}
                      onChange={(e) => setMarqueeLetterSpacing(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm md:col-span-2">
                    Text Transform
                    <select
                      value={marqueeTextTransform}
                      onChange={(e) => setMarqueeTextTransform(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="none">Normal</option>
                      <option value="uppercase">UPPERCASE</option>
                      <option value="lowercase">lowercase</option>
                      <option value="capitalize">Capitalize</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Colors & Visibility</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  ["Background", marqueeBackground, setMarqueeBackground],
                  ["Text", marqueeTextColor, setMarqueeTextColor],
                  ["Separator", marqueeSeparatorColor, setMarqueeSeparatorColor],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <div className="mt-2 flex gap-2">
                      <input
                        type="color"
                        value={value as string}
                        onChange={(e) =>
                          (setter as React.Dispatch<React.SetStateAction<string>>)(
                            e.target.value.toUpperCase()
                          )
                        }
                        className="h-10 w-12 rounded border border-gray-600 bg-transparent"
                      />
                      <input
                        value={value as string}
                        onChange={(e) =>
                          (setter as React.Dispatch<React.SetStateAction<string>>)(
                            e.target.value.toUpperCase()
                          )
                        }
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs"
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={marqueeDesktopVisible}
                    onChange={(e) => setMarqueeDesktopVisible(e.target.checked)}
                  />
                  Desktop Visible
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={marqueeMobileVisible}
                    onChange={(e) => setMarqueeMobileVisible(e.target.checked)}
                  />
                  Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "category_showcase" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Category Showcase Settings</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Build visual shop cards in one horizontal row. Recommended: 4 visible on large desktop; card width follows one continuous fluid curve as the browser narrows, so mobile never jumps back to a larger card.
                </p>
              </div>
              <button type="button"
                onClick={() => setCategoryItems((items) => [...items, createCategoryItem()])}
                className="rounded-md border border-gray-600 px-3 py-2 text-sm">
                + Add Category
              </button>
            </div>

            <div className="space-y-4">
              {categoryItems.map((item, index) => {
                const selectedCategoryId =
                  item.category_id ||
                  getLegacyCategoryIdFromLink(
                    item.link_url
                  )

                const selectedCollectionHandle =
                  item.collection_handle ||
                  getLegacyCollectionHandleFromLink(
                    item.link_url
                  )

                return (
                  <div key={item.id} className="rounded-xl border border-gray-700 bg-[#17171a] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Card {index + 1}</p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          Choose a real destination first, then style the card.
                        </p>
                      </div>

                      <div className="flex gap-3 text-xs">
                        <button type="button" disabled={index === 0}
                          onClick={() => setCategoryItems((items) => {
                            const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next
                          })}>↑</button>
                        <button type="button" disabled={index === categoryItems.length - 1}
                          onClick={() => setCategoryItems((items) => {
                            const next = [...items]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next
                          })}>↓</button>
                        <button type="button"
                          onClick={() => setCategoryItems((items) => items.filter((x) => x.id !== item.id))}
                          className="text-red-400">Remove</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
                      <div className="space-y-3">
                        <label
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = "copy"
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            uploadCategoryImage(
                              item.id,
                              Array.from(e.dataTransfer.files).find(
                                (f) => f.type.startsWith("image/")
                              )
                            )
                          }}
                          className="block cursor-pointer"
                        >
                          <div
                            className="relative w-full overflow-hidden rounded-lg border border-dashed border-gray-600 bg-[#EEE9E1]"
                            style={{
                              aspectRatio:
                                categoryImageRatio === "square"
                                  ? "1 / 1"
                                  : categoryImageRatio === "landscape"
                                    ? "4 / 3"
                                    : categoryImageRatio === "editorial"
                                      ? "4 / 5"
                                      : "2 / 3",
                            }}
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt=""
                                draggable={false}
                                className="absolute inset-0 h-full w-full"
                                style={{
                                  objectFit: item.image_fit,
                                  objectPosition:
                                    `${item.image_position_x}% ${item.image_position_y}%`,
                                  transform:
                                    item.image_fit === "cover"
                                      ? `scale(${item.image_zoom})`
                                      : "scale(1)",
                                  transformOrigin:
                                    `${item.image_position_x}% ${item.image_position_y}%`,
                                }}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-gray-400">
                                {uploadingCategoryId === item.id
                                  ? "Uploading..."
                                  : "Drag & drop image\nor click to browse"}
                              </div>
                            )}

                            {item.image_url && (
                              <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-white">
                                {item.image_fit === "contain"
                                  ? "FULL IMAGE"
                                  : "CROP PREVIEW"}
                              </div>
                            )}
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              uploadCategoryImage(
                                item.id,
                                e.target.files?.[0]
                              )
                              e.target.value = ""
                            }}
                          />
                        </label>

                        <div className="rounded-lg border border-gray-700 bg-[#111114] p-3">
                          <label className="text-xs">
                            Image Fit
                            <select
                              value={item.image_fit}
                              onChange={(e) =>
                                updateCategoryItem(
                                  item.id,
                                  {
                                    image_fit:
                                      e.target.value === "contain"
                                        ? "contain"
                                        : "cover",
                                    image_zoom:
                                      e.target.value === "contain"
                                        ? 1
                                        : item.image_zoom,
                                  }
                                )
                              }
                              className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                            >
                              <option value="cover">
                                Fill Card — crop allowed
                              </option>
                              <option value="contain">
                                Show Full Image — no crop
                              </option>
                            </select>
                          </label>

                          {item.image_fit === "cover" && (
                            <div className="mt-4 space-y-4">
                              <label className="block text-[11px] text-gray-300">
                                Horizontal Focus — {Math.round(item.image_position_x)}%
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={item.image_position_x}
                                  onChange={(e) =>
                                    updateCategoryItem(
                                      item.id,
                                      {
                                        image_position_x:
                                          Number(e.target.value),
                                      }
                                    )
                                  }
                                  className="mt-2 w-full"
                                />
                              </label>

                              <label className="block text-[11px] text-gray-300">
                                Vertical Focus — {Math.round(item.image_position_y)}%
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={item.image_position_y}
                                  onChange={(e) =>
                                    updateCategoryItem(
                                      item.id,
                                      {
                                        image_position_y:
                                          Number(e.target.value),
                                      }
                                    )
                                  }
                                  className="mt-2 w-full"
                                />
                              </label>

                              <label className="block text-[11px] text-gray-300">
                                Zoom — {item.image_zoom.toFixed(2)}×
                                <input
                                  type="range"
                                  min="1"
                                  max="1.8"
                                  step="0.05"
                                  value={item.image_zoom}
                                  onChange={(e) =>
                                    updateCategoryItem(
                                      item.id,
                                      {
                                        image_zoom:
                                          Number(e.target.value),
                                      }
                                    )
                                  }
                                  className="mt-2 w-full"
                                />
                              </label>

                              <div className="flex flex-wrap gap-2">
                                {[
                                  ["Top", 50, 0],
                                  ["Center", 50, 50],
                                  ["Bottom", 50, 100],
                                  ["Left", 0, 50],
                                  ["Right", 100, 50],
                                ].map(([label, x, y]) => (
                                  <button
                                    key={String(label)}
                                    type="button"
                                    onClick={() =>
                                      updateCategoryItem(
                                        item.id,
                                        {
                                          image_position_x: Number(x),
                                          image_position_y: Number(y),
                                        }
                                      )
                                    }
                                    className="rounded border border-gray-700 px-2 py-1 text-[10px] text-gray-300 hover:border-gray-500"
                                  >
                                    {label}
                                  </button>
                                ))}

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCategoryItem(
                                      item.id,
                                      {
                                        image_position_x: 50,
                                        image_position_y: 50,
                                        image_zoom: 1,
                                      }
                                    )
                                  }
                                  className="rounded border border-[#A97838]/50 px-2 py-1 text-[10px] text-[#D3AD79]"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          )}

                          {item.image_fit === "contain" && (
                            <p className="mt-3 text-[10px] leading-4 text-gray-500">
                              The complete source image will be visible. Any unused
                              space keeps the Category card background instead of
                              cropping the image.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg border border-gray-700 bg-[#111114] p-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="text-sm">
                              Destination Type
                              <select
                                value={item.destination_type}
                                onChange={(e) =>
                                  setCategoryShowcaseDestinationType(
                                    item,
                                    e.target.value as CategoryShowcaseDestinationType
                                  )
                                }
                                className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2"
                              >
                                <option value="category">Category</option>
                                <option value="collection">Collection</option>
                                <option value="custom">Custom Link</option>
                              </select>
                            </label>

                            {item.destination_type === "category" && (
                              <label className="text-sm">
                                Category
                                <select
                                  value={selectedCategoryId}
                                  onChange={(e) =>
                                    setCategoryShowcaseCategory(
                                      item,
                                      e.target.value
                                    )
                                  }
                                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2"
                                >
                                  <option value="">
                                    {categoriesLoading
                                      ? "Loading categories..."
                                      : "Select category"}
                                  </option>

                                  {categories.map((category) => (
                                    <option
                                      key={category.id}
                                      value={category.id}
                                    >
                                      {getCategoryLabelPath(category.id) || category.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                            {item.destination_type === "collection" && (
                              <label className="text-sm">
                                Collection
                                <select
                                  value={selectedCollectionHandle}
                                  onChange={(e) =>
                                    setCategoryShowcaseCollection(
                                      item,
                                      e.target.value
                                    )
                                  }
                                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2"
                                >
                                  <option value="">
                                    {collectionsLoading
                                      ? "Loading collections..."
                                      : "Select collection"}
                                  </option>

                                  {collections.map((collection) => (
                                    <option
                                      key={collection.id}
                                      value={collection.handle}
                                    >
                                      {collection.title}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                            {item.destination_type === "custom" && (
                              <label className="text-sm">
                                Custom Link
                                <input
                                  value={item.link_url}
                                  placeholder="/pages/editorial"
                                  onChange={(e) =>
                                    updateCategoryItem(
                                      item.id,
                                      {
                                        link_url: e.target.value,
                                      }
                                    )
                                  }
                                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                                />
                              </label>
                            )}
                          </div>

                          {item.destination_type !== "custom" && (
                            <div className="mt-3 rounded-md border border-gray-800 bg-[#0d0d0f] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.08em] text-gray-500">
                                Resolved Link
                              </p>
                              <p className="mt-1 break-all text-xs text-gray-300">
                                {item.link_url || "Choose a destination"}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {[
                            ["Title", "title", item.title, "Women"],
                            ["Subtitle", "subtitle", item.subtitle, "Explore the edit"],
                            ["Button Text", "button_text", item.button_text, "Shop Now"],
                            ["Image Alt", "image_alt", item.image_alt, "Women collection"],
                          ].map(([label, key, value, placeholder]) => (
                            <label key={key} className="text-sm">
                              {label}
                              <input value={value}
                                placeholder={placeholder}
                                onChange={(e) => updateCategoryItem(item.id, { [key]: e.target.value })}
                                className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Layout & Style</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Desktop Columns
                  <select value={categoryDesktopColumns} onChange={(e) => setCategoryDesktopColumns(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    {[2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <div className="rounded-md border border-[#A97838]/35 bg-[#A97838]/[0.05] px-3 py-2.5">
                  <p className="text-xs font-medium text-[#D3AD79]">
                    Responsive Master
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-gray-500">
                    Desktop columns are the master. Tablet becomes 2 cards; mobile becomes a swipe carousel automatically.
                  </p>
                </div>
                <label className="text-sm">Card Image Ratio
                  <select value={categoryImageRatio} onChange={(e) => setCategoryImageRatio(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="portrait">Fashion Portrait — 2:3</option>
                    <option value="square">Square — 1:1</option>
                    <option value="landscape">Landscape — 4:3</option>
                    <option value="editorial">Editorial Tall — 4:5</option>
                  </select>
                  <span className="mt-1 block text-[10px] leading-4 text-gray-500">
                    Fashion Portrait 2:3 is the recommended SAFAFI homepage size. Each card can independently Fill/Crop or Show Full Image.
                  </span>
                </label>
                <label className="text-sm">Width
                  <select value={categoryWidth} onChange={(e) => setCategoryWidth(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="full">Full</option><option value="wide">Wide</option><option value="contained">Contained</option>
                  </select>
                </label>
                <label className="text-sm">Text Position
                  <select value={categoryTextPosition} onChange={(e) => setCategoryTextPosition(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2">
                    <option value="top-left">Top Left</option><option value="top-center">Top Center</option>
                    <option value="center">Center</option><option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option><option value="bottom-right">Bottom Right</option>
                  </select>
                </label>
                <div className="rounded-md border border-[#A97838]/35 bg-[#A97838]/[0.05] px-3 py-2.5">
                  <p className="text-xs font-medium text-[#D3AD79]">
                    CTA Style — Campaign Button
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-gray-500">
                    Filled rectangular · 12px uppercase · campaign padding · hover opacity.
                  </p>
                </div>
                {[
                  ["Gap", categoryGap, setCategoryGap], ["Overlay %", categoryOverlayOpacity, setCategoryOverlayOpacity],
                  ["Title Size", categoryTitleSize, setCategoryTitleSize], ["Subtitle Size", categorySubtitleSize, setCategorySubtitleSize],
                  ["Top Spacing", categoryTopSpacing, setCategoryTopSpacing], ["Bottom Spacing", categoryBottomSpacing, setCategoryBottomSpacing],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <input type="number" min="0" value={value as string}
                      onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                  </label>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-[#A97838]/35 bg-[#A97838]/[0.05] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      SAFAFI Brand Colors
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Your brand palette appears first in every Category Showcase color control.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryBackground("#F8F4EC")
                      setCategoryTextColor("#2A211C")
                      setCategoryButtonBg("#2A211C")
                      setCategoryButtonColor("#FFFFFF")
                      setCategoryButtonBorder("#2A211C")
                      setCategoryOverlayOpacity("0")
                    }}
                    className="rounded-md border border-[#A97838]/60 px-3 py-2 text-[11px] font-medium text-[#D3AD79] transition hover:border-[#A97838] hover:bg-[#A97838]/10"
                  >
                    Apply SAFAFI Default
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {SAFAFI_BRAND_COLORS.map((color) => (
                    <div
                      key={color.value}
                      className="flex items-center gap-2 rounded-md border border-gray-700 bg-[#151518] px-2.5 py-2"
                      title={`${color.name} ${color.value}`}
                    >
                      <span
                        className="h-5 w-5 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[11px] text-gray-300">
                        {color.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {color.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Background", categoryBackground, setCategoryBackground],
                  ["Text", categoryTextColor, setCategoryTextColor],
                  ["Button BG", categoryButtonBg, setCategoryButtonBg],
                  ["Button Text", categoryButtonColor, setCategoryButtonColor],
                  ["Button Border", categoryButtonBorder, setCategoryButtonBorder],
                ].map(([label, value, setter]) => {
                  const setColor =
                    setter as React.Dispatch<
                      React.SetStateAction<string>
                    >

                  const currentColor =
                    String(value).toUpperCase()

                  return (
                    <div
                      key={label as string}
                      className="rounded-lg border border-gray-700 bg-[#151518] p-3"
                    >
                      <label className="text-sm">
                        {label as string}
                      </label>

                      <div className="mt-2 flex gap-2">
                        <input
                          type="color"
                          value={value as string}
                          onChange={(e) =>
                            setColor(
                              e.target.value.toUpperCase()
                            )
                          }
                          className="h-10 w-12 rounded border border-gray-600 bg-transparent"
                        />

                        <input
                          value={value as string}
                          onChange={(e) =>
                            setColor(
                              e.target.value.toUpperCase()
                            )
                          }
                          className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs"
                        />
                      </div>

                      <div className="mt-3">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                          SAFAFI Quick Palette
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {SAFAFI_BRAND_COLORS.map((color) => {
                            const selected =
                              currentColor ===
                              color.value.toUpperCase()

                            return (
                              <button
                                key={`${String(label)}-${color.value}`}
                                type="button"
                                title={`${color.name} — ${color.value}`}
                                aria-label={`Set ${String(label)} to ${color.name}`}
                                onClick={() =>
                                  setColor(color.value)
                                }
                                className={`
                                  relative
                                  h-7
                                  w-7
                                  rounded-full
                                  border
                                  transition
                                  hover:scale-110
                                  ${
                                    selected
                                      ? "border-white ring-2 ring-[#A97838] ring-offset-2 ring-offset-[#151518]"
                                      : "border-white/25"
                                  }
                                `}
                                style={{
                                  backgroundColor:
                                    color.value,
                                }}
                              >
                                {selected && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <span
                                      className={`
                                        text-[10px]
                                        font-bold
                                        ${
                                          color.value === "#FFFFFF" ||
                                          color.value === "#F8F4EC"
                                            ? "text-black"
                                            : "text-white"
                                        }
                                      `}
                                    >
                                      ✓
                                    </span>
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={categoryDesktopVisible} onChange={(e) => setCategoryDesktopVisible(e.target.checked)} />
                  Desktop Visible
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm">
                  <input type="checkbox" checked={categoryMobileVisible} onChange={(e) => setCategoryMobileVisible(e.target.checked)} />
                  Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "featured_story" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div>
              <h3 className="text-lg font-semibold">Featured Story Settings</h3>
              <p className="mt-1 text-sm text-gray-400">
                Storytelling section with image/video, overlay or split layout, editorial copy and CTA.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Media</h4>

                <label
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    uploadFeaturedMedia(Array.from(e.dataTransfer.files)[0])
                  }}
                  className="mt-4 flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-4 text-center hover:border-gray-400"
                >
                  {featuredMediaUrl ? (
                    featuredMediaType === "video" ? (
                      <video
                        src={featuredMediaUrl}
                        muted
                        playsInline
                        className="h-48 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <img
                        src={featuredMediaUrl}
                        alt=""
                        className="h-48 w-full rounded-lg object-cover"
                      />
                    )
                  ) : (
                    <>
                      <span className="text-sm font-medium">
                        {uploadingFeaturedMedia
                          ? "Uploading..."
                          : "Drag & drop image or video"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        or click to browse
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploadingFeaturedMedia}
                    onChange={(e) => {
                      uploadFeaturedMedia(e.target.files?.[0])
                      e.target.value = ""
                    }}
                  />
                </label>

                {featuredMediaUrl && (
                  <button
                    type="button"
                    onClick={() => setFeaturedMediaUrl("")}
                    className="mt-3 text-xs text-red-400 underline"
                  >
                    Remove media
                  </button>
                )}

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm md:col-span-2">
                    Alt Text
                    <input
                      value={featuredMediaAlt}
                      onChange={(e) => setFeaturedMediaAlt(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Object Position
                    <select
                      value={featuredObjectPosition}
                      onChange={(e) => setFeaturedObjectPosition(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Section Width
                    <select
                      value={featuredWidth}
                      onChange={(e) => setFeaturedWidth(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="full">Full Width</option>
                      <option value="wide">Wide</option>
                      <option value="contained">Contained</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Story Content</h4>

                <div className="mt-4 space-y-4">
                  <label className="block text-sm">
                    Eyebrow
                    <input
                      value={featuredEyebrow}
                      onChange={(e) => setFeaturedEyebrow(e.target.value)}
                      placeholder="The Story"
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="block text-sm">
                    Heading
                    <textarea
                      value={featuredHeading}
                      onChange={(e) => setFeaturedHeading(e.target.value)}
                      rows={2}
                      placeholder="A story worth discovering"
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="block text-sm">
                    Description
                    <textarea
                      value={featuredBody}
                      onChange={(e) => setFeaturedBody(e.target.value)}
                      rows={5}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm">
                      Button Text
                      <input
                        value={featuredButtonText}
                        onChange={(e) => setFeaturedButtonText(e.target.value)}
                        className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                      />
                    </label>

                    <label className="text-sm">
                      Button URL
                      <input
                        value={featuredButtonUrl}
                        onChange={(e) => setFeaturedButtonUrl(e.target.value)}
                        placeholder="/collections/story"
                        className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Layout</h4>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">
                  Layout Mode
                  <select
                    value={featuredLayout}
                    onChange={(e) => {
                      const next = e.target.value
                      setFeaturedLayout(next)
                      if (next === "split" && featuredTextColor === "#FFFFFF") {
                        setFeaturedTextColor("#111111")
                        setFeaturedEyebrowColor("#765633")
                      }
                    }}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="overlay">Text Over Media</option>
                    <option value="split">Media + Text Panel</option>
                  </select>
                </label>

                <label className="text-sm">
                  Split Text Side
                  <select
                    value={featuredContentSide}
                    onChange={(e) => setFeaturedContentSide(e.target.value)}
                    disabled={featuredLayout !== "split"}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white disabled:opacity-40"
                  >
                    <option value="right">Text Right</option>
                    <option value="left">Text Left</option>
                  </select>
                </label>

                <label className="text-sm">
                  Horizontal Align
                  <select
                    value={featuredContentAlign}
                    onChange={(e) => setFeaturedContentAlign(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>

                <label className="text-sm">
                  Vertical Align
                  <select
                    value={featuredContentVertical}
                    onChange={(e) => setFeaturedContentVertical(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </label>

                {[
                  ["Desktop Height", featuredDesktopHeight, setFeaturedDesktopHeight],
                  ["Mobile Height", featuredMobileHeight, setFeaturedMobileHeight],
                  ["Content Max Width", featuredContentMaxWidth, setFeaturedContentMaxWidth],
                  ["Content Padding", featuredContentPadding, setFeaturedContentPadding],
                  ["Top Spacing", featuredTopSpacing, setFeaturedTopSpacing],
                  ["Bottom Spacing", featuredBottomSpacing, setFeaturedBottomSpacing],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Typography</h4>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Heading Font", featuredHeadingFont, setFeaturedHeadingFont],
                  ["Body Font", featuredBodyFont, setFeaturedBodyFont],
                  ["Button Font", featuredButtonFont, setFeaturedButtonFont],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <select
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      {EDITORIAL_FONT_OPTIONS.map((font) => (
                        <option key={font.label} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                <label className="text-sm">
                  Heading Weight
                  <select
                    value={featuredHeadingWeight}
                    onChange={(e) => setFeaturedHeadingWeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="300">Light 300</option>
                    <option value="400">Regular 400</option>
                    <option value="500">Medium 500</option>
                    <option value="600">Semi Bold 600</option>
                    <option value="700">Bold 700</option>
                  </select>
                </label>

                {[
                  ["Desktop Heading Size", featuredHeadingSize, setFeaturedHeadingSize],
                  ["Mobile Heading Size", featuredHeadingMobileSize, setFeaturedHeadingMobileSize],
                  ["Body Size", featuredBodySize, setFeaturedBodySize],
                  ["Button Size", featuredButtonSize, setFeaturedButtonSize],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <input
                      type="number"
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Colors & CTA</h4>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Overlay", featuredOverlayColor, setFeaturedOverlayColor],
                  ["Text", featuredTextColor, setFeaturedTextColor],
                  ["Eyebrow", featuredEyebrowColor, setFeaturedEyebrowColor],
                  ["Split Panel", featuredPanelBackground, setFeaturedPanelBackground],
                  ["Button BG", featuredButtonBg, setFeaturedButtonBg],
                  ["Button Text", featuredButtonColor, setFeaturedButtonColor],
                  ["Button Border", featuredButtonBorder, setFeaturedButtonBorder],
                ].map(([label, value, setter]) => (
                  <div key={label as string} className="rounded-lg border border-gray-700 p-3">
                    <label className="text-sm">{label as string}</label>

                    <div className="mt-2 flex gap-2">
                      <input
                        type="color"
                        value={value as string}
                        onChange={(e) =>
                          (setter as React.Dispatch<React.SetStateAction<string>>)(
                            e.target.value.toUpperCase()
                          )
                        }
                        className="h-9 w-12 rounded border border-gray-600 bg-transparent"
                      />
                      <input
                        value={value as string}
                        onChange={(e) =>
                          (setter as React.Dispatch<React.SetStateAction<string>>)(
                            e.target.value.toUpperCase()
                          )
                        }
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {DEFAULT_EDITORIAL_COLORS.slice(0, 18).map((color) => (
                        <button
                          key={`${label}-${color}`}
                          type="button"
                          onClick={() =>
                            (setter as React.Dispatch<React.SetStateAction<string>>)(
                              color
                            )
                          }
                          className="h-5 w-5 rounded-full border border-gray-600"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">
                  Overlay Opacity
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={featuredOverlayOpacity}
                    onChange={(e) => setFeaturedOverlayOpacity(e.target.value)}
                    disabled={featuredLayout !== "overlay"}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2 disabled:opacity-40"
                  />
                </label>

                <label className="text-sm">
                  Button Style
                  <select
                    value={featuredButtonStyle}
                    onChange={(e) => setFeaturedButtonStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="underline">Underline</option>
                    <option value="text">Text Only</option>
                  </select>
                </label>

                {[
                  ["Button Radius", featuredButtonRadius, setFeaturedButtonRadius],
                  ["Button Padding X", featuredButtonPaddingX, setFeaturedButtonPaddingX],
                  ["Button Padding Y", featuredButtonPaddingY, setFeaturedButtonPaddingY],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                ))}

                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={featuredDesktopVisible}
                    onChange={(e) => setFeaturedDesktopVisible(e.target.checked)}
                  />
                  Desktop Visible
                </label>

                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={featuredMobileVisible}
                    onChange={(e) => setFeaturedMobileVisible(e.target.checked)}
                  />
                  Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "campaign_banner" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Campaign Banner Studio</h3>
                <p className="mt-1 max-w-3xl text-sm text-gray-400">
                  Build a full editorial campaign with exact image framing, live crop preview,
                  multiline typography, divider line, overlay and CTA styling.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCampaignMediaFit("cover")
                  setCampaignFocalX("50")
                  setCampaignFocalY("50")
                  setCampaignMediaZoom("1")
                  setCampaignHeight("620")
                  setCampaignContentAlign("right")
                  setCampaignTextAlign("center")
                  setCampaignContentVertical("center")
                  setCampaignContentMaxWidth("560")
                  setCampaignContentPadding("56")
                  setCampaignHeadingFont("Georgia, serif")
                  setCampaignHeadingSize("72")
                  setCampaignHeadingWeight("400")
                  setCampaignHeadingLineHeight("0.98")
                  setCampaignHeadingLetterSpacing("-0.03")
                  setCampaignBodyFont('"Helvetica Neue", Helvetica, Arial, sans-serif')
                  setCampaignBodySize("18")
                  setCampaignBodyLineHeight("1.55")
                  setCampaignDividerEnabled(true)
                  setCampaignDividerWidth("88")
                  setCampaignDividerThickness("2")
                  setCampaignDividerColor("#A97838")
                  setCampaignOverlayColor("#000000")
                  setCampaignOverlayOpacity("18")
                  setCampaignTextColor("#FFFFFF")
                  setCampaignEyebrowColor("#FFFFFF")
                  setCampaignPrimaryStyle("filled")
                  setCampaignPrimaryBg("#F8F4EC")
                  setCampaignPrimaryColor("#2A211C")
                  setCampaignPrimaryBorder("#F8F4EC")
                  setCampaignButtonRadius("0")
                  setCampaignButtonSize("12")
                  setCampaignButtonPaddingX("30")
                  setCampaignButtonPaddingY("16")
                }}
                className="rounded-md border border-[#A97838]/60 px-4 py-2 text-xs font-medium text-[#D3AD79] transition hover:border-[#A97838] hover:bg-[#A97838]/10"
              >
                Apply SAFAFI Editorial Preset
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-5 rounded-xl border border-gray-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium">Media & Crop Studio</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Desktop/tablet use this master crop. Mobile can optionally switch artwork while keeping the same content.
                    </p>
                  </div>

                  <div className="rounded-md border border-[#A97838]/40 bg-[#A97838]/[0.06] px-3 py-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D3AD79]">
                      Hybrid Responsive Master
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      Desktop/tablet scale proportionally; mobile can use its own frame/media.
                    </p>
                  </div>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    uploadCampaignMedia(Array.from(e.dataTransfer.files)[0])
                  }}
                  className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-4 text-center hover:border-gray-400"
                >
                  <span className="text-sm font-medium">
                    {uploadingCampaignMedia
                      ? "Uploading..."
                      : campaignMediaUrl
                        ? "Replace image / video"
                        : "Drag & drop image or video"}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    or click to browse
                  </span>

                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploadingCampaignMedia}
                    onChange={(e) => {
                      uploadCampaignMedia(e.target.files?.[0])
                      e.target.value = ""
                    }}
                  />
                </label>

                {campaignMediaUrl && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-gray-500">
                      Media loaded
                    </p>
                    <button
                      type="button"
                      onClick={() => setCampaignMediaUrl("")}
                      className="text-xs text-red-400 underline"
                    >
                      Remove media
                    </button>
                  </div>
                )}

                <div
                  className="relative mx-auto w-full overflow-hidden rounded-lg border border-gray-700 bg-[#EDE7DE]"
                  style={{
                    aspectRatio:
                      `${1440 / Math.max(280, Number(campaignHeight) || 620)}`,
                    maxHeight: 390,
                    maxWidth: "100%",
                    backgroundColor: campaignMediaBackground,
                  }}
                  onClick={(event) => {
                    if (!campaignMediaUrl || campaignMediaType === "video") return

                    const rect = event.currentTarget.getBoundingClientRect()
                    const x = Math.max(
                      0,
                      Math.min(
                        100,
                        ((event.clientX - rect.left) / rect.width) * 100
                      )
                    )
                    const y = Math.max(
                      0,
                      Math.min(
                        100,
                        ((event.clientY - rect.top) / rect.height) * 100
                      )
                    )

                    setCampaignFocalX(x.toFixed(1))
                    setCampaignFocalY(y.toFixed(1))
                  }}
                >
                  {campaignMediaUrl ? (
                    campaignMediaType === "video" ? (
                      <video
                        src={campaignMediaUrl}
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full"
                        style={{
                          objectFit: campaignMediaFit as "cover" | "contain",
                          objectPosition: `${campaignFocalX}% ${campaignFocalY}%`,
                          transform: `scale(${Math.max(1, Number(campaignMediaZoom) || 1)})`,
                          transformOrigin: `${campaignFocalX}% ${campaignFocalY}%`,
                        }}
                      />
                    ) : (
                      <img
                        src={campaignMediaUrl}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 h-full w-full select-none"
                        style={{
                          objectFit: campaignMediaFit as "cover" | "contain",
                          objectPosition: `${campaignFocalX}% ${campaignFocalY}%`,
                          transform: `scale(${Math.max(1, Number(campaignMediaZoom) || 1)})`,
                          transformOrigin: `${campaignFocalX}% ${campaignFocalY}%`,
                        }}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                      Upload media to preview crop
                    </div>
                  )}

                  {campaignMediaUrl && campaignMediaType !== "video" && (
                    <div
                      className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#A97838]/80 shadow-lg"
                      style={{
                        left: `${campaignFocalX}%`,
                        top: `${campaignFocalY}%`,
                      }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[10px] text-white">
                    MASTER RESPONSIVE CROP
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    Image Fit
                    <select
                      value={campaignMediaFit}
                      onChange={(e) => {
                        setCampaignMediaFit(e.target.value)
                        if (e.target.value === "contain") {
                          setCampaignMediaZoom("1")
                        }
                      }}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="cover">Cover — fill banner / crop allowed</option>
                      <option value="contain">Show Full Image — no crop</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Media Background
                    <div className="mt-2 flex gap-2">
                      <input
                        type="color"
                        value={campaignMediaBackground}
                        onChange={(e) =>
                          setCampaignMediaBackground(e.target.value.toUpperCase())
                        }
                        className="h-10 w-12 rounded border border-gray-600 bg-transparent"
                      />
                      <input
                        value={campaignMediaBackground}
                        onChange={(e) =>
                          setCampaignMediaBackground(e.target.value.toUpperCase())
                        }
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-3 py-2 text-xs"
                      />
                    </div>
                  </label>

                  <label className="text-sm">
                    Focal X — {Number(campaignFocalX).toFixed(0)}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={campaignFocalX}
                      disabled={campaignMediaFit === "contain"}
                      onChange={(e) => setCampaignFocalX(e.target.value)}
                      className="mt-3 w-full disabled:opacity-30"
                    />
                  </label>

                  <label className="text-sm">
                    Focal Y — {Number(campaignFocalY).toFixed(0)}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={campaignFocalY}
                      disabled={campaignMediaFit === "contain"}
                      onChange={(e) => setCampaignFocalY(e.target.value)}
                      className="mt-3 w-full disabled:opacity-30"
                    />
                  </label>

                  <label className="text-sm">
                    Zoom — {Number(campaignMediaZoom).toFixed(2)}×
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={campaignMediaZoom}
                      disabled={campaignMediaFit === "contain"}
                      onChange={(e) => setCampaignMediaZoom(e.target.value)}
                      className="mt-3 w-full disabled:opacity-30"
                    />
                  </label>

                  <label className="text-sm">
                    Legacy Position
                    <select
                      value={campaignObjectPosition}
                      onChange={(e) => {
                        setCampaignObjectPosition(e.target.value)
                        const preset = e.target.value
                        if (preset === "top") {
                          setCampaignFocalX("50"); setCampaignFocalY("0")
                        } else if (preset === "bottom") {
                          setCampaignFocalX("50"); setCampaignFocalY("100")
                        } else if (preset === "left") {
                          setCampaignFocalX("0"); setCampaignFocalY("50")
                        } else if (preset === "right") {
                          setCampaignFocalX("100"); setCampaignFocalY("50")
                        } else {
                          setCampaignFocalX("50"); setCampaignFocalY("50")
                        }
                      }}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Master Banner Height
                    <input
                      type="number"
                      min="280"
                      value={campaignHeight}
                      onChange={(e) => setCampaignHeight(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Section Width
                    <select
                      value={campaignWidth}
                      onChange={(e) => setCampaignWidth(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="full">Full Width</option>
                      <option value="wide">Wide</option>
                      <option value="contained">Contained</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Alt Text
                    <input
                      value={campaignMediaAlt}
                      onChange={(e) => setCampaignMediaAlt(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-5 rounded-xl border border-[#A97838]/35 bg-[#A97838]/[0.04] p-4">
                <div>
                  <h4 className="font-medium">
                    Optional Mobile Media Override
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Leave empty to reuse desktop artwork. Content, typography,
                    divider and buttons remain shared.
                  </p>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    uploadCampaignMobileMedia(
                      Array.from(
                        e.dataTransfer.files
                      )[0]
                    )
                  }}
                  className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-4 text-center hover:border-gray-400"
                >
                  {campaignMobileMediaUrl ? (
                    campaignMobileMediaType === "video" ? (
                      <video
                        src={campaignMobileMediaUrl}
                        muted
                        playsInline
                        controls
                        className="max-h-[240px] w-full object-contain"
                      />
                    ) : (
                      <img
                        src={campaignMobileMediaUrl}
                        alt=""
                        className="max-h-[240px] w-full object-contain"
                      />
                    )
                  ) : (
                    <>
                      <span className="text-sm font-medium">
                        {uploadingCampaignMobileMedia
                          ? "Uploading..."
                          : "Optional mobile image / video"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        click or drag & drop
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploadingCampaignMobileMedia}
                    onChange={(e) => {
                      uploadCampaignMobileMedia(
                        e.target.files?.[0]
                      )
                      e.target.value = ""
                    }}
                  />
                </label>

                {campaignMobileMediaUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setCampaignMobileMediaUrl("")
                    }
                    className="w-fit text-xs text-red-400 underline"
                  >
                    Remove mobile override
                  </button>
                )}

                <label className="block max-w-[280px] text-sm">
                  Mobile Banner Height
                  <input
                    type="number"
                    min="380"
                    max="800"
                    step="10"
                    value={campaignMobileHeight}
                    onChange={(e) =>
                      setCampaignMobileHeight(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                  <span className="mt-1 block text-[10px] leading-4 text-gray-500">
                    Recommended: 460–540px.
                  </span>
                </label>
              </div>

              <div className="space-y-5 rounded-xl border border-gray-700 p-4">
                <div>
                  <h4 className="font-medium">Content</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Press Enter in the heading to create deliberate editorial line breaks.
                  </p>
                </div>

                <label className="block text-sm">
                  Eyebrow
                  <input
                    value={campaignEyebrow}
                    onChange={(e) => setCampaignEyebrow(e.target.value)}
                    placeholder="NEW CAMPAIGN"
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="block text-sm">
                  Heading
                  <textarea
                    value={campaignHeading}
                    onChange={(e) => setCampaignHeading(e.target.value)}
                    rows={3}
                    placeholder={"Heritage\\nReimagined"}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="block text-sm">
                  Description
                  <textarea
                    value={campaignBody}
                    onChange={(e) => setCampaignBody(e.target.value)}
                    rows={3}
                    placeholder="Timeless prints, modern soul. Made to be you."
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <div className="rounded-lg border border-[#A97838]/35 bg-[#A97838]/[0.05] px-4 py-3">
                  <p className="text-xs font-medium text-[#D3AD79]">
                    Responsive behavior
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-gray-400">
                    Build content once. Desktop/tablet preserve the proportional
                    composition. At mobile width, the frame becomes taller and can
                    switch to optional mobile artwork; text/buttons remain shared.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="text-sm">
                    Content Position
                    <select
                      value={campaignContentAlign}
                      onChange={(e) => setCampaignContentAlign(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="left">Left Side</option>
                      <option value="center">Center</option>
                      <option value="right">Right Side</option>
                    </select>
                    <span className="mt-1 block text-[10px] text-gray-500">
                      Moves the whole content block.
                    </span>
                  </label>

                  <label className="text-sm">
                    Text Alignment
                    <select
                      value={campaignTextAlign}
                      onChange={(e) => setCampaignTextAlign(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                    <span className="mt-1 block text-[10px] text-gray-500">
                      Aligns heading, description, divider and buttons inside the block.
                    </span>
                  </label>

                  <label className="text-sm">
                    Vertical Align
                    <select
                      value={campaignContentVertical}
                      onChange={(e) => setCampaignContentVertical(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Content Max Width
                    <input
                      type="number"
                      min="240"
                      max="1000"
                      value={campaignContentMaxWidth}
                      onChange={(e) => setCampaignContentMaxWidth(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Content Padding
                    <input
                      type="number"
                      min="0"
                      value={campaignContentPadding}
                      onChange={(e) => setCampaignContentPadding(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                </div>

                <div className="rounded-lg border border-gray-700 bg-[#17171a] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Editorial Divider</p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Add the short line between heading and description.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={campaignDividerEnabled}
                      onChange={(e) => setCampaignDividerEnabled(e.target.checked)}
                    />
                  </div>

                  {campaignDividerEnabled && (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <label className="text-xs">
                        Width
                        <input
                          type="number"
                          min="10"
                          value={campaignDividerWidth}
                          onChange={(e) => setCampaignDividerWidth(e.target.value)}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <label className="text-xs">
                        Thickness
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={campaignDividerThickness}
                          onChange={(e) => setCampaignDividerThickness(e.target.value)}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <label className="text-xs">
                        Color
                        <input
                          type="color"
                          value={campaignDividerColor}
                          onChange={(e) => setCampaignDividerColor(e.target.value.toUpperCase())}
                          className="mt-2 h-10 w-full rounded border border-gray-600 bg-transparent"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    Primary Button
                    <input
                      value={campaignPrimaryText}
                      onChange={(e) => setCampaignPrimaryText(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Primary URL
                    <input
                      value={campaignPrimaryUrl}
                      onChange={(e) => setCampaignPrimaryUrl(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Secondary Button
                    <input
                      value={campaignSecondaryText}
                      onChange={(e) => setCampaignSecondaryText(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    Secondary URL
                    <input
                      value={campaignSecondaryUrl}
                      onChange={(e) => setCampaignSecondaryUrl(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Typography</h4>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Heading Font", campaignHeadingFont, setCampaignHeadingFont],
                  ["Body Font", campaignBodyFont, setCampaignBodyFont],
                  ["Button Font", campaignButtonFont, setCampaignButtonFont],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <select
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                    >
                      {EDITORIAL_FONT_OPTIONS.map((font) => (
                        <option key={font.label} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                <label className="text-sm">
                  Heading Weight
                  <select
                    value={campaignHeadingWeight}
                    onChange={(e) => setCampaignHeadingWeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="300">Light 300</option>
                    <option value="400">Regular 400</option>
                    <option value="500">Medium 500</option>
                    <option value="600">Semi Bold 600</option>
                    <option value="700">Bold 700</option>
                  </select>
                </label>

                {[
                  ["Master Heading Size", campaignHeadingSize, setCampaignHeadingSize],
                  ["Body Size", campaignBodySize, setCampaignBodySize],
                  ["Button Size", campaignButtonSize, setCampaignButtonSize],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                ))}

                <label className="text-sm">
                  Heading Line Height
                  <input
                    type="number"
                    min="0.7"
                    max="2"
                    step="0.01"
                    value={campaignHeadingLineHeight}
                    onChange={(e) => setCampaignHeadingLineHeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Heading Letter Spacing (em)
                  <input
                    type="number"
                    min="-0.1"
                    max="0.3"
                    step="0.01"
                    value={campaignHeadingLetterSpacing}
                    onChange={(e) => setCampaignHeadingLetterSpacing(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Body Line Height
                  <input
                    type="number"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={campaignBodyLineHeight}
                    onChange={(e) => setCampaignBodyLineHeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Overlay Opacity
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={campaignOverlayOpacity}
                    onChange={(e) => setCampaignOverlayOpacity(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-medium">SAFAFI Colors & Buttons</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Brand colors are shown first; custom HEX still works.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Overlay", campaignOverlayColor, setCampaignOverlayColor],
                  ["Main Text", campaignTextColor, setCampaignTextColor],
                  ["Eyebrow", campaignEyebrowColor, setCampaignEyebrowColor],
                  ["Primary BG", campaignPrimaryBg, setCampaignPrimaryBg],
                  ["Primary Text", campaignPrimaryColor, setCampaignPrimaryColor],
                  ["Primary Border", campaignPrimaryBorder, setCampaignPrimaryBorder],
                  ["Secondary Text", campaignSecondaryColor, setCampaignSecondaryColor],
                  ["Secondary Border", campaignSecondaryBorder, setCampaignSecondaryBorder],
                ].map(([label, value, setter]) => {
                  const setColor =
                    setter as React.Dispatch<React.SetStateAction<string>>
                  const selectedValue = String(value).toUpperCase()

                  return (
                    <div key={label as string} className="rounded-lg border border-gray-700 bg-[#17171a] p-3">
                      <label className="text-sm">{label as string}</label>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="color"
                          value={value as string}
                          onChange={(e) => setColor(e.target.value.toUpperCase())}
                          className="h-9 w-12 rounded border border-gray-600 bg-transparent"
                        />
                        <input
                          value={value as string}
                          onChange={(e) => setColor(e.target.value.toUpperCase())}
                          className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {SAFAFI_BRAND_COLORS.map((color) => (
                          <button
                            key={`${String(label)}-${color.value}`}
                            type="button"
                            title={`${color.name} — ${color.value}`}
                            onClick={() => setColor(color.value)}
                            className={`h-7 w-7 rounded-full border transition hover:scale-110 ${
                              selectedValue === color.value.toUpperCase()
                                ? "border-white ring-2 ring-[#A97838] ring-offset-2 ring-offset-[#17171a]"
                                : "border-white/25"
                            }`}
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">
                  Primary Style
                  <select
                    value={campaignPrimaryStyle}
                    onChange={(e) => setCampaignPrimaryStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="underline">Underline</option>
                    <option value="text">Text Only</option>
                  </select>
                </label>

                <label className="text-sm">
                  Secondary Style
                  <select
                    value={campaignSecondaryStyle}
                    onChange={(e) => setCampaignSecondaryStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="underline">Underline</option>
                    <option value="text">Text Only</option>
                  </select>
                </label>

                {[
                  ["Button Radius", campaignButtonRadius, setCampaignButtonRadius],
                  ["Padding X", campaignButtonPaddingX, setCampaignButtonPaddingX],
                  ["Padding Y", campaignButtonPaddingY, setCampaignButtonPaddingY],
                  ["Top Spacing", campaignTopSpacing, setCampaignTopSpacing],
                  ["Bottom Spacing", campaignBottomSpacing, setCampaignBottomSpacing],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      value={value as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                    />
                  </label>
                ))}

                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={campaignDesktopVisible}
                    onChange={(e) => setCampaignDesktopVisible(e.target.checked)}
                  />
                  Desktop Visible
                </label>

                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={campaignMobileVisible}
                    onChange={(e) => setCampaignMobileVisible(e.target.checked)}
                  />
                  Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "shop_the_look" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Shop the Look Settings</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Upload one lifestyle image, place hotspots on it, then connect each hotspot to a product.
                </p>
              </div>
              <button type="button" onClick={() => addShopHotspot()}
                className="rounded-md border border-gray-600 px-3 py-2 text-sm hover:border-gray-400">
                + Add Hotspot
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_.75fr]">
              <div className="rounded-xl border border-gray-700 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">Lifestyle Image + Hotspots</h4>
                  <span className="text-xs text-gray-500">
                    Click image to place a hotspot
                  </span>
                </div>

                {!shopImageUrl ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
                    onDrop={(e) => {
                      e.preventDefault()
                      uploadShopImage(Array.from(e.dataTransfer.files).find((file) => file.type.startsWith("image/")))
                    }}
                    className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-6 text-center hover:border-gray-400"
                  >
                    <span className="text-sm font-medium">
                      {uploadingShopImage ? "Uploading..." : "Drag & drop lifestyle image"}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">or click to browse</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingShopImage}
                      onChange={(e) => { uploadShopImage(e.target.files?.[0]); e.target.value = "" }} />
                  </label>
                ) : (
                  <>
                    <div
                      className="relative min-h-[420px] cursor-crosshair overflow-hidden rounded-xl bg-black"
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
                        const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
                        addShopHotspot(Number(x.toFixed(2)), Number(y.toFixed(2)))
                      }}
                    >
                      <img src={shopImageUrl} alt="" draggable={false}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: shopImagePosition }} />

                      {shopHotspots.map((hotspot, index) => (
                        <button
                          key={hotspot.id}
                          type="button"
                          title={hotspot.product_title || `Hotspot ${index + 1}`}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg"
                          style={{
                            left: `${hotspot.x}%`,
                            top: `${hotspot.y}%`,
                            width: Number(shopHotspotSize) + 10,
                            height: Number(shopHotspotSize) + 10,
                            backgroundColor: shopHotspotColor,
                            border: `2px solid ${shopHotspotRingColor}`,
                            color: shopHotspotRingColor,
                          }}
                        >
                          <span className="text-[10px] font-bold">{index + 1}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-3">
                      <label className="cursor-pointer rounded-md border border-gray-600 px-3 py-2 text-xs">
                        Replace Image
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { uploadShopImage(e.target.files?.[0]); e.target.value = "" }} />
                      </label>
                      <button type="button" onClick={() => setShopImageUrl("")}
                        className="text-xs text-red-400 underline">Remove Image</button>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-xl border border-gray-700 p-4">
                <h4 className="font-medium">Product Search</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Search once, then assign a result to any hotspot below.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={shopProductQuery}
                    onChange={(e) => setShopProductQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        searchShopProducts()
                      }
                    }}
                    placeholder="Search product title..."
                    className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={searchShopProducts}
                    className="rounded-md border border-gray-600 px-3 py-2 text-sm">
                    {shopProductsLoading ? "..." : "Search"}
                  </button>
                </div>

                <div className="mt-4 max-h-[330px] space-y-2 overflow-y-auto">
                  {shopProductResults.map((product) => (
                    <div key={product.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-700 p-2">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt="" className="h-12 w-10 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-10 shrink-0 rounded bg-gray-800" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{product.title}</p>
                        <p className="truncate text-[10px] text-gray-500">/{product.handle || "no-handle"}</p>
                      </div>
                    </div>
                  ))}
                  {!shopProductsLoading && shopProductQuery && !shopProductResults.length && (
                    <p className="text-xs text-gray-500">No products found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Hotspots ({shopHotspots.length})</h4>
                <button type="button" onClick={() => addShopHotspot()}
                  className="text-xs underline">Add manually</button>
              </div>

              {!shopHotspots.length ? (
                <div className="mt-4 rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">
                  Click the lifestyle image or use “Add Hotspot”.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {shopHotspots.map((hotspot, index) => (
                    <div key={hotspot.id} className="rounded-xl border border-gray-700 bg-[#17171a] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Hotspot {index + 1}</p>
                          <p className="text-xs text-gray-500">
                            {hotspot.product_title || "No product assigned"}
                          </p>
                        </div>
                        <button type="button" onClick={() => removeShopHotspot(hotspot.id)}
                          className="text-xs text-red-400 underline">Remove</button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="text-sm">X Position %
                          <input type="number" min="0" max="100" step="0.1" value={hotspot.x}
                            onChange={(e) => updateShopHotspot(hotspot.id, { x: Math.max(0, Math.min(100, Number(e.target.value))) })}
                            className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                        </label>
                        <label className="text-sm">Y Position %
                          <input type="number" min="0" max="100" step="0.1" value={hotspot.y}
                            onChange={(e) => updateShopHotspot(hotspot.id, { y: Math.max(0, Math.min(100, Number(e.target.value))) })}
                            className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                        </label>
                        <label className="text-sm md:col-span-2">Custom Label
                          <input value={hotspot.label}
                            onChange={(e) => updateShopHotspot(hotspot.id, { label: e.target.value })}
                            placeholder="Optional product label"
                            className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                        </label>
                      </div>

                      {!!shopProductResults.length && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs text-gray-500">Assign product:</p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {shopProductResults.map((product) => (
                              <button key={product.id} type="button"
                                onClick={() => assignProductToHotspot(hotspot.id, product)}
                                className={`flex min-w-[190px] items-center gap-2 rounded-lg border p-2 text-left ${
                                  hotspot.product_id === product.id ? "border-white bg-white/10" : "border-gray-700"
                                }`}>
                                {product.thumbnail ? (
                                  <img src={product.thumbnail} alt="" className="h-11 w-9 shrink-0 rounded object-cover" />
                                ) : <div className="h-11 w-9 shrink-0 rounded bg-gray-800" />}
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-medium">{product.title}</span>
                                  <span className="block truncate text-[10px] text-gray-500">{formatShopProductPrice(product)}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {hotspot.product_title && (
                        <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-700 p-3">
                          {hotspot.product_thumbnail && (
                            <img src={hotspot.product_thumbnail} alt="" className="h-14 w-12 rounded object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{hotspot.product_title}</p>
                            <p className="text-xs text-gray-500">{hotspot.price_label}</p>
                            <p className="truncate text-[10px] text-gray-500">/products/{hotspot.product_handle}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-700 p-4">
              <h4 className="font-medium">Section Style</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">Width
                  <select value={shopWidth} onChange={(e) => setShopWidth(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                    <option value="full">Full Width</option><option value="wide">Wide</option><option value="contained">Contained</option>
                  </select>
                </label>
                <label className="text-sm">Image Position
                  <select value={shopImagePosition} onChange={(e) => setShopImagePosition(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                    <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option>
                    <option value="left">Left</option><option value="right">Right</option>
                  </select>
                </label>
                <label className="text-sm">Desktop Height
                  <input type="number" min="300" value={shopDesktopHeight} onChange={(e) => setShopDesktopHeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Mobile Height
                  <input type="number" min="300" value={shopMobileHeight} onChange={(e) => setShopMobileHeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Top Spacing
                  <input type="number" min="0" value={shopTopSpacing} onChange={(e) => setShopTopSpacing(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Bottom Spacing
                  <input type="number" min="0" value={shopBottomSpacing} onChange={(e) => setShopBottomSpacing(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Hotspot Size
                  <input type="number" min="12" max="60" value={shopHotspotSize} onChange={(e) => setShopHotspotSize(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>
                <label className="text-sm">Alt Text
                  <input value={shopImageAlt} onChange={(e) => setShopImageAlt(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                </label>

                {[
                  ["Background", shopBackground, setShopBackground],
                  ["Hotspot Fill", shopHotspotColor, setShopHotspotColor],
                  ["Hotspot Ring", shopHotspotRingColor, setShopHotspotRingColor],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="text-sm">{label as string}
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="h-10 w-12 rounded border border-gray-600 bg-transparent" />
                      <input value={value as string}
                        onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value.toUpperCase())}
                        className="min-w-0 flex-1 rounded-md border border-gray-600 bg-transparent px-2 py-2 text-xs" />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input type="checkbox" checked={shopShowProductCard} onChange={(e) => setShopShowProductCard(e.target.checked)} />
                  Show product card on hover
                </label>
                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input type="checkbox" checked={shopDesktopVisible} onChange={(e) => setShopDesktopVisible(e.target.checked)} />
                  Desktop Visible
                </label>
                <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                  <input type="checkbox" checked={shopMobileVisible} onChange={(e) => setShopMobileVisible(e.target.checked)} />
                  Mobile Visible
                </label>
              </div>
            </div>
          </div>
        )}

        {type === "image_mosaic" && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Image Mosaic / Lookbook Settings</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Build a mixed-size editorial image grid. Add, remove and reorder as many tiles as needed.
                </p>
              </div>
              <button type="button" onClick={addMosaicItem}
                className="rounded-md border border-gray-600 px-3 py-2 text-xs hover:border-gray-400">
                + Add Image
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm">Section Width
                <select value={mosaicWidth} onChange={(e) => setMosaicWidth(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                  <option value="full">Full Width</option><option value="wide">Wide</option><option value="contained">Contained</option>
                </select>
              </label>
              <label className="text-sm">Desktop Columns
                <select value={mosaicDesktopColumns} onChange={(e) => setMosaicDesktopColumns(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                  <option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </label>
              <label className="text-sm">Mobile Columns
                <select value={mosaicMobileColumns} onChange={(e) => setMosaicMobileColumns(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                  <option value="1">1</option><option value="2">2</option>
                </select>
              </label>
              <label className="text-sm">Gap (px)
                <input type="number" min="0" max="80" value={mosaicGap} onChange={(e) => setMosaicGap(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
              </label>
              <label className="text-sm">Desktop Row Height
                <input type="number" min="100" max="700" value={mosaicRowHeight} onChange={(e) => setMosaicRowHeight(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
              </label>
              <label className="text-sm">Mobile Row Height
                <input type="number" min="100" max="500" value={mosaicMobileRowHeight} onChange={(e) => setMosaicMobileRowHeight(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
              </label>
              <label className="text-sm">Top Spacing
                <input type="number" min="0" value={mosaicTopSpacing} onChange={(e) => setMosaicTopSpacing(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
              </label>
              <label className="text-sm">Bottom Spacing
                <input type="number" min="0" value={mosaicBottomSpacing} onChange={(e) => setMosaicBottomSpacing(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
              </label>
              <label className="text-sm">Background
                <input type="color" value={mosaicBackground} onChange={(e) => setMosaicBackground(e.target.value.toUpperCase())}
                  className="mt-2 h-10 w-16 rounded border border-gray-600 bg-transparent" />
              </label>
              <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                <input type="checkbox" checked={mosaicDesktopVisible} onChange={(e) => setMosaicDesktopVisible(e.target.checked)} /> Desktop Visible
              </label>
              <label className="flex items-center gap-3 rounded-md border border-gray-700 px-3 py-3 text-sm">
                <input type="checkbox" checked={mosaicMobileVisible} onChange={(e) => setMosaicMobileVisible(e.target.checked)} /> Mobile Visible
              </label>
            </div>

            <div className="space-y-5">
              {mosaicItems.map((item, index) => (
                <div key={index} className="rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Mosaic Image {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={index === 0} onClick={() => moveMosaicItem(index, "up")}
                        className="rounded border border-gray-600 px-2 py-1 text-xs disabled:opacity-30">↑</button>
                      <button type="button" disabled={index === mosaicItems.length - 1} onClick={() => moveMosaicItem(index, "down")}
                        className="rounded border border-gray-600 px-2 py-1 text-xs disabled:opacity-30">↓</button>
                      {mosaicItems.length > 1 && <button type="button" onClick={() => removeMosaicItem(index)} className="text-xs text-red-400 underline">Remove</button>}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                    <div>
                      <label onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
                        onDrop={(e) => { e.preventDefault(); uploadMosaicImage(index, Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"))) }}
                        className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-600 bg-[#17171a] p-3 text-center">
                        {item.image_url ? <img src={item.image_url} alt="" className="h-44 w-full rounded-lg object-cover" /> :
                          <><span className="text-sm font-medium">{uploadingMosaicIndex === index ? "Uploading..." : "Drag & drop image"}</span><span className="mt-1 text-xs text-gray-500">or click to browse</span></>}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingMosaicIndex !== null}
                          onChange={(e) => { uploadMosaicImage(index, e.target.files?.[0]); e.target.value = "" }} />
                      </label>
                      {item.image_url && <button type="button" onClick={() => updateMosaicItem(index, { image_url: "" })} className="mt-2 text-xs text-red-400 underline">Remove image</button>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="text-sm">Alt Text
                        <input value={item.image_alt} onChange={(e) => updateMosaicItem(index, { image_alt: e.target.value })}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                      </label>
                      <label className="text-sm">Link URL
                        <input value={item.link_url} onChange={(e) => updateMosaicItem(index, { link_url: e.target.value })} placeholder="/collections/new-season"
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2" />
                      </label>
                      <label className="text-sm">Tile Size
                        <select value={item.size} onChange={(e) => updateMosaicItem(index, { size: e.target.value as ImageMosaicItemDraft["size"] })}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                          <option value="small">Small 1×1</option><option value="wide">Wide 2×1</option><option value="tall">Tall 1×2</option><option value="large">Large 2×2</option>
                        </select>
                      </label>
                      <label className="text-sm">Image Position
                        <select value={item.image_position} onChange={(e) => updateMosaicItem(index, { image_position: e.target.value as ImageMosaicItemDraft["image_position"] })}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white">
                          <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "collection_cards" && (
          <div className="mt-8 rounded-xl border border-gray-700 bg-[#111114] p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold">Collection Cards Settings</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Build as many collection tiles as you need. Default layout is 4 cards per row on desktop and 2 per row on mobile.
                </p>
              </div>

              <button
                type="button"
                onClick={addCollectionCard}
                className="rounded-md border border-gray-600 px-3 py-2 text-xs transition hover:border-gray-400"
              >
                + Add Card
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm">
                Desktop Columns
                <select
                  value={collectionCardsDesktopColumns}
                  onChange={(e) => setCollectionCardsDesktopColumns(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </label>

              <label className="text-sm">
                Mobile Columns
                <select
                  value={collectionCardsMobileColumns}
                  onChange={(e) => setCollectionCardsMobileColumns(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </label>

              <label className="text-sm">
                Image Ratio
                <select
                  value={collectionCardsImageRatio}
                  onChange={(e) => setCollectionCardsImageRatio(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="square">Square</option>
                  <option value="landscape">Landscape</option>
                  <option value="editorial">Editorial</option>
                </select>
              </label>

              <label className="text-sm">
                Section Width
                <select
                  value={collectionCardsWidth}
                  onChange={(e) => setCollectionCardsWidth(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                >
                  <option value="contained">Contained</option>
                  <option value="wide">Wide</option>
                  <option value="full">Full Width</option>
                </select>
              </label>

              <label className="text-sm">
                Gap (px)
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={collectionCardsGap}
                  onChange={(e) => setCollectionCardsGap(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                />
              </label>

              <label className="text-sm">
                Top Spacing
                <input
                  type="number"
                  value={collectionCardsTopSpacing}
                  onChange={(e) => setCollectionCardsTopSpacing(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                />
              </label>

              <label className="text-sm">
                Bottom Spacing
                <input
                  type="number"
                  value={collectionCardsBottomSpacing}
                  onChange={(e) => setCollectionCardsBottomSpacing(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                />
              </label>

              <label className="text-sm">
                Overlay Opacity (%)
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={collectionCardsOverlayOpacity}
                  onChange={(e) => setCollectionCardsOverlayOpacity(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                />
              </label>

              <label className="text-sm">
                Text Position
                <select
                  value={collectionCardsTextPosition}
                  onChange={(e) => setCollectionCardsTextPosition(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="center-left">Center Left</option>
                  <option value="center">Center</option>
                  <option value="center-right">Center Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </label>

              <label className="text-sm">
                Background
                <input
                  type="color"
                  value={collectionCardsBackground}
                  onChange={(e) => setCollectionCardsBackground(e.target.value.toUpperCase())}
                  className="mt-2 h-10 w-16 cursor-pointer rounded border border-gray-600 bg-transparent"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Desktop Visible", collectionCardsDesktopVisible, setCollectionCardsDesktopVisible],
                ["Mobile Visible", collectionCardsMobileVisible, setCollectionCardsMobileVisible],
              ].map(([label, checked, setter]) => (
                <label
                  key={String(label)}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-700 px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checked)}
                    onChange={(e) =>
                      (setter as (value: boolean) => void)(e.target.checked)
                    }
                  />
                  {String(label)}
                </label>
              ))}
            </div>

            <div className="mt-7 rounded-lg border border-gray-700 bg-[#151518] p-4">
              <h4 className="font-medium">Text & Button Styling</h4>
              <p className="mt-1 text-xs text-gray-500">
                Style all collection cards consistently. Each card also has its own X/Y content offset below.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm">
                  Title Color
                  <input
                    type="color"
                    value={collectionCardsTitleColor}
                    onChange={(e) => setCollectionCardsTitleColor(e.target.value.toUpperCase())}
                    className="mt-2 h-10 w-16 cursor-pointer rounded border border-gray-600 bg-transparent"
                  />
                </label>

                <label className="text-sm">
                  Desktop Title Size
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={collectionCardsTitleSize}
                    onChange={(e) => setCollectionCardsTitleSize(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Mobile Title Size
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={collectionCardsTitleMobileSize}
                    onChange={(e) => setCollectionCardsTitleMobileSize(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Title Weight
                  <select
                    value={collectionCardsTitleWeight}
                    onChange={(e) => setCollectionCardsTitleWeight(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                  </select>
                </label>

                <label className="text-sm">
                  Subtitle Color
                  <input
                    type="color"
                    value={collectionCardsSubtitleColor}
                    onChange={(e) => setCollectionCardsSubtitleColor(e.target.value.toUpperCase())}
                    className="mt-2 h-10 w-16 cursor-pointer rounded border border-gray-600 bg-transparent"
                  />
                </label>

                <label className="text-sm">
                  Subtitle Size
                  <input
                    type="number"
                    min="9"
                    max="36"
                    value={collectionCardsSubtitleSize}
                    onChange={(e) => setCollectionCardsSubtitleSize(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Button Style
                  <select
                    value={collectionCardsButtonStyle}
                    onChange={(e) => setCollectionCardsButtonStyle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                  >
                    <option value="filled">Filled Box</option>
                    <option value="outline">Outline Box</option>
                    <option value="underline">Underline</option>
                    <option value="text">Text Only</option>
                  </select>
                </label>

                <label className="text-sm">
                  Button Font Size
                  <input
                    type="number"
                    min="9"
                    max="28"
                    value={collectionCardsButtonSize}
                    onChange={(e) => setCollectionCardsButtonSize(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Button Background
                  <input
                    type="color"
                    value={collectionCardsButtonBgColor}
                    onChange={(e) => setCollectionCardsButtonBgColor(e.target.value.toUpperCase())}
                    disabled={collectionCardsButtonStyle !== "filled"}
                    className="mt-2 h-10 w-16 cursor-pointer rounded border border-gray-600 bg-transparent disabled:opacity-30"
                  />
                </label>

                <label className="text-sm">
                  Button Text Color
                  <input
                    type="color"
                    value={collectionCardsButtonTextColor}
                    onChange={(e) => setCollectionCardsButtonTextColor(e.target.value.toUpperCase())}
                    className="mt-2 h-10 w-16 cursor-pointer rounded border border-gray-600 bg-transparent"
                  />
                </label>

                <label className="text-sm">
                  Button Border Color
                  <input
                    type="color"
                    value={collectionCardsButtonBorderColor}
                    onChange={(e) => setCollectionCardsButtonBorderColor(e.target.value.toUpperCase())}
                    disabled={collectionCardsButtonStyle === "text"}
                    className="mt-2 h-10 w-16 cursor-pointer rounded border border-gray-600 bg-transparent disabled:opacity-30"
                  />
                </label>

                <label className="text-sm">
                  Button Radius
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={collectionCardsButtonRadius}
                    onChange={(e) => setCollectionCardsButtonRadius(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Button Padding X
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={collectionCardsButtonPaddingX}
                    onChange={(e) => setCollectionCardsButtonPaddingX(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>

                <label className="text-sm">
                  Button Padding Y
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={collectionCardsButtonPaddingY}
                    onChange={(e) => setCollectionCardsButtonPaddingY(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                  />
                </label>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              {collectionCards.map((card, index) => {
                const selected = collections.find(
                  (collection) => collection.handle === card.collection_handle
                )

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-700 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Card {index + 1}</p>
                        {selected && (
                          <p className="mt-1 text-xs text-gray-500">
                            Linked to {selected.title}
                          </p>
                        )}
                      </div>

                      {collectionCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCollectionCard(index)}
                          className="text-xs text-red-400 underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <label className="text-sm">
                        Collection
                        <select
                          value={card.collection_handle}
                          onChange={(e) => {
                            const handle = e.target.value
                            const collection = collections.find(
                              (item) => item.handle === handle
                            )
                            updateCollectionCard(index, {
                              collection_handle: handle,
                              title: card.title || collection?.title || "",
                            })
                          }}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white"
                        >
                          <option value="">Choose collection</option>
                          {collections.map((collection) => (
                            <option key={collection.id} value={collection.handle}>
                              {collection.title}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm">
                        Card Title
                        <input
                          value={card.title}
                          onChange={(e) =>
                            updateCollectionCard(index, { title: e.target.value })
                          }
                          placeholder={selected?.title || "Collection title"}
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <label className="text-sm">
                        Subtitle
                        <input
                          value={card.subtitle}
                          onChange={(e) =>
                            updateCollectionCard(index, { subtitle: e.target.value })
                          }
                          placeholder="Optional editorial copy"
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <label className="text-sm">
                        Button Text
                        <input
                          value={card.button_text}
                          onChange={(e) =>
                            updateCollectionCard(index, { button_text: e.target.value })
                          }
                          placeholder="Shop Now"
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <label className="text-sm">
                        Custom URL (optional)
                        <input
                          value={card.custom_url}
                          onChange={(e) =>
                            updateCollectionCard(index, { custom_url: e.target.value })
                          }
                          placeholder="/collections/new-season"
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>


                      <label className="text-sm">
                        Content X Offset
                        <input
                          type="number"
                          value={card.content_offset_x}
                          onChange={(e) =>
                            updateCollectionCard(index, {
                              content_offset_x: Number(e.target.value) || 0,
                            })
                          }
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <label className="text-sm">
                        Content Y Offset
                        <input
                          type="number"
                          value={card.content_offset_y}
                          onChange={(e) =>
                            updateCollectionCard(index, {
                              content_offset_y: Number(e.target.value) || 0,
                            })
                          }
                          className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                        />
                      </label>

                      <div className="text-sm md:col-span-2 xl:col-span-1">
                        Image
                        <label
                          onDragOver={(event) => {
                            event.preventDefault()
                            event.dataTransfer.dropEffect = "copy"
                          }}
                          onDrop={(event) =>
                            handleCollectionCardDrop(index, event)
                          }
                          className={[
                            "mt-2 flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-4 text-center transition",
                            card.image_url
                              ? "border-gray-500 bg-[#18181b]"
                              : "border-gray-600 bg-[#141417] hover:border-gray-400",
                            uploadingCollectionCardIndex === index
                              ? "pointer-events-none opacity-60"
                              : "",
                          ].join(" ")}
                        >
                          {card.image_url ? (
                            <>
                              <img
                                src={card.image_url}
                                alt=""
                                className="mb-3 h-20 w-16 rounded object-cover"
                              />
                              <span className="text-xs font-medium">
                                {uploadingCollectionCardIndex === index
                                  ? "Uploading..."
                                  : "Drop another image to replace"}
                              </span>
                              <span className="mt-1 text-[11px] text-gray-500">
                                or click to browse
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-medium">
                                {uploadingCollectionCardIndex === index
                                  ? "Uploading..."
                                  : "Drag & drop image here"}
                              </span>
                              <span className="mt-1 text-[11px] text-gray-500">
                                or click to browse
                              </span>
                            </>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingCollectionCardIndex !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              uploadCollectionCardImage(index, file)
                              e.target.value = ""
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {card.image_url && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            updateCollectionCard(index, {
                              image_url: "",
                            })
                          }
                          className="text-xs text-red-400 underline"
                        >
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Section"
                : "Add Section"}
          </button>
        </div>
      </form>
        )}

        {editorOpen && (
          <>
      {previewOpen && type === "product_showcase" && (
        <aside
          data-homepage-preview
          className="fixed z-[90] max-h-[calc(100vh-24px)] w-[920px] max-w-[calc(100vw-40px)] overflow-hidden border border-gray-700 bg-[#111111] shadow-2xl"
          style={{
            left:
              previewPosition.x > 0
                ? `${previewPosition.x}px`
                : undefined,
            top:
              previewPosition.y > 0
                ? `${previewPosition.y}px`
                : "96px",
            right:
              previewPosition.x > 0
                ? "auto"
                : "20px",
          }}
        >
          <div
            onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              isDraggingPreview
                ? "cursor-grabbing"
                : ""
            }`}
          >
            <div className="select-none">
              <p className="text-[12px] font-medium">
                ⋮⋮ Product Showcase Preview
              </p>
              <p className="mt-0.5 text-[10px] text-gray-500">
                Website preview · use the title arrows to move products
              </p>
            </div>

            <div
              className="flex items-center gap-2"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={resetPreviewPosition}
                className="border border-gray-600 px-2 py-1 text-[10px]"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(false)
                }
                className="border border-gray-600 px-2 py-1 text-[10px]"
              >
                Hide
              </button>
            </div>
          </div>

          <div
            className="max-h-[620px] overflow-y-auto bg-white px-5 py-6"
            style={{
              backgroundColor:
                showcaseBackground,
            }}
          >
            <div className="mb-7 text-center">
              {showcaseSubtitle && (
                <p className="mb-2 text-[8px] font-medium uppercase tracking-[0.22em] text-[#6e625a]">
                  {showcaseSubtitle}
                </p>
              )}

              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  aria-label="Previous preview products"
                  onClick={() =>
                    moveShowcasePreview(
                      "left"
                    )
                  }
                  className="inline-flex h-7 w-7 items-center justify-center bg-transparent text-[#29231d]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18 9 12l6-6" />
                  </svg>
                </button>

                <h3
                  className="text-[20px] font-normal tracking-[-0.02em] text-[#29231d]"
                  style={{
                    fontFamily:
                      "'Playfair Display', 'Times New Roman', serif",
                  }}
                >
                  {title ||
                    selectedCollection?.title ||
                    selectedCategory?.name ||
                    (showcaseSource ===
                    "new_arrivals"
                      ? "New Arrivals"
                      : "Featured Products")}
                </h3>

                <button
                  type="button"
                  aria-label="Next preview products"
                  onClick={() =>
                    moveShowcasePreview(
                      "right"
                    )
                  }
                  className="inline-flex h-7 w-7 items-center justify-center bg-transparent text-[#29231d]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <p
                className="mx-auto mt-2 w-fit border-b border-[#29231d]/60 pb-[2px] text-[8px] font-normal uppercase tracking-[0.14em] text-[#29231d]"
                style={{
                  fontFamily:
                    '"Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
              >
                Discover More
              </p>
            </div>

            {productsLoading ? (
              <div className="flex min-h-[260px] items-center justify-center text-[11px] text-gray-500">
                Loading products...
              </div>
            ) :
              (showcaseSource ===
                "collection" &&
                !selectedCollection) ||
              (showcaseSource ===
                "category" &&
                !selectedCategory) ||
              (showcaseSource ===
                "manual" &&
                showcaseManualProducts.length ===
                  0) ? (
              <div className="flex min-h-[260px] items-center justify-center px-8 text-center text-[11px] text-gray-500">
                Choose products for this source to preview the Product Showcase.
              </div>
            ) :
              previewProducts.length ===
              0 ? (
              <div className="flex min-h-[260px] items-center justify-center px-8 text-center text-[11px] text-gray-500">
                No products found for this source.
              </div>
            ) : (
              <div
                ref={
                  showcasePreviewRailRef
                }
                className="
                  flex
                  w-full
                  snap-x
                  snap-mandatory
                  gap-4
                  overflow-x-auto
                  overflow-y-hidden
                  scroll-smooth
                  [-ms-overflow-style:none]
                  [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                "
                style={{
                  overscrollBehaviorX:
                    "contain",
                }}
              >
                {previewProducts
                  .slice(
                    0,
                    Math.min(
                      Number(
                        showcaseProductCount
                      ) || 8,
                      16
                    )
                  )
                  .map((product) => {
                    const firstPrice =
                      product.variants?.find(
                        (variant) =>
                          variant.prices
                            ?.length
                      )?.prices?.[0]

                    const primaryImage =
                      getPreviewPrimaryImage(
                        product
                      )

                    const colors =
                      getPreviewColors(
                        product
                      ).slice(0, 6)

                    const resolvedTitle =
                      title ||
                      selectedCollection?.title ||
                      selectedCategory?.name ||
                      (showcaseSource ===
                      "new_arrivals"
                        ? "New Arrivals"
                        : "Featured Products")

                    const showNewIn =
                      showcaseSource ===
                        "new_arrivals" ||
                      /\bnew\b/i.test(
                        resolvedTitle
                      )

                    return (
                      <div
                        key={product.id}
                        data-showcase-preview-slide
                        className="w-[calc((100%_-_48px)/4)] shrink-0 snap-start"
                      >
                        <div className="relative aspect-[2/3] overflow-hidden bg-[#f7f7f5]">
                          {primaryImage ? (
                            <img
                              src={
                                primaryImage
                              }
                              alt={
                                product.title
                              }
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[9px] text-gray-400">
                              NO IMAGE
                            </div>
                          )}

                          {showNewIn && (
                            <span
                              className="absolute left-2 top-2 z-20 bg-white/80 px-1.5 py-1 text-[8px] font-normal tracking-[0.05em] text-[#29231d]"
                              style={{
                                fontFamily:
                                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
                              }}
                            >
                              New In
                            </span>
                          )}

                          {showcaseShowSwatches &&
                            colors.length >
                              0 && (
                              <div className="absolute right-2 top-2 flex gap-1">
                                {colors.map(
                                  (
                                    color
                                  ) => {
                                    const swatch =
                                      getPreviewSwatch(
                                        product,
                                        color
                                      )

                                    return (
                                      <span
                                        key={
                                          color
                                        }
                                        title={
                                          color
                                        }
                                        className="block h-[10px] w-[10px] overflow-hidden"
                                        style={
                                          swatch
                                            ? {
                                                backgroundImage:
                                                  `url("${swatch.imageUrl}")`,
                                                backgroundRepeat:
                                                  "no-repeat",
                                                backgroundSize:
                                                  `${Math.max(
                                                    1,
                                                    swatch.zoom
                                                  ) *
                                                    100}%`,
                                                backgroundPosition:
                                                  `${swatch.x}% ${swatch.y}%`,
                                              }
                                            : {
                                                backgroundColor:
                                                  "#d5d0ca",
                                              }
                                        }
                                      />
                                    )
                                  }
                                )}
                              </div>
                            )}
                        </div>

                        <div
                          className="mt-2 text-black"
                          style={{
                            fontFamily:
                              '"Helvetica Neue", Helvetica, Arial, sans-serif',
                          }}
                        >
                          <p className="truncate text-[10px] font-normal leading-4">
                            {product.title}
                          </p>

                          {showcaseShowPrice &&
                            firstPrice && (
                              <p className="text-[10px] font-normal leading-4">
                                {(
                                  firstPrice.currency_code ||
                                  ""
                                ).toUpperCase()}{" "}
                                {firstPrice.amount}
                              </p>
                            )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            <div className="mt-4 text-center text-[9px] text-gray-500">
              {previewProducts.length} product
              {previewProducts.length ===
              1
                ? ""
                : "s"}{" "}
              loaded ·{" "}
              {showcaseSource.replace(
                "_",
                " "
              )}
            </div>
          </div>
        </aside>
      )}




      {previewOpen && type === "shop_the_look" && (
        <div data-homepage-preview
          className="fixed z-[100] w-[430px] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{ left: previewPosition.x, top: previewPosition.y }}>
          <div className="flex cursor-move items-center justify-between border-b border-gray-700 px-4 py-3"
            onMouseDown={startPreviewDrag}>
            <div><p className="text-xs font-semibold">⋮⋮ Shop the Look Preview</p><p className="text-[10px] text-gray-500">Drag this header to move</p></div>
            <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={() => setPreviewOpen(false)}
              className="text-xs text-gray-400">Close</button>
          </div>
          <div className="bg-white p-3">
            <div className="relative h-[310px] overflow-hidden bg-gray-100">
              {shopImageUrl ? (
                <img src={shopImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: shopImagePosition }} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">Upload lifestyle image</div>
              )}
              {shopHotspots.map((hotspot, index) => (
                <div key={hotspot.id}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[8px] font-bold shadow"
                  style={{
                    left: `${hotspot.x}%`, top: `${hotspot.y}%`,
                    width: 22, height: 22,
                    backgroundColor: shopHotspotColor,
                    border: `2px solid ${shopHotspotRingColor}`,
                    color: shopHotspotRingColor,
                  }}>
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {previewOpen && type === "image_mosaic" && (
        <aside data-homepage-preview
          className="fixed z-[100] max-h-[calc(100vh-24px)] w-[430px] max-w-[calc(100vw-40px)] overflow-auto rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{ left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined, top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px", right: previewPosition.x > 0 ? "auto" : "20px" }}>
          <div onMouseDown={startPreviewDrag} className="flex cursor-grab items-center justify-between border-b border-gray-700 px-4 py-3">
            <div><p className="text-xs font-semibold">⋮⋮ Image Mosaic Preview</p><p className="text-[10px] text-gray-500">Drag this header to move</p></div>
            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>
          <div className="bg-white p-3" style={{ backgroundColor: mosaicBackground }}>
            {title && <p className="mb-3 text-center text-sm font-semibold text-black">{title}</p>}
            <div className="grid grid-cols-4 auto-rows-[70px]" style={{ gap: `${Math.min(16, Number(mosaicGap) || 0)}px` }}>
              {mosaicItems.filter((item) => item.image_url).map((item, index) => {
                const span = item.size === "large" ? "col-span-2 row-span-2" : item.size === "wide" ? "col-span-2 row-span-1" : item.size === "tall" ? "col-span-1 row-span-2" : "col-span-1 row-span-1"
                return <div key={index} className={`${span} overflow-hidden bg-gray-200`}>
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" style={{ objectPosition: item.image_position }} />
                </div>
              })}
              {!mosaicItems.some((item) => item.image_url) && <div className="col-span-4 flex h-40 items-center justify-center text-xs text-gray-500">Upload images to preview the mosaic</div>}
            </div>
          </div>
        </aside>
      )}


      {previewOpen && type === "featured_story" && (
        <div
          data-homepage-preview
          className="fixed z-[100] w-[430px] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{ left: previewPosition.x, top: previewPosition.y }}
        >
          <div
            className="flex cursor-move items-center justify-between border-b border-gray-700 px-4 py-3"
            onMouseDown={startPreviewDrag}
          >
            <div>
              <p className="text-xs font-semibold">⋮⋮ Featured Story Preview</p>
              <p className="text-[10px] text-gray-500">Drag this header to move</p>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setPreviewOpen(false)}
              className="text-xs text-gray-400"
            >
              Close
            </button>
          </div>

          <div className="bg-white p-3">
            {featuredLayout === "split" ? (
              <div className="grid min-h-[260px] grid-cols-2 overflow-hidden">
                <div className={featuredContentSide === "left" ? "order-2" : "order-1"}>
                  {featuredMediaUrl ? (
                    featuredMediaType === "video" ? (
                      <video src={featuredMediaUrl} muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <img src={featuredMediaUrl} alt="" className="h-full w-full object-cover"
                        style={{ objectPosition: featuredObjectPosition }} />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-xs text-gray-400">Media</div>
                  )}
                </div>

                <div
                  className={[
                    "flex p-5",
                    featuredContentSide === "left" ? "order-1" : "order-2",
                    featuredContentVertical === "top" ? "items-start" : featuredContentVertical === "bottom" ? "items-end" : "items-center",
                    featuredContentAlign === "center" ? "justify-center text-center" : featuredContentAlign === "right" ? "justify-end text-right" : "justify-start text-left",
                  ].join(" ")}
                  style={{ backgroundColor: featuredPanelBackground, color: featuredTextColor }}
                >
                  <div>
                    {featuredEyebrow && <p className="text-[8px] uppercase tracking-[.15em]" style={{ color: featuredEyebrowColor }}>{featuredEyebrow}</p>}
                    <p className="mt-2 leading-tight" style={{
                      fontFamily: featuredHeadingFont,
                      fontWeight: Number(featuredHeadingWeight),
                      fontSize: `${Math.max(15, Math.min(27, Number(featuredHeadingSize) * .4))}px`,
                    }}>
                      {featuredHeading || title || "Featured story"}
                    </p>
                    {featuredBody && <p className="mt-2 text-[9px] leading-4" style={{ fontFamily: featuredBodyFont }}>{featuredBody}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-[270px] overflow-hidden bg-gray-100" style={{ color: featuredTextColor }}>
                {featuredMediaUrl && (
                  featuredMediaType === "video"
                    ? <video src={featuredMediaUrl} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                    : <img src={featuredMediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: featuredObjectPosition }} />
                )}
                <div className="absolute inset-0" style={{
                  backgroundColor: featuredOverlayColor,
                  opacity: (Number(featuredOverlayOpacity) || 0) / 100,
                }} />
                <div className={[
                  "absolute inset-0 flex p-5",
                  featuredContentVertical === "top" ? "items-start" : featuredContentVertical === "bottom" ? "items-end" : "items-center",
                  featuredContentAlign === "center" ? "justify-center text-center" : featuredContentAlign === "right" ? "justify-end text-right" : "justify-start text-left",
                ].join(" ")}>
                  <div className="max-w-[80%]">
                    {featuredEyebrow && <p className="text-[8px] uppercase tracking-[.15em]" style={{ color: featuredEyebrowColor }}>{featuredEyebrow}</p>}
                    <p className="mt-2 leading-tight" style={{
                      fontFamily: featuredHeadingFont,
                      fontWeight: Number(featuredHeadingWeight),
                      fontSize: `${Math.max(16, Math.min(30, Number(featuredHeadingSize) * .42))}px`,
                    }}>
                      {featuredHeading || title || "Featured story"}
                    </p>
                    {featuredBody && <p className="mt-2 text-[9px] leading-4" style={{ fontFamily: featuredBodyFont }}>{featuredBody}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {previewOpen && type === "campaign_banner" && (
        <div
          className="fixed z-[100] w-[620px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{ left: previewPosition.x, top: previewPosition.y }}
        >
          <div
            className="flex cursor-move items-center justify-between border-b border-gray-700 px-4 py-3"
            onMouseDown={(event) => {
              setIsDraggingPreview(true)
              previewDragOffsetRef.current = {
                x: event.clientX - previewPosition.x,
                y: event.clientY - previewPosition.y,
              }
            }}
          >
            <div>
              <p className="text-xs font-semibold">LIVE PREVIEW</p>
              <p className="text-[10px] text-gray-500">
                Campaign Banner — responsive master
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setPreviewOpen(false)}
                className="text-xs text-gray-400"
              >
                Close
              </button>
            </div>
          </div>

          <div className="bg-[#E9E4DC] p-3">
            <div
              className="relative mx-auto overflow-hidden bg-gray-100"
              style={{
                width: "100%",
                aspectRatio:
                  `${1440 / Math.max(280, Number(campaignHeight) || 620)}`,
                color: campaignTextColor,
                backgroundColor: campaignMediaBackground,
              }}
            >
              {campaignMediaUrl && (
                campaignMediaType === "video" ? (
                  <video
                    src={campaignMediaUrl}
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full"
                    style={{
                      objectFit: campaignMediaFit as "cover" | "contain",
                      objectPosition: `${campaignFocalX}% ${campaignFocalY}%`,
                      transform: `scale(${Math.max(1, Number(campaignMediaZoom) || 1)})`,
                      transformOrigin: `${campaignFocalX}% ${campaignFocalY}%`,
                    }}
                  />
                ) : (
                  <img
                    src={campaignMediaUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full"
                    style={{
                      objectFit: campaignMediaFit as "cover" | "contain",
                      objectPosition: `${campaignFocalX}% ${campaignFocalY}%`,
                      transform: `scale(${Math.max(1, Number(campaignMediaZoom) || 1)})`,
                      transformOrigin: `${campaignFocalX}% ${campaignFocalY}%`,
                    }}
                  />
                )
              )}

              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: campaignOverlayColor,
                  opacity: (Number(campaignOverlayOpacity) || 0) / 100,
                }}
              />

              <div
                className={[
                  "absolute inset-0 flex",
                  campaignContentVertical === "top"
                    ? "items-start"
                    : campaignContentVertical === "bottom"
                      ? "items-end"
                      : "items-center",
                  campaignContentAlign === "left"
                    ? "justify-start"
                    : campaignContentAlign === "right"
                      ? "justify-end"
                      : "justify-center",
                  campaignTextAlign === "left"
                    ? "text-left"
                    : campaignTextAlign === "right"
                      ? "text-right"
                      : "text-center",
                ].join(" ")}
                style={{
                  padding: `${Math.max(
                    12,
                    Math.min(32, Number(campaignContentPadding) * 0.45)
                  )}px`,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth:
                      `${Math.max(
                        180,
                        Math.min(360, Number(campaignContentMaxWidth) * 0.5)
                      )}px`,
                  }}
                >
                  {campaignEyebrow && (
                    <p
                      className="text-[7px] uppercase tracking-[.14em]"
                      style={{ color: campaignEyebrowColor }}
                    >
                      {campaignEyebrow}
                    </p>
                  )}

                  <p
                    className="mt-2 whitespace-pre-line"
                    style={{
                      fontFamily: campaignHeadingFont,
                      fontWeight: Number(campaignHeadingWeight),
                      fontSize: `${Math.max(
                        14,
                        Math.min(
                          32,
                          Number(campaignHeadingSize) * 0.42
                        )
                      )}px`,
                      lineHeight: Number(campaignHeadingLineHeight) || 0.98,
                      letterSpacing: `${Number(campaignHeadingLetterSpacing) || 0}em`,
                    }}
                  >
                    {campaignHeading || title || "Campaign heading"}
                  </p>

                  {campaignDividerEnabled && (
                    <div
                      className={`mt-4 ${
                        campaignTextAlign === "center"
                          ? "mx-auto"
                          : campaignTextAlign === "right"
                            ? "ml-auto"
                            : ""
                      }`}
                      style={{
                        width: `${Math.max(20, Number(campaignDividerWidth) * 0.5)}px`,
                        height: `${Math.max(1, Number(campaignDividerThickness))}px`,
                        backgroundColor: campaignDividerColor,
                      }}
                    />
                  )}

                  {campaignBody && (
                    <p
                      className="mt-4 whitespace-pre-line"
                      style={{
                        fontFamily: campaignBodyFont,
                        fontSize: "9px",
                        lineHeight: Number(campaignBodyLineHeight) || 1.55,
                      }}
                    >
                      {campaignBody}
                    </p>
                  )}

                  {campaignPrimaryText && (
                    <span
                      className="mt-5 inline-flex items-center justify-center uppercase tracking-[.1em]"
                      style={{
                        background:
                          campaignPrimaryStyle === "filled"
                            ? campaignPrimaryBg
                            : "transparent",
                        color: campaignPrimaryColor,
                        border:
                          campaignPrimaryStyle === "outline"
                            ? `1px solid ${campaignPrimaryBorder}`
                            : campaignPrimaryStyle === "filled"
                              ? `1px solid ${campaignPrimaryBorder}`
                              : "0",
                        padding: "8px 14px",
                        fontSize: "8px",
                        borderRadius: `${Number(campaignButtonRadius) || 0}px`,
                      }}
                    >
                      {campaignPrimaryText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewOpen && type === "editorial_split" && (
        <div className="fixed z-[100] w-[430px] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{ left: previewPosition.x, top: previewPosition.y }}>
          <div className="flex cursor-move items-center justify-between border-b border-gray-700 px-4 py-3"
            onMouseDown={(event) => {
              setIsDraggingPreview(true)
              previewDragOffsetRef.current = { x: event.clientX - previewPosition.x, y: event.clientY - previewPosition.y }
            }}>
            <div><p className="text-xs font-semibold">LIVE PREVIEW</p><p className="text-[10px] text-gray-500">Editorial Split</p></div>
            <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={() => setPreviewOpen(false)} className="text-xs text-gray-400">Close</button>
          </div>
          <div className="bg-white p-3">
            <div className="grid min-h-[250px] grid-cols-2 overflow-hidden" style={{ backgroundColor: editorialBackground }}>
              <div className={editorialLayout === "image-right" ? "order-2" : "order-1"}>
                {editorialImageUrl ? <img src={editorialImageUrl} alt="" className="h-full w-full"
                  style={{ objectFit: editorialImageFit as "cover" | "contain", objectPosition: editorialImagePosition }} />
                  : <div className="flex h-full min-h-[250px] items-center justify-center bg-gray-100 text-xs text-gray-400">Image</div>}
              </div>
              <div className={[
                "flex p-5", editorialLayout === "image-right" ? "order-1" : "order-2",
                editorialContentVertical === "top" ? "items-start" : editorialContentVertical === "bottom" ? "items-end" : "items-center",
                editorialContentAlign === "center" ? "justify-center text-center" : editorialContentAlign === "right" ? "justify-end text-right" : "justify-start text-left",
              ].join(" ")}>
                <div>
                  {editorialEyebrow && <p className="text-[8px] uppercase tracking-[0.14em]" style={{ color: editorialEyebrowColor, fontFamily: editorialBodyFont }}>{editorialEyebrow}</p>}
                  <p className="mt-2 leading-tight" style={{
                    color: editorialTextColor, fontFamily: editorialHeadingFont, fontWeight: Number(editorialHeadingWeight),
                    fontSize: `${Math.max(14, Math.min(28, Number(editorialHeadingSize) * .42))}px`
                  }}>{editorialHeading || title || "Editorial heading"}</p>
                  {editorialBody && <p className="mt-3 text-[9px] leading-4" style={{ color: editorialTextColor, fontFamily: editorialBodyFont }}>{editorialBody}</p>}
                  {editorialButtonText && <span className="mt-4 inline-block uppercase tracking-[.1em]" style={{
                    fontFamily: editorialButtonFont, fontSize: "8px", color: editorialButtonColor,
                    backgroundColor: editorialButtonStyle === "filled" ? editorialButtonBg : "transparent",
                    border: editorialButtonStyle === "outline" ? `1px solid ${editorialButtonBorder}` : undefined,
                    borderBottom: editorialButtonStyle === "underline" ? `1px solid ${editorialButtonBorder}` : undefined,
                    borderRadius: `${Number(editorialButtonRadius)||0}px`,
                    padding: editorialButtonStyle === "filled" || editorialButtonStyle === "outline" ? "6px 10px" : "3px 0",
                  }}>{editorialButtonText}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewOpen && type === "collection_cards" && (
        <aside
          data-homepage-preview
          className="fixed z-[90] max-h-[calc(100vh-24px)] w-[430px] max-w-[calc(100vw-40px)] overflow-auto rounded-xl border border-gray-700 bg-[#111111] shadow-2xl"
          style={{
            left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined,
            top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px",
            right: previewPosition.x > 0 ? "auto" : "20px",
          }}
        >
          <div
            onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              isDraggingPreview ? "cursor-grabbing" : ""
            }`}
          >
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Collection Cards Preview</p>
              <p className="text-[11px] text-gray-500">Drag this header to move</p>
            </div>
            <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>

          <div className="p-4" style={{ backgroundColor: collectionCardsBackground }}>
            {title && <p className="mb-4 text-center text-lg font-semibold text-black">{title}</p>}
            <div
              className="grid"
              style={{
                gap: `${Number(collectionCardsGap) || 0}px`,
                gridTemplateColumns: `repeat(${Math.min(4, Number(collectionCardsDesktopColumns) || 3)}, minmax(0, 1fr))`,
              }}
            >
              {collectionCards.map((card, index) => {
                const selected = collections.find((item) => item.handle === card.collection_handle)
                const heading = card.title || selected?.title || `Collection ${index + 1}`
                const ratio = collectionCardsImageRatio === "square"
                  ? "1 / 1"
                  : collectionCardsImageRatio === "landscape"
                    ? "4 / 3"
                    : collectionCardsImageRatio === "editorial"
                      ? "3 / 4"
                      : "2 / 3"

                return (
                  <div key={index} className="relative overflow-hidden bg-[#e8e8e8]" style={{ aspectRatio: ratio }}>
                    {card.image_url ? (
                      <img src={card.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-gray-500">Upload image</div>
                    )}
                    <div className="absolute inset-0 bg-black" style={{ opacity: (Number(collectionCardsOverlayOpacity) || 0) / 100 }} />
                    <div className={`absolute inset-0 flex p-3 text-white ${
                      collectionCardsTextPosition === "top-left"
                        ? "items-start justify-start text-left"
                        : collectionCardsTextPosition === "top-center"
                          ? "items-start justify-center text-center"
                          : collectionCardsTextPosition === "top-right"
                            ? "items-start justify-end text-right"
                            : collectionCardsTextPosition === "center-left"
                              ? "items-center justify-start text-left"
                              : collectionCardsTextPosition === "center"
                                ? "items-center justify-center text-center"
                                : collectionCardsTextPosition === "center-right"
                                  ? "items-center justify-end text-right"
                                  : collectionCardsTextPosition === "bottom-right"
                                    ? "items-end justify-end text-right"
                                    : collectionCardsTextPosition === "bottom-center"
                                      ? "items-end justify-center text-center"
                                      : "items-end justify-start text-left"
                    }`}>
                      <div
                        style={{
                          transform: `translate(${card.content_offset_x || 0}px, ${card.content_offset_y || 0}px)`,
                        }}
                      >
                        <p
                          style={{
                            color: collectionCardsTitleColor,
                            fontSize: `${Math.min(Number(collectionCardsTitleSize) || 30, 32) * 0.42}px`,
                            fontWeight: Number(collectionCardsTitleWeight) || 500,
                          }}
                        >
                          {heading}
                        </p>

                        {card.subtitle && (
                          <p
                            className="mt-1"
                            style={{
                              color: collectionCardsSubtitleColor,
                              fontSize: `${Math.min(Number(collectionCardsSubtitleSize) || 14, 18) * 0.55}px`,
                            }}
                          >
                            {card.subtitle}
                          </p>
                        )}

                        {card.button_text && (
                          <span
                            className="mt-2 inline-block"
                            style={{
                              color: collectionCardsButtonTextColor,
                              background:
                                collectionCardsButtonStyle === "filled"
                                  ? collectionCardsButtonBgColor
                                  : "transparent",
                              border:
                                collectionCardsButtonStyle === "outline"
                                  ? `1px solid ${collectionCardsButtonBorderColor}`
                                  : "none",
                              borderBottom:
                                collectionCardsButtonStyle === "underline"
                                  ? `1px solid ${collectionCardsButtonBorderColor}`
                                  : undefined,
                              borderRadius: `${Number(collectionCardsButtonRadius) || 0}px`,
                              padding:
                                collectionCardsButtonStyle === "filled" ||
                                collectionCardsButtonStyle === "outline"
                                  ? "5px 8px"
                                  : "2px 0",
                              fontSize: "8px",
                            }}
                          >
                            {card.button_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      )}





      {previewOpen && type === "spacer" && (
        <aside
          data-homepage-preview
          className="fixed z-[100] w-[620px] max-w-[calc(100vw-40px)] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{
            left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined,
            top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px",
            right: previewPosition.x > 0 ? "auto" : "20px",
          }}
        >
          <div
            onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              isDraggingPreview ? "cursor-grabbing" : ""
            }`}
          >
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Spacer / Divider Preview</p>
              <p className="text-[11px] text-gray-500">Live height, divider and background preview</p>
            </div>
            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition}
                className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)}
                className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>

          <div className="bg-[#242428] p-5">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-gray-400">Section above</div>
            <div className="h-10 rounded bg-[#35353a]" />

            <div
              className="relative flex items-center justify-center"
              style={{
                height: `${Math.max(20, Math.min(260, Number(spacerHeight) || 64))}px`,
                marginTop: `${Math.min(60, Number(spacerTopSpacing) || 0)}px`,
                marginBottom: `${Math.min(60, Number(spacerBottomSpacing) || 0)}px`,
                backgroundColor: spacerBackground,
              }}
            >
              {spacerShowDivider && (
                <div
                  style={{
                    width: `${Math.max(1, Math.min(100, Number(spacerDividerWidth) || 100))}%`,
                    borderTopWidth: `${Math.max(1, Number(spacerDividerThickness) || 1)}px`,
                    borderTopStyle: spacerDividerStyle as React.CSSProperties["borderTopStyle"],
                    borderTopColor: spacerDividerColor,
                  }}
                />
              )}
            </div>

            <div className="h-10 rounded bg-[#35353a]" />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-gray-400">Section below</div>
          </div>
        </aside>
      )}

      {previewOpen && type === "editorial_text" && (
        <aside data-homepage-preview
          className="fixed z-[100] max-h-[calc(100vh-24px)] w-[620px] max-w-[calc(100vw-40px)] overflow-auto rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{
            left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined,
            top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px",
            right: previewPosition.x > 0 ? "auto" : "20px",
          }}>
          <div onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${isDraggingPreview ? "cursor-grabbing" : ""}`}>
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Editorial Text Preview</p>
              <p className="text-[11px] text-gray-500">Live typography, alignment and colors</p>
            </div>
            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>
          <div className="p-8"
            style={{
              backgroundColor: editorialTextBackground,
              color: editorialTextMainColor,
              textAlign: editorialTextAlign as React.CSSProperties["textAlign"],
            }}>
            <div className={editorialTextAlign === "center" ? "mx-auto" : editorialTextAlign === "right" ? "ml-auto" : ""}
              style={{ maxWidth: `${Math.min(Number(editorialTextMaxWidth) || 900, 900) * 0.55}px` }}>
              {editorialTextEyebrow && <p className="uppercase tracking-[0.16em]"
                style={{ color: editorialTextAccentColor, fontFamily: editorialTextBodyFont, fontSize: 9 }}>
                {editorialTextEyebrow}
              </p>}
              {(editorialTextHeading || title) && <h2 className="mt-3 leading-[1.08]"
                style={{
                  fontFamily: editorialTextHeadingFont,
                  fontWeight: Number(editorialTextHeadingWeight) || 500,
                  fontSize: `${Math.min(Number(editorialTextHeadingSize) || 52, 64) * 0.55}px`,
                }}>
                {editorialTextHeading || title}
              </h2>}
              {editorialTextBody && <p className="mt-5 whitespace-pre-line leading-6"
                style={{ fontFamily: editorialTextBodyFont, fontSize: `${Math.min(Number(editorialTextBodySize) || 17, 22) * 0.7}px` }}>
                {editorialTextBody}
              </p>}
              {editorialTextQuote && <blockquote className="mt-6 border-l-2 pl-4 italic"
                style={{
                  borderColor: editorialTextAccentColor,
                  fontFamily: editorialTextHeadingFont,
                  fontSize: `${Math.min(Number(editorialTextQuoteSize) || 28, 40) * 0.55}px`,
                }}>
                {editorialTextQuote}
              </blockquote>}
              {editorialTextButtonText && <span className="mt-6 inline-flex uppercase tracking-[0.12em]"
                style={{
                  color: editorialTextButtonColor,
                  backgroundColor: editorialTextButtonStyle === "filled" ? editorialTextButtonBg : "transparent",
                  border: editorialTextButtonStyle === "outline" ? `1px solid ${editorialTextButtonBorder}` : undefined,
                  borderBottom: editorialTextButtonStyle === "underline" ? `1px solid ${editorialTextButtonBorder}` : undefined,
                  padding: editorialTextButtonStyle === "filled" || editorialTextButtonStyle === "outline" ? "8px 13px" : "3px 0",
                  fontSize: 9,
                }}>
                {editorialTextButtonText}
              </span>}
            </div>
          </div>
        </aside>
      )}

      {previewOpen && type === "category_showcase" && (
        <aside
          data-homepage-preview
          className="fixed z-[100] max-h-[calc(100vh-24px)] w-[520px] max-w-[calc(100vw-40px)] overflow-auto rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{
            left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined,
            top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px",
            right: previewPosition.x > 0 ? "auto" : "20px",
          }}
        >
          <div
            onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              isDraggingPreview ? "cursor-grabbing" : ""
            }`}
          >
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Category Showcase Preview</p>
              <p className="text-[11px] text-gray-500">Drag this header to move</p>
            </div>
            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>

          <div className="p-4" style={{ backgroundColor: categoryBackground }}>
            {title && <p className="mb-4 text-center text-lg font-semibold text-black">{title}</p>}
            <div
              className="grid"
              style={{
                gap: `${Number(categoryGap) || 0}px`,
                gridTemplateColumns: `repeat(${Math.min(4, Number(categoryDesktopColumns) || 4)}, minmax(0, 1fr))`,
              }}
            >
              {categoryItems.map((item, index) => {
                const ratio =
                  categoryImageRatio === "square"
                    ? "1 / 1"
                    : categoryImageRatio === "landscape"
                      ? "4 / 3"
                      : categoryImageRatio === "editorial"
                        ? "3 / 5"
                        : "4 / 5"

                const position =
                  categoryTextPosition === "top-left"
                    ? "items-start justify-start text-left"
                    : categoryTextPosition === "top-center"
                      ? "items-center justify-start text-center"
                      : categoryTextPosition === "center"
                        ? "items-center justify-center text-center"
                        : categoryTextPosition === "bottom-center"
                          ? "items-center justify-end text-center"
                          : categoryTextPosition === "bottom-right"
                            ? "items-end justify-end text-right"
                            : "items-start justify-end text-left"

                return (
                  <div key={item.id} className="relative overflow-hidden bg-gray-200" style={{ aspectRatio: ratio }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-gray-500">
                        Category {index + 1}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black" style={{ opacity: (Number(categoryOverlayOpacity) || 0) / 100 }} />
                    <div className={`absolute inset-0 flex flex-col p-3 ${position}`} style={{ color: categoryTextColor }}>
                      <div>
                        <p className="leading-tight" style={{ fontSize: `${Math.min(Number(categoryTitleSize) || 28, 34) * 0.45}px` }}>
                          {item.title || `Category ${index + 1}`}
                        </p>
                        {item.subtitle && (
                          <p className="mt-1 opacity-90" style={{ fontSize: `${Math.min(Number(categorySubtitleSize) || 14, 18) * 0.6}px` }}>
                            {item.subtitle}
                          </p>
                        )}
                        {item.button_text && (
                          <span
                            className="mt-2 inline-flex uppercase tracking-[0.12em]"
                            style={{
                              color: categoryButtonColor,
                              backgroundColor: categoryButtonBg,
                              border: `1px solid ${categoryButtonBorder}`,
                              borderRadius: 0,
                              padding: "7px 12px",
                              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                              fontSize: "8px",
                              fontWeight: 400,
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                            }}
                          >
                            {item.button_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      )}

      {previewOpen && type === "marquee" && (
        <aside
          data-homepage-preview
          className="fixed z-[100] w-[620px] max-w-[calc(100vw-40px)] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{
            left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined,
            top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px",
            right: previewPosition.x > 0 ? "auto" : "20px",
          }}
        >
          <div
            onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              isDraggingPreview ? "cursor-grabbing" : ""
            }`}
          >
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Marquee Preview</p>
              <p className="text-[11px] text-gray-500">Live speed, direction, font and colors</p>
            </div>
            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>

          <div className="overflow-hidden py-8 bg-white">
            <div
              className="admin-marquee-preview-track flex w-max items-center whitespace-nowrap"
              style={{
                animationName: marqueeDirection === "right" ? "admin-marquee-right" : "admin-marquee-left",
                animationDuration: `${Math.max(5, Number(marqueeSpeed) || 28)}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                backgroundColor: marqueeBackground,
                color: marqueeTextColor,
                paddingTop: `${Number(marqueePaddingY) || 0}px`,
                paddingBottom: `${Number(marqueePaddingY) || 0}px`,
                fontFamily: marqueeFont,
                fontSize: `${Number(marqueeFontSize) || 18}px`,
                fontWeight: Number(marqueeFontWeight) || 500,
                letterSpacing: `${Number(marqueeLetterSpacing) || 0}px`,
                textTransform: marqueeTextTransform as React.CSSProperties["textTransform"],
              }}
              onMouseEnter={(e) => {
                if (marqueePauseOnHover) e.currentTarget.style.animationPlayState = "paused"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animationPlayState = "running"
              }}
            >
              {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems]
                .filter(Boolean)
                .map((message, index) => (
                  <div key={`${message}-${index}`} className="flex shrink-0 items-center">
                    <span>{message}</span>
                    <span
                      style={{
                        color: marqueeSeparatorColor,
                        marginLeft: `${Number(marqueeItemGap) || 0}px`,
                        marginRight: `${Number(marqueeItemGap) || 0}px`,
                      }}
                    >
                      {marqueeSeparator}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <style>{`
            @keyframes admin-marquee-left {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            @keyframes admin-marquee-right {
              from { transform: translateX(-50%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </aside>
      )}

      {previewOpen && type === "video_story" && (
        <aside
          data-homepage-preview
          className="fixed z-[100] w-[560px] max-w-[calc(100vw-40px)] overflow-hidden rounded-xl border border-gray-700 bg-[#111114] shadow-2xl"
          style={{
            left: previewPosition.x > 0 ? `${previewPosition.x}px` : undefined,
            top: previewPosition.y > 0 ? `${previewPosition.y}px` : "96px",
            right: previewPosition.x > 0 ? "auto" : "20px",
          }}
        >
          <div
            onMouseDown={startPreviewDrag}
            className={`flex cursor-grab items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              isDraggingPreview ? "cursor-grabbing" : ""
            }`}
          >
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Video Story Preview</p>
              <p className="text-[11px] text-gray-500">Drag this header to move</p>
            </div>
            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={resetPreviewPosition} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Reset</button>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-gray-600 px-2 py-1 text-[11px]">Hide</button>
            </div>
          </div>

          <div className="bg-white p-3">
            <div
              className="relative overflow-hidden bg-gray-200"
              style={{ height: `${Math.max(280, Math.min(520, (Number(videoStoryDesktopHeight) || 760) * 0.55))}px` }}
            >
              {videoStoryVideoUrl ? (
                <video
                  src={videoStoryVideoUrl}
                  poster={videoStoryPosterUrl || undefined}
                  autoPlay={videoStoryAutoplay}
                  muted={videoStoryMuted}
                  loop={videoStoryLoop}
                  controls={videoStoryControls}
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: videoStoryObjectPosition }}
                />
              ) : videoStoryPosterUrl ? (
                <img
                  src={videoStoryPosterUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: videoStoryObjectPosition }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-500">Upload video or poster</div>
              )}

              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: videoStoryOverlayColor,
                  opacity: (Number(videoStoryOverlayOpacity) || 0) / 100,
                }}
              />

              <div
                className={`absolute inset-0 flex flex-col p-7 ${
                  videoStoryContentVertical === "top"
                    ? "justify-start"
                    : videoStoryContentVertical === "bottom"
                      ? "justify-end"
                      : "justify-center"
                } ${
                  videoStoryContentAlign === "left"
                    ? "items-start text-left"
                    : videoStoryContentAlign === "right"
                      ? "items-end text-right"
                      : "items-center text-center"
                }`}
                style={{ color: videoStoryTextColor }}
              >
                <div className="max-w-[420px]">
                  {(videoStoryHeading || title) && (
                    <p
                      className="leading-[1.05]"
                      style={{
                        fontFamily: videoStoryHeadingFont,
                        fontSize: `${Math.min(Number(videoStoryHeadingSize) || 60, 64) * 0.55}px`,
                      }}
                    >
                      {videoStoryHeading || title}
                    </p>
                  )}
                  {videoStorySubtitle && (
                    <p
                      className="mt-3 leading-6"
                      style={{
                        fontFamily: videoStoryBodyFont,
                        fontSize: `${Math.min(Number(videoStorySubtitleSize) || 16, 20) * 0.75}px`,
                      }}
                    >
                      {videoStorySubtitle}
                    </p>
                  )}
                  {videoStoryButtonText && (
                    <span
                      className="mt-5 inline-flex uppercase tracking-[0.12em]"
                      style={{
                        color: videoStoryButtonColor,
                        backgroundColor: videoStoryButtonStyle === "filled" ? videoStoryButtonBg : "transparent",
                        border: videoStoryButtonStyle === "outline" ? `1px solid ${videoStoryButtonBorder}` : undefined,
                        borderBottom: videoStoryButtonStyle === "underline" ? `1px solid ${videoStoryButtonBorder}` : undefined,
                        padding: videoStoryButtonStyle === "filled" || videoStoryButtonStyle === "outline" ? "9px 14px" : "3px 0",
                        fontSize: "9px",
                      }}
                    >
                      {videoStoryButtonText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}



      {!previewOpen && type === "spacer" && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl"
        >
          Open Spacer Preview
        </button>
      )}

      {!previewOpen && type === "editorial_text" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Editorial Text Preview
        </button>
      )}

      {!previewOpen && type === "category_showcase" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Category Preview
        </button>
      )}

      {!previewOpen && type === "marquee" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Marquee Preview
        </button>
      )}

      {!previewOpen && type === "video_story" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Video Story Preview
        </button>
      )}

      {!previewOpen && type === "shop_the_look" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Shop the Look Preview
        </button>
      )}

      {!previewOpen && type === "image_mosaic" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Mosaic Preview
        </button>
      )}


      {!previewOpen && type === "featured_story" && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl"
        >
          Open Featured Story Preview
        </button>
      )}

      {!previewOpen && type === "campaign_banner" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Campaign Preview
        </button>
      )}

      {!previewOpen && type === "editorial_split" && (
        <button type="button" onClick={() => setPreviewOpen(true)}
          className="fixed bottom-5 right-5 z-[100] rounded-full border border-gray-700 bg-[#111114] px-4 py-3 text-xs shadow-xl">
          Open Editorial Preview
        </button>
      )}

      {!previewOpen && type === "collection_cards" && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed right-5 top-28 z-[90] rounded-full border border-gray-600 bg-[#1b1b1f] px-4 py-2 text-sm shadow-xl"
        >
          Show Preview
        </button>
      )}

      {!previewOpen && type === "product_showcase" && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed right-5 top-28 z-[90] rounded-full border border-gray-600 bg-[#1b1b1f] px-4 py-2 text-sm shadow-xl"
        >
          Show Preview
        </button>
      )}

          </>
        )}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Homepage Sections",
})

export default HomepageSectionsPage
