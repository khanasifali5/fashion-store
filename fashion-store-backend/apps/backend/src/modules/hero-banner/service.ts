import { MedusaService } from "@medusajs/framework/utils"
import { HeroBanner } from "./models/hero-banner"

class HeroBannerModuleService extends MedusaService({
  HeroBanner,
}) {}

export default HeroBannerModuleService