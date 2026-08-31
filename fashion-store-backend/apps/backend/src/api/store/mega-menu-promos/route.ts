import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MEGA_MENU_PROMO_MODULE } from "../../../modules/mega-menu-promo"
import MegaMenuPromoModuleService from "../../../modules/mega-menu-promo/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const megaMenuPromoService =
      req.scope.resolve<MegaMenuPromoModuleService>(
        MEGA_MENU_PROMO_MODULE
      )

    const promos = await (
      megaMenuPromoService as any
    ).listMegaMenuPromos()

    res.json({
      mega_menu_promos: promos,
    })
  } catch (error) {
    console.error("MEGA MENU PROMO ERROR:", error)

    res.status(500).json({
      message: "Failed to load mega menu promos",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}