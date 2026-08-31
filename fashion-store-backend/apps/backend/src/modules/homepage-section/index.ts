import { Module } from "@medusajs/framework/utils"

import HomepageSectionModuleService from "./service"

export const HOMEPAGE_SECTION_MODULE = "homepageSection"

export default Module(HOMEPAGE_SECTION_MODULE, {
  service: HomepageSectionModuleService,
})