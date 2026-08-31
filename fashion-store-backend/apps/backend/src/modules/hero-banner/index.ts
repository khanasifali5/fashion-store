import { Module } from "@medusajs/framework/utils"
import HeroBannerModuleService from "./service"

export const HERO_BANNER_MODULE = "heroBanner"

export default Module(HERO_BANNER_MODULE, {
  service: HeroBannerModuleService,
})