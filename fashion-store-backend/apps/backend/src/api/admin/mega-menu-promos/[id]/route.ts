import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MEGA_MENU_PROMO_MODULE } from "../../../../modules/mega-menu-promo"
import MegaMenuPromoModuleService from "../../../../modules/mega-menu-promo/service"

type UpdateMegaMenuPromoBody = {
  menu_key?: string
  title?: string | null
  subtitle?: string | null

  image_url?: string
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

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<MegaMenuPromoModuleService>(
        MEGA_MENU_PROMO_MODULE
      )

    const { id } = req.params
    const body = req.body as UpdateMegaMenuPromoBody

    const promo = await (service as any).updateMegaMenuPromos({
      id,
      ...body,
    })

    res.json({
      mega_menu_promo: promo,
    })
  } catch (error) {
    console.error("UPDATE MEGA MENU PROMO ERROR:", error)

    res.status(500).json({
      message: "Failed to update promo",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<MegaMenuPromoModuleService>(
        MEGA_MENU_PROMO_MODULE
      )

    const { id } = req.params

    const deleteFn =
      (service as any).deleteMegaMenuPromos ||
      (service as any).deleteMegaMenuPromoes

    if (typeof deleteFn !== "function") {
      throw new Error(
        "Delete method not found on MegaMenuPromoModuleService"
      )
    }

    await deleteFn.call(service, id)

    res.status(200).json({
      id,
      deleted: true,
    })
  } catch (error) {
    console.error("DELETE MEGA MENU PROMO ERROR:", error)

    res.status(500).json({
      message: "Failed to delete promo",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}