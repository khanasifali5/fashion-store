import { MedusaService } from "@medusajs/framework/utils"
import { MegaMenuPromo } from "./models/mega-menu-promo"

class MegaMenuPromoModuleService extends MedusaService({
  MegaMenuPromo,
}) {}

export default MegaMenuPromoModuleService