import { MedusaService } from "@medusajs/framework/utils"

import { HomepageSection } from "./models/homepage-section"

class HomepageSectionModuleService extends MedusaService({
  HomepageSection,
}) {}

export default HomepageSectionModuleService