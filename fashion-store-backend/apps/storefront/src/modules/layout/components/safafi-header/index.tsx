"use client"

import type { MegaMenuPromo } from "@lib/data/mega-menu-promos"
import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { usePathname } from "next/navigation"


type SafafiHeaderProps = {
  cart: React.ReactNode
  mobileMenu: React.ReactNode
  categories: HttpTypes.StoreProductCategory[]
  megaMenuPromos: MegaMenuPromo[]
}

const cleanHandle = (handle?: string | null) => {
  if (!handle) return ""
  return handle.replace(/^\/+|\/+$/g, "")
}

const GOOGLE_FONT_FAMILIES = new Set([
  "Inter",
  "Playfair Display",
  "Cormorant Garamond",
  "Bodoni Moda",
  "DM Sans",
  "Montserrat",
  "Poppins",
  "Lora",
  "Raleway",
  "Oswald",
  "Manrope",
])

const loadedPromoFonts = new Set<string>()

const loadPromoFont = (family?: string | null) => {
  if (
    typeof document === "undefined" ||
    !family ||
    !GOOGLE_FONT_FAMILIES.has(family) ||
    loadedPromoFonts.has(family)
  ) {
    return
  }

  const id = `promo-font-${family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`

  if (document.getElementById(id)) {
    loadedPromoFonts.add(family)
    return
  }

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  ).replace(/%20/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap`

  document.head.appendChild(link)
  loadedPromoFonts.add(family)
}


export default function SafafiHeader({
  cart,
  mobileMenu,
  categories,
  megaMenuPromos,
}: SafafiHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activeMegaGroupId, setActiveMegaGroupId] = useState<string | null>(null)

  const pathname = usePathname()

  const pathSegments =
    pathname.split("/").filter(Boolean)

  const isStorefrontHome =
    pathSegments.length <= 1

  const transparentHeader =
    isStorefrontHome && !scrolled

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    megaMenuPromos.forEach((promo) => {
      loadPromoFont(promo.title_font_family)
      loadPromoFont(promo.subtitle_font_family)
    })
  }, [megaMenuPromos])

  useEffect(() => {
    if (!activeMenu) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenu(null)
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [activeMenu])

  /*
   * TOP LEVEL CATEGORIES
   * Women / Girls / Boys / Bags
   */
  const topLevelCategories = categories.filter(
    (category) => !category.parent_category
  )

  const leftMenuKeys = [
    ["women"],
    ["men", "mens", "men's"],
    ["girls"],
    ["boys"],
    ["bags"],
  ]

  const findTopLevelCategory = (keys: string[]) =>
    topLevelCategories.find((category) => {
      const handle = cleanHandle(category.handle)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")

      const name = (category.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")

      return keys.some((key) => {
        const normalizedKey = key
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")

        return handle === normalizedKey || name === normalizedKey
      })
    })

  const leftMenuCategories = leftMenuKeys
    .map((keys) => findTopLevelCategory(keys))
    .filter(
      (
        category
      ): category is HttpTypes.StoreProductCategory => Boolean(category)
    )

  const homeBeautyCategory =
    findTopLevelCategory([
      "home-beauty",
      "home-and-beauty",
      "home & beauty",
    ])

  const saleCategory =
    findTopLevelCategory([
      "sale",
      "sales",
    ])

  const toggleMegaMenu = (categoryId: string) => {
    setActiveMenu((current) => {
      const next =
        current === categoryId
          ? null
          : categoryId

      setActiveMegaGroupId(null)

      return next
    })
  }

  const toggleMegaGroup = (groupId: string) => {
    setActiveMegaGroupId((current) =>
      current === groupId
        ? null
        : groupId
    )
  }

  /*
   * ACTIVE CATEGORY
   */
  const activeCategory = categories.find(
    (category) => category.id === activeMenu
  )
const activePromos = activeCategory
  ? megaMenuPromos
      .filter(
        (promo) =>
          promo.is_active &&
          Boolean(promo.image_url) &&
          promo.menu_key.toLowerCase() ===
            cleanHandle(
              activeCategory.handle ||
                activeCategory.name ||
                ""
            ).toLowerCase()
      )
      .sort((a, b) => a.position - b.position)
      .slice(0, 2)
  : []
  /*
   * MEGA MENU GROUPS
   *
   * Example:
   *
   * Women
   * └── Clothing
   *     ├── T-Shirts
   *     ├── Tops
   *     ├── Dresses
   *     └── Jeans
   */
  const megaGroups: HttpTypes.StoreProductCategory[] = activeCategory
    ? activeCategory.category_children?.length
      ? activeCategory.category_children
      : categories.filter(
          (category) =>
            category.parent_category?.id === activeCategory.id
        )
    : []

  const getChildren = (
    group: HttpTypes.StoreProductCategory
  ): HttpTypes.StoreProductCategory[] => {
    if (group.category_children?.length) {
      return group.category_children
    }

    return categories.filter(
      (category) => category.parent_category?.id === group.id
    )
  }

  const closeMegaMenu = () => {
    setActiveMenu(null)
    setActiveMegaGroupId(null)
  }

  return (
    <>
      <header
      className={`
        fixed
        left-0
        right-0
        top-0
        z-50
        transition-all
        duration-300
        ${
          transparentHeader
            ? "bg-transparent text-white"
            : "bg-white text-black"
        }
        ${
          scrolled
            ? "shadow-sm"
            : ""
        }
      `}
      onMouseLeave={closeMegaMenu}
    >
      {/* =========================
          MAIN HEADER
      ========================== */}
      <div className="content-container">
        <div
          className="
            grid
            h-[82px]
            grid-cols-[1fr_auto_1fr]
            items-center
          "
        >
          {/* LEFT NAVIGATION */}
          <div className="flex items-center">
            <div className="lg:hidden">{mobileMenu}</div>

            <nav
              className="
                hidden
                lg:flex
                items-center
                gap-5
                text-[12px]
                font-normal
                leading-[1.4]
                tracking-normal
              "
              style={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {leftMenuCategories.map((category) => {
                const isActive = activeMenu === category.id

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleMegaMenu(category.id)}
                    aria-expanded={isActive}
                    className={[
                      "relative whitespace-nowrap bg-transparent p-0 capitalize text-inherit",
                      "after:absolute after:left-0 after:-bottom-[4px] after:h-px after:w-full after:origin-left after:bg-current after:transition-transform after:duration-200",
                      isActive
                        ? "after:scale-x-100"
                        : "after:scale-x-0 hover:after:scale-x-100",
                    ].join(" ")}
                  >
                    {category.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* =========================
              CENTER BRAND
          ========================== */}
          <LocalizedClientLink
            href="/"
            data-testid="nav-store-link"
            onMouseEnter={closeMegaMenu}
            className={`
              flex
              items-center
              justify-center
              gap-0
              transition-colors
              duration-300
              ${
                transparentHeader
                  ? "text-white"
                  : "text-[#A97838]"
              }
            `}
          >
            {/* BRAND ICON */}
            <span
              aria-hidden="true"
              className="
                block
                h-[75px]
                w-[75px]
                shrink-0
                bg-current
                scale-x-[1.3]
              "
              style={{
                WebkitMaskImage: "url('/safafi-icon.svg')",
                maskImage: "url('/safafi-icon.svg')",

                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",

                WebkitMaskPosition: "center",
                maskPosition: "center",

                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />

            {/* BRAND NAME */}
            <span
              className="
                -ml-[4px]
                whitespace-nowrap
                text-[30px]
                font-medium
                uppercase
                tracking-[0.07em]
                leading-none
              "
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
            >
              SAFAFI
            </span>
          </LocalizedClientLink>

          {/* =========================
              RIGHT NAVIGATION
          ========================== */}
          <div
            className="
              flex
              items-center
              justify-end
              gap-5
            "
          >
            <nav
              className="
                hidden
                lg:flex
                items-center
                gap-5
                text-[12px]
                font-normal
                leading-[1.4]
                tracking-normal
              "
              style={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {homeBeautyCategory ? (
                <button
                  type="button"
                  onClick={() =>
                    toggleMegaMenu(homeBeautyCategory.id)
                  }
                  aria-expanded={
                    activeMenu === homeBeautyCategory.id
                  }
                  className={[
                    "relative whitespace-nowrap bg-transparent p-0 text-inherit",
                    "after:absolute after:left-0 after:-bottom-[4px] after:h-px after:w-full after:origin-left after:bg-current after:transition-transform after:duration-200",
                    activeMenu === homeBeautyCategory.id
                      ? "after:scale-x-100"
                      : "after:scale-x-0 hover:after:scale-x-100",
                  ].join(" ")}
                >
                  Home & Beauty
                </button>
              ) : (
                <LocalizedClientLink
                  href="/"
                  onClick={closeMegaMenu}
                  className="
                    relative whitespace-nowrap
                    after:absolute after:left-0 after:-bottom-[4px]
                    after:h-px after:w-full after:origin-left
                    after:scale-x-0 after:bg-current
                    after:transition-transform after:duration-200
                    hover:after:scale-x-100
                  "
                >
                  Home & Beauty
                </LocalizedClientLink>
              )}

              {saleCategory ? (
                <button
                  type="button"
                  onClick={() =>
                    toggleMegaMenu(saleCategory.id)
                  }
                  aria-expanded={
                    activeMenu === saleCategory.id
                  }
                  className={[
                    "relative whitespace-nowrap bg-transparent p-0 text-red-500",
                    "after:absolute after:left-0 after:-bottom-[4px] after:h-px after:w-full after:origin-left after:bg-current after:transition-transform after:duration-200",
                    activeMenu === saleCategory.id
                      ? "after:scale-x-100"
                      : "after:scale-x-0 hover:after:scale-x-100",
                  ].join(" ")}
                >
                  Sale
                </button>
              ) : (
                <LocalizedClientLink
                  href="/"
                  onClick={closeMegaMenu}
                  className="
                    relative whitespace-nowrap text-red-500
                    after:absolute after:left-0 after:-bottom-[4px]
                    after:h-px after:w-full after:origin-left
                    after:scale-x-0 after:bg-current
                    after:transition-transform after:duration-200
                    hover:after:scale-x-100
                  "
                >
                  Sale
                </LocalizedClientLink>
              )}

              <LocalizedClientLink
                href="/"
                onClick={closeMegaMenu}
                className="
                  relative whitespace-nowrap
                  after:absolute after:left-0 after:-bottom-[4px]
                  after:h-px after:w-full after:origin-left
                  after:scale-x-0 after:bg-current
                  after:transition-transform after:duration-200
                  hover:after:scale-x-100
                "
              >
                Safafi World
              </LocalizedClientLink>
            </nav>

            {/* SEARCH */}
            <button
              type="button"
              aria-label="Search"
              className="
                hidden
                sm:block
                transition-opacity
                hover:opacity-60
              "
              onMouseEnter={closeMegaMenu}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>

            {/* ACCOUNT */}
            <LocalizedClientLink
              href="/account"
              onMouseEnter={closeMegaMenu}
              className="
                hidden
                xl:block
                whitespace-nowrap
                text-[12px]
                font-normal
                leading-[1.4]
                tracking-normal
                transition-opacity
                hover:opacity-60
              "
            >
              Account
            </LocalizedClientLink>

            {/* MEDUSA CART */}
            <div onMouseEnter={closeMegaMenu}>
              {cart}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MEGA MENU
      ===================================================== */}
      {activeCategory && megaGroups.length > 0 && (
        <div
          className="
            absolute
            left-0
            top-full
            w-full
            border-t
            border-[#A97838]/20
            shadow-[0_14px_35px_rgba(91,62,29,0.12)]
          "
          style={{
  background:
    "linear-gradient(to bottom, #F1E9DC 0%, #F6F1E8 35%, #FBF8F3 70%, #FFFDFC 100%)",
}}
          onMouseEnter={() => setActiveMenu(activeCategory.id)}
          onMouseLeave={closeMegaMenu}
        >
          <div className="relative h-[475px] overflow-hidden">
            {/* =========================
                CATEGORY COLUMNS
            ========================== */}
            <div
              className={`content-container h-full ${
                activePromos.length === 0
                  ? "pr-0"
                  : activePromos.length === 1
                  ? "pr-[320px]"
                  : "pr-[620px]"
              }`}
            >
              <div
                className="
                  h-full
                  max-w-[420px]
                  overflow-y-auto
                  py-7
                  pr-8
                  text-[12px]
                  font-normal
                  leading-[1.4]
                  text-black
                  no-scrollbar
                "
                style={{
                  fontFamily:
                    '"Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
              >
                {megaGroups.map((group) => {
                  const children = getChildren(group)
                  const hasChildren = children.length > 0
                  const isExpanded = activeMegaGroupId === group.id

                  if (!hasChildren) {
                    return (
                      <div key={group.id} className="mb-4 last:mb-0">
                        <LocalizedClientLink
                          href={`/categories/${cleanHandle(
                            activeCategory.handle
                          )}/${cleanHandle(
                            group.handle
                          )}`}
                          className="relative block w-fit pb-[3px] transition-opacity hover:opacity-55"
                        >
                          {group.name}
                        </LocalizedClientLink>
                      </div>
                    )
                  }

                  return (
                    <div key={group.id} className="mb-4 last:mb-0">
                      {/*
                       * Parent / subcategory is an accordion trigger.
                       * It does NOT navigate. Only one section can stay open.
                       */}
                      <button
                        type="button"
                        onClick={() => toggleMegaGroup(group.id)}
                        aria-expanded={isExpanded}
                        className={[
                          "relative block w-fit bg-transparent p-0 pb-[3px] text-left text-[12px] font-normal leading-[1.4] text-black transition-opacity hover:opacity-55",
                          "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-black after:transition-opacity",
                          isExpanded
                            ? "after:opacity-100"
                            : "after:opacity-0 hover:after:opacity-100",
                        ].join(" ")}
                      >
                        {group.name}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 flex flex-col items-start gap-2.5 pl-4">
                          {/* The Row-style parent landing link */}
                          <LocalizedClientLink
                            href={`/categories/${cleanHandle(
                              activeCategory.handle
                            )}/${cleanHandle(
                              group.handle
                            )}?view=all`}
                            className="w-fit text-[12px] font-normal leading-5 text-black/65 transition-colors hover:text-black hover:underline underline-offset-4"
                          >
                            View All
                          </LocalizedClientLink>

                          {children.map((child) => (
                            <LocalizedClientLink
                              key={child.id}
                              href={`/categories/${cleanHandle(
                                activeCategory.handle
                              )}/${cleanHandle(
                                group.handle
                              )}/${cleanHandle(
                                child.handle
                              )}`}
                              className="w-fit text-[12px] font-normal leading-5 text-black/65 transition-colors hover:text-black hover:underline underline-offset-4"
                            >
                              {child.name}
                            </LocalizedClientLink>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* =========================
                PROMOTIONAL CARDS
                Fixed 475px height.
                Anchored to the viewport right edge.
            ========================== */}
            {activePromos.length > 0 && (
              <div
                className={`absolute right-0 top-0 grid h-full overflow-hidden ${
                  activePromos.length === 1
                    ? "w-[300px] grid-cols-1"
                    : "w-[600px] grid-cols-2"
                }`}
              >
                {activePromos.map((promo) => {
                  const justifyContent =
                    promo.horizontal_position === "left"
                      ? "flex-start"
                      : promo.horizontal_position === "right"
                        ? "flex-end"
                        : "center"

                  const alignItems =
                    promo.vertical_position === "top"
                      ? "flex-start"
                      : promo.vertical_position === "center"
                        ? "center"
                        : "flex-end"

                  const objectPosition = `${
                    promo.image_focus_x ?? 50
                  }% ${promo.image_focus_y ?? 50}%`

                  return (
                    <div
                      key={promo.id}
                      className="relative h-full overflow-hidden"
                    >
                      <img
                        src={promo.image_url || ""}
                        alt={
                          promo.title ||
                          `${activeCategory?.name || "Safafi"} Collection`
                        }
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition }}
                      />

                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor:
                            promo.overlay_color || "#000000",
                          opacity:
                            Math.max(
                              0,
                              Math.min(
                                100,
                                promo.overlay_opacity ?? 15
                              )
                            ) / 100,
                        }}
                      />

                      <div
                        className="absolute inset-0 z-10 flex p-5"
                        style={{
                          justifyContent,
                          alignItems,
                        }}
                      >
                        <div
                          className="w-full"
                          style={{
                            textAlign:
                              (promo.text_align as
                                | "left"
                                | "center"
                                | "right") || "center",
                            transform: `translate(${
                              promo.content_offset_x ?? 0
                            }px, ${promo.content_offset_y ?? 0}px)`,
                          }}
                        >
                          {promo.subtitle && (
                            <div
                              style={{
                                color:
                                  promo.subtitle_color ||
                                  "#FFFFFF",
                                fontFamily:
                                  promo.subtitle_font_family ||
                                  "Inter, Arial, sans-serif",
                                fontSize: `${
                                  promo.subtitle_size ?? 14
                                }px`,
                                fontWeight:
                                  promo.subtitle_weight ?? 400,
                                fontStyle:
                                  promo.subtitle_font_style ===
                                  "italic"
                                    ? "italic"
                                    : "normal",
                                textTransform:
                                  (promo.subtitle_text_transform as React.CSSProperties["textTransform"]) ||
                                  "none",
                                letterSpacing: `${
                                  promo.subtitle_letter_spacing ?? 0
                                }px`,
                                lineHeight:
                                  promo.subtitle_line_height ??
                                  1.4,
                                transform: `translate(${
                                  promo.subtitle_offset_x ?? 0
                                }px, ${
                                  promo.subtitle_offset_y ?? 0
                                }px)`,
                              }}
                            >
                              {promo.subtitle}
                            </div>
                          )}

                          {promo.title && (
                            <div
                              className="mt-2"
                              style={{
                                color:
                                  promo.title_color ||
                                  "#FFFFFF",
                                fontFamily:
                                  promo.title_font_family ||
                                  "Inter, Arial, sans-serif",
                                fontSize: `${
                                  promo.title_size ?? 24
                                }px`,
                                fontWeight:
                                  promo.title_weight ?? 600,
                                fontStyle:
                                  promo.title_font_style ===
                                  "italic"
                                    ? "italic"
                                    : "normal",
                                textTransform:
                                  (promo.title_text_transform as React.CSSProperties["textTransform"]) ||
                                  "none",
                                letterSpacing: `${
                                  promo.title_letter_spacing ?? 0
                                }px`,
                                lineHeight:
                                  promo.title_line_height ??
                                  1.1,
                                transform: `translate(${
                                  promo.title_offset_x ?? 0
                                }px, ${
                                  promo.title_offset_y ?? 0
                                }px)`,
                              }}
                            >
                              {promo.title}
                            </div>
                          )}

                          {promo.button_text && (
                            <div
                              className="mt-5"
                              style={{
                                transform: `translate(${
                                  promo.button_offset_x ?? 0
                                }px, ${
                                  promo.button_offset_y ?? 0
                                }px)`,
                              }}
                            >
                              <LocalizedClientLink
                                href={promo.button_url || "/"}
                                className="inline-flex min-w-[128px] items-center justify-center px-5 py-3 font-semibold uppercase tracking-[0.08em] transition-opacity duration-300 hover:opacity-80"
                                style={{
                                  backgroundColor:
                                    promo.button_bg_color ||
                                    "#FFFFFF",
                                  color:
                                    promo.button_text_color ||
                                    "#000000",
                                  fontSize: `${
                                    promo.button_size ?? 12
                                  }px`,
                                }}
                              >
                                {promo.button_text}
                              </LocalizedClientLink>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      </header>

      <div
        aria-hidden="true"
        className={
          isStorefrontHome
            ? "h-0"
            : "h-[82px]"
        }
      />
    </>
  )
}