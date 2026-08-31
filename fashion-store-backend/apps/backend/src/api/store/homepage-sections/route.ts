import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { HOMEPAGE_SECTION_MODULE } from "../../../modules/homepage-section"
import HomepageSectionModuleService from "../../../modules/homepage-section/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HomepageSectionModuleService>(
        HOMEPAGE_SECTION_MODULE
      )

    const sections =
      await (service as any).listHomepageSections()

    const activeSections = (sections || [])
      .filter((section: any) => section.is_active !== false)
      .sort(
        (a: any, b: any) =>
          (a.position ?? 0) - (b.position ?? 0)
      )

    res.json({
      homepage_sections: activeSections,
    })
  } catch (error) {
    console.error(
      "STORE HOMEPAGE SECTIONS GET ERROR:",
      error
    )

    res.status(500).json({
      message: "Failed to load homepage sections",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}