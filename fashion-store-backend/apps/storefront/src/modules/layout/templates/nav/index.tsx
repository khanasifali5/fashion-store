import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getLocale } from "@lib/data/locale-actions"
import { listLocales } from "@lib/data/locales"
import { listMegaMenuPromos } from "@lib/data/mega-menu-promos"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SafafiHeader from "@modules/layout/components/safafi-header"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [
    regions,
    locales,
    currentLocale,
    categories,
    megaMenuPromos,
  ] = await Promise.all([
    listRegions().then(
      (regions: StoreRegion[]) =>
        regions
    ),
    listLocales(),
    getLocale(),
    listCategories(),
    listMegaMenuPromos(),
  ])

  const mobileMenu = (
    <SideMenu
      regions={regions}
      locales={locales}
      currentLocale={
        currentLocale
      }
      categories={
        categories
      }
    />
  )

  const cart = (
    <Suspense
      fallback={
        <LocalizedClientLink
          href="/cart"
          className="
            text-[12px]
            font-normal
            leading-[1.4]
          "
          data-testid="nav-cart-link"
        >
          Cart (0)
        </LocalizedClientLink>
      }
    >
      <CartButton />
    </Suspense>
  )

  return (
    <SafafiHeader
      mobileMenu={
        mobileMenu
      }
      cart={cart}
      categories={
        categories
      }
      megaMenuPromos={
        megaMenuPromos
      }
    />
  )
}