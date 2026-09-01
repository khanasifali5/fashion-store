import { ModuleProviderExports } from "@medusajs/framework/types"
import OptimizedR2FileService from "./service"

const services = [OptimizedR2FileService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport