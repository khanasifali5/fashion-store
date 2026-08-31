"use server"

import { sdk } from "@lib/config"

export type MegaMenuPromo = {
  id: string
  menu_key: string
  position: number
  title: string | null
  subtitle: string | null
  image_url: string | null

  object_position?: string | null
  image_focus_x?: number | null
  image_focus_y?: number | null

  title_font_family?: string | null
  title_font_style?: string | null
  title_text_transform?: string | null
  title_color?: string | null
  title_size?: number | null
  title_weight?: number | null
  title_letter_spacing?: number | null
  title_line_height?: number | null
  title_offset_x?: number | null
  title_offset_y?: number | null

  subtitle_font_family?: string | null
  subtitle_font_style?: string | null
  subtitle_text_transform?: string | null
  subtitle_color?: string | null
  subtitle_size?: number | null
  subtitle_weight?: number | null
  subtitle_letter_spacing?: number | null
  subtitle_line_height?: number | null
  subtitle_offset_x?: number | null
  subtitle_offset_y?: number | null

  text_align?: string | null
  horizontal_position?: string | null
  vertical_position?: string | null
  content_offset_x?: number | null
  content_offset_y?: number | null

  overlay_color?: string | null
  overlay_opacity?: number | null

  button_text: string | null
  button_url: string | null
  button_bg_color?: string | null
  button_text_color?: string | null
  button_size?: number | null
  button_offset_x?: number | null
  button_offset_y?: number | null

  is_active: boolean
}

export const listMegaMenuPromos = async (): Promise<MegaMenuPromo[]> => {
  try {
    const response = await sdk.client.fetch<{
      mega_menu_promos: MegaMenuPromo[]
    }>("/store/mega-menu-promos", {
      method: "GET",
      cache: "no-store",
    })

    return response.mega_menu_promos ?? []
  } catch (error) {
    console.error("Failed to load mega menu promos:", error)
    return []
  }
}