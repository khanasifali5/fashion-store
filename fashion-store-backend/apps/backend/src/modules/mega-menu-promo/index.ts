import { Module } from "@medusajs/framework/utils"
import MegaMenuPromoModuleService from "./service"

export const MEGA_MENU_PROMO_MODULE = "megaMenuPromo"

export default Module(MEGA_MENU_PROMO_MODULE, {
  service: MegaMenuPromoModuleService,
})