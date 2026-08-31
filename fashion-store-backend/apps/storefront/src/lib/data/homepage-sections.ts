"use server"

import { sdk } from "@lib/config"

export type ProductShowcaseConfig = {
  collection_handle?: string | null
  subtitle?: string | null
  layout?: "grid" | "carousel"
  desktop_columns?: number
  mobile_columns?: number
  product_count?: number
  image_ratio?: "portrait" | "square" | "landscape" | "editorial"
  width?: "contained" | "wide" | "full"
  top_spacing?: number
  bottom_spacing?: number
  background?: string
  show_price?: boolean
  show_badge?: boolean
  show_swatches?: boolean
  show_quick_add?: boolean
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type CollectionCardConfigItem = {
  collection_handle?: string | null
  title?: string | null
  subtitle?: string | null
  image_url?: string | null
  button_text?: string | null
  custom_url?: string | null
  content_offset_x?: number
  content_offset_y?: number
}

export type CollectionCardsConfig = {
  cards?: CollectionCardConfigItem[]
  desktop_columns?: number
  mobile_columns?: number
  image_ratio?: "portrait" | "square" | "landscape" | "editorial"
  width?: "contained" | "wide" | "full"
  top_spacing?: number
  bottom_spacing?: number
  gap?: number
  background?: string
  text_position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
  overlay_opacity?: number

  title_color?: string
  title_size?: number
  title_mobile_size?: number
  title_weight?: number
  subtitle_color?: string
  subtitle_size?: number

  button_style?: "filled" | "outline" | "underline" | "text"
  button_bg_color?: string
  button_text_color?: string
  button_border_color?: string
  button_size?: number
  button_radius?: number
  button_padding_x?: number
  button_padding_y?: number

  desktop_visible?: boolean
  mobile_visible?: boolean
}


export type EditorialSplitConfig = {
  layout?: "image-left" | "image-right"
  width?: "contained" | "wide" | "full"
  min_height?: number
  image_url?: string | null
  image_alt?: string | null
  image_fit?: "cover" | "contain"
  image_position?: "center" | "top" | "bottom" | "left" | "right"
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  button_text?: string | null
  button_url?: string | null
  content_align?: "left" | "center" | "right"
  content_vertical?: "top" | "center" | "bottom"
  content_padding?: number
  background?: string
  text_color?: string
  eyebrow_color?: string
  heading_font?: string
  heading_size?: number
  heading_mobile_size?: number
  heading_weight?: number
  body_font?: string
  body_size?: number
  button_font?: string
  button_style?: "filled" | "outline" | "underline" | "text"
  button_bg?: string
  button_color?: string
  button_border?: string
  button_radius?: number
  button_size?: number
  button_padding_x?: number
  button_padding_y?: number
  top_spacing?: number
  bottom_spacing?: number
  mobile_order?: "image-first" | "content-first"
  desktop_visible?: boolean
  mobile_visible?: boolean
}


export type CampaignBannerConfig = {
  media_type?: "image" | "video"
  media_url?: string | null
  media_alt?: string | null
  object_position?: "center" | "top" | "bottom" | "left" | "right"
  height?: number
  mobile_height?: number
  width?: "contained" | "wide" | "full"
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  primary_text?: string | null
  primary_url?: string | null
  secondary_text?: string | null
  secondary_url?: string | null
  content_align?: "left" | "center" | "right"
  content_vertical?: "top" | "center" | "bottom"
  content_padding?: number
  overlay_color?: string
  overlay_opacity?: number
  text_color?: string
  eyebrow_color?: string
  heading_font?: string
  heading_size?: number
  heading_mobile_size?: number
  heading_weight?: number
  body_font?: string
  body_size?: number
  button_font?: string
  primary_style?: "filled" | "outline" | "underline" | "text"
  primary_bg?: string
  primary_color?: string
  primary_border?: string
  secondary_style?: "filled" | "outline" | "underline" | "text"
  secondary_color?: string
  secondary_border?: string
  button_radius?: number
  button_size?: number
  button_padding_x?: number
  button_padding_y?: number
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type ImageMosaicItem = {
  image_url?: string | null
  image_alt?: string | null
  link_url?: string | null
  size?: "small" | "wide" | "tall" | "large"
  image_position?: "center" | "top" | "bottom" | "left" | "right"
}

export type ImageMosaicConfig = {
  items?: ImageMosaicItem[]
  width?: "contained" | "wide" | "full"
  desktop_columns?: number
  mobile_columns?: number
  row_height?: number
  mobile_row_height?: number
  gap?: number
  background?: string
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}


export type ShopTheLookHotspot = {
  id?: string
  x?: number
  y?: number
  product_id?: string | null
  product_handle?: string | null
  product_title?: string | null
  product_thumbnail?: string | null
  price_label?: string | null
  label?: string | null
}

export type ShopTheLookConfig = {
  image_url?: string | null
  image_alt?: string | null
  image_position?: "center" | "top" | "bottom" | "left" | "right"
  width?: "contained" | "wide" | "full"
  desktop_height?: number
  mobile_height?: number
  background?: string
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
  show_product_card?: boolean
  hotspot_color?: string
  hotspot_ring_color?: string
  hotspot_size?: number
  hotspots?: ShopTheLookHotspot[]
}


export type SpacerConfig = {
  height?: number
  mobile_height?: number
  show_divider?: boolean
  divider_thickness?: number
  divider_width?: number
  divider_style?: "solid" | "dashed" | "dotted"
  divider_color?: string
  background?: string
  width?: "contained" | "wide" | "full"
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type EditorialTextConfig = {
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  quote?: string | null
  button_text?: string | null
  button_url?: string | null
  align?: "left" | "center" | "right"
  width?: "contained" | "wide" | "full"
  max_width?: number
  background?: string
  text_color?: string
  accent_color?: string
  heading_font?: string
  body_font?: string
  heading_size?: number
  mobile_heading_size?: number
  body_size?: number
  quote_size?: number
  heading_weight?: number
  button_style?: "filled" | "outline" | "underline" | "text"
  button_bg?: string
  button_color?: string
  button_border?: string
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type VideoStoryConfig = {
  video_url?: string | null
  poster_url?: string | null
  heading?: string | null
  subtitle?: string | null
  button_text?: string | null
  button_url?: string | null
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  object_position?: "center" | "top" | "bottom" | "left" | "right"
  width?: "contained" | "wide" | "full"
  desktop_height?: number
  mobile_height?: number
  content_align?: "left" | "center" | "right"
  content_vertical?: "top" | "center" | "bottom"
  overlay_color?: string
  overlay_opacity?: number
  text_color?: string
  heading_font?: string
  heading_size?: number
  mobile_heading_size?: number
  body_font?: string
  subtitle_size?: number
  button_style?: "filled" | "outline" | "underline" | "text"
  button_bg?: string
  button_color?: string
  button_border?: string
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type MarqueeConfig = {
  items?: string[]
  speed?: number
  direction?: "left" | "right"
  pause_on_hover?: boolean
  separator?: string
  font?: string
  font_size?: number
  mobile_font_size?: number
  font_weight?: number
  letter_spacing?: number
  text_transform?: "none" | "uppercase" | "lowercase" | "capitalize"
  background?: string
  text_color?: string
  separator_color?: string
  padding_y?: number
  item_gap?: number
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type CategoryShowcaseItem = {
  title?: string | null
  subtitle?: string | null
  image_url?: string | null
  image_alt?: string | null
  link_url?: string | null
  button_text?: string | null
}

export type CategoryShowcaseConfig = {
  items?: CategoryShowcaseItem[]
  desktop_columns?: number
  mobile_columns?: number
  image_ratio?: "portrait" | "square" | "landscape" | "editorial"
  width?: "contained" | "wide" | "full"
  gap?: number
  background?: string
  top_spacing?: number
  bottom_spacing?: number
  overlay_opacity?: number
  text_position?: "top-left" | "top-center" | "center" | "bottom-left" | "bottom-center" | "bottom-right"
  text_color?: string
  title_size?: number
  subtitle_size?: number
  button_style?: "filled" | "outline" | "underline" | "text"
  button_bg?: string
  button_color?: string
  button_border?: string
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type FeaturedStoryConfig = {
  layout?: "overlay" | "split"
  media_type?: "image" | "video"
  media_url?: string | null
  media_alt?: string | null
  object_position?: "center" | "top" | "bottom" | "left" | "right"
  width?: "contained" | "wide" | "full"
  desktop_height?: number
  mobile_height?: number
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  button_text?: string | null
  button_url?: string | null
  content_align?: "left" | "center" | "right"
  content_vertical?: "top" | "center" | "bottom"
  content_side?: "left" | "right"
  content_max_width?: number
  content_padding?: number
  overlay_color?: string
  overlay_opacity?: number
  panel_background?: string
  text_color?: string
  eyebrow_color?: string
  heading_font?: string
  heading_size?: number
  heading_mobile_size?: number
  heading_weight?: number
  body_font?: string
  body_size?: number
  button_font?: string
  button_style?: "filled" | "outline" | "underline" | "text"
  button_bg?: string
  button_color?: string
  button_border?: string
  button_radius?: number
  button_size?: number
  button_padding_x?: number
  button_padding_y?: number
  top_spacing?: number
  bottom_spacing?: number
  desktop_visible?: boolean
  mobile_visible?: boolean
}

export type HomepageSection = {
  id: string
  type: string
  title?: string | null
  position: number
  is_active: boolean
  config?:
    | ProductShowcaseConfig
    | CollectionCardsConfig
    | EditorialSplitConfig
    | CampaignBannerConfig
    | ImageMosaicConfig
    | ShopTheLookConfig
    | FeaturedStoryConfig
    | CategoryShowcaseConfig
    | MarqueeConfig
    | VideoStoryConfig
    | EditorialTextConfig
    | SpacerConfig
    | Record<string, unknown>
    | null
}

export const listHomepageSections = async (): Promise<
  HomepageSection[]
> => {
  try {
    const response = await sdk.client.fetch<{
      homepage_sections: HomepageSection[]
    }>("/store/homepage-sections", {
      method: "GET",
      cache: "no-store",
    })

    return response.homepage_sections ?? []
  } catch (error) {
    console.error(
      "Failed to load homepage sections:",
      error
    )

    return []
  }
}