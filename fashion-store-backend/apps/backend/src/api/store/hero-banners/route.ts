import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { HERO_BANNER_MODULE } from "../../../modules/hero-banner"
import HeroBannerModuleService from "../../../modules/hero-banner/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HeroBannerModuleService>(
        HERO_BANNER_MODULE
      )

    const banners = await (service as any).listHeroBanners(
      {
        is_active: true,
      },
      {
        order: {
          position: "ASC",
        },
      }
    )

    res.json({
      hero_banners: banners,
    })
  } catch (error) {
    console.error("STORE HERO BANNER ERROR:", error)

    res.status(500).json({
      message: "Failed to load hero banners",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}