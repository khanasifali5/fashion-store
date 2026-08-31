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

    const banners =
      await (service as any).listHeroBanners()

    res.json({
      hero_banners: banners,
    })
  } catch (error) {
    console.error(
      "HERO BANNER GET ERROR:",
      error
    )

    res.status(500).json({
      message:
        "Failed to load hero banners",
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
      req.scope.resolve<HeroBannerModuleService>(
        HERO_BANNER_MODULE
      )

    const body =
      req.body as Record<
        string,
        any
      >

    if (!body.media_url) {
      return res
        .status(400)
        .json({
          message:
            "media_url is required",
        })
    }

    const banner =
      await (service as any).createHeroBanners({
        ...body,

        hero_height:
          body.hero_height !==
          undefined
            ? Number(
                body.hero_height
              )
            : 720,

        mobile_height:
          body.mobile_height !==
          undefined
            ? Number(
                body.mobile_height
              )
            : 540,

        position:
          Number(
            body.position ?? 0
          ),

        is_active:
          body.is_active ??
          true,
      })

    res.status(201).json({
      hero_banner: banner,
    })
  } catch (error) {
    console.error(
      "HERO BANNER POST ERROR:",
      error
    )

    res.status(500).json({
      message:
        "Failed to create hero banner",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}
