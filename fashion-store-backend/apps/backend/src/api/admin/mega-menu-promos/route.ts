import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MEGA_MENU_PROMO_MODULE } from "../../../modules/mega-menu-promo"
import MegaMenuPromoModuleService from "../../../modules/mega-menu-promo/service"

type MegaMenuPromoBody = {
  menu_key: string
  title?: string | null
  subtitle?: string | null

  image_url: string
  object_position?: string
  image_focus_x?: number
  image_focus_y?: number

  title_font_family?: string
  title_font_style?: string
  title_text_transform?: string
  title_color?: string
  title_size?: number
  title_weight?: number
  title_letter_spacing?: number
  title_line_height?: number
  title_offset_x?: number
  title_offset_y?: number

  subtitle_font_family?: string
  subtitle_font_style?: string
  subtitle_text_transform?: string
  subtitle_color?: string
  subtitle_size?: number
  subtitle_weight?: number
  subtitle_letter_spacing?: number
  subtitle_line_height?: number
  subtitle_offset_x?: number
  subtitle_offset_y?: number

  text_align?: string
  horizontal_position?: string
  vertical_position?: string
  content_offset_x?: number
  content_offset_y?: number

  overlay_color?: string
  overlay_opacity?: number

  button_text?: string | null
  button_url?: string | null
  button_bg_color?: string
  button_text_color?: string
  button_size?: number
  button_offset_x?: number
  button_offset_y?: number

  position?: number
  is_active?: boolean
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<MegaMenuPromoModuleService>(
        MEGA_MENU_PROMO_MODULE
      )

    const promos = await (service as any).listMegaMenuPromos()

    res.json({
      mega_menu_promos: promos,
    })
  } catch (error) {
    console.error("ADMIN MEGA MENU GET ERROR:", error)

    res.status(500).json({
      message: "Failed to load mega menu promos",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<MegaMenuPromoModuleService>(
        MEGA_MENU_PROMO_MODULE
      )

    const body = req.body as MegaMenuPromoBody

    if (!body.menu_key || !body.image_url) {
      return res.status(400).json({
        message: "menu_key and image_url are required",
      })
    }

    const promo = await (service as any).createMegaMenuPromos({
      menu_key: body.menu_key,
      title: body.title ?? null,
      subtitle: body.subtitle ?? null,

      image_url: body.image_url,
      object_position: body.object_position ?? "center",
      image_focus_x: body.image_focus_x ?? 50,
      image_focus_y: body.image_focus_y ?? 50,

      title_font_family: body.title_font_family ?? "Inter",
      title_font_style: body.title_font_style ?? "normal",
      title_text_transform: body.title_text_transform ?? "none",
      title_color: body.title_color ?? "#FFFFFF",
      title_size: body.title_size ?? 24,
      title_weight: body.title_weight ?? 600,
      title_letter_spacing: body.title_letter_spacing ?? 0,
      title_line_height: body.title_line_height ?? 1.1,
      title_offset_x: body.title_offset_x ?? 0,
      title_offset_y: body.title_offset_y ?? 0,

      subtitle_font_family: body.subtitle_font_family ?? "Inter",
      subtitle_font_style: body.subtitle_font_style ?? "normal",
      subtitle_text_transform: body.subtitle_text_transform ?? "none",
      subtitle_color: body.subtitle_color ?? "#FFFFFF",
      subtitle_size: body.subtitle_size ?? 14,
      subtitle_weight: body.subtitle_weight ?? 400,
      subtitle_letter_spacing: body.subtitle_letter_spacing ?? 0,
      subtitle_line_height: body.subtitle_line_height ?? 1.4,
      subtitle_offset_x: body.subtitle_offset_x ?? 0,
      subtitle_offset_y: body.subtitle_offset_y ?? 0,

      text_align: body.text_align ?? "center",
      horizontal_position: body.horizontal_position ?? "center",
      vertical_position: body.vertical_position ?? "bottom",
      content_offset_x: body.content_offset_x ?? 0,
      content_offset_y: body.content_offset_y ?? 0,

      overlay_color: body.overlay_color ?? "#000000",
      overlay_opacity: body.overlay_opacity ?? 15,

      button_text: body.button_text ?? "Shop Now",
      button_url: body.button_url ?? "/",
      button_bg_color: body.button_bg_color ?? "#FFFFFF",
      button_text_color: body.button_text_color ?? "#000000",
      button_size: body.button_size ?? 12,
      button_offset_x: body.button_offset_x ?? 0,
      button_offset_y: body.button_offset_y ?? 0,

      position: body.position ?? 0,
      is_active: body.is_active ?? true,
    })

    res.status(201).json({
      mega_menu_promo: promo,
    })
  } catch (error) {
    console.error("ADMIN MEGA MENU POST ERROR:", error)

    res.status(500).json({
      message: "Failed to create mega menu promo",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}