"use client"

import { Locale } from "@lib/data/locales"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  categories: HttpTypes.StoreProductCategory[]
}

const cleanHandle = (
  handle?: string | null
) => {
  if (!handle) {
    return ""
  }

  return handle.replace(
    /^\/+|\/+$/g,
    ""
  )
}

const normalizeKey = (
  value?: string | null
) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  categories,
}: SideMenuProps) => {
  const pathname = usePathname()

  const [mounted, setMounted] =
    useState(false)

  const [open, setOpen] =
    useState(false)

  const [
    openCategoryId,
    setOpenCategoryId,
  ] = useState<string | null>(
    null
  )

  const countryToggleState =
    useToggleState()

  const languageToggleState =
    useToggleState()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setOpen(false)
    setOpenCategoryId(null)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        setOpen(false)
        setOpenCategoryId(null)
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [open])

  const topLevelCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            !category.parent_category
        ),
      [categories]
    )

  const findTopLevelCategory = (
    keys: string[]
  ) =>
    topLevelCategories.find(
      (category) => {
        const handle =
          normalizeKey(
            cleanHandle(
              category.handle
            )
          )

        const name =
          normalizeKey(
            category.name
          )

        return keys.some(
          (key) => {
            const normalized =
              normalizeKey(key)

            return (
              handle ===
                normalized ||
              name ===
                normalized
            )
          }
        )
      }
    )

  /*
   * Same order as desktop navigation.
   */
  const primaryCategories =
    useMemo(() => {
      const keys = [
        ["women"],
        [
          "men",
          "mens",
          "men's",
        ],
        ["girls"],
        ["boys"],
        ["bags"],
      ]

      return keys
        .map((item) =>
          findTopLevelCategory(
            item
          )
        )
        .filter(
          (
            category
          ): category is HttpTypes.StoreProductCategory =>
            Boolean(category)
        )
    }, [topLevelCategories])

  const homeBeautyCategory =
    useMemo(
      () =>
        findTopLevelCategory([
          "home-beauty",
          "home-and-beauty",
          "home & beauty",
        ]),
      [topLevelCategories]
    )

  const saleCategory =
    useMemo(
      () =>
        findTopLevelCategory([
          "sale",
          "sales",
        ]),
      [topLevelCategories]
    )

  const menuCategories =
    useMemo(() => {
      const items = [
        ...primaryCategories,
      ]

      if (
        homeBeautyCategory &&
        !items.some(
          (item) =>
            item.id ===
            homeBeautyCategory.id
        )
      ) {
        items.push(
          homeBeautyCategory
        )
      }

      if (
        saleCategory &&
        !items.some(
          (item) =>
            item.id ===
            saleCategory.id
        )
      ) {
        items.push(
          saleCategory
        )
      }

      return items
    }, [
      primaryCategories,
      homeBeautyCategory,
      saleCategory,
    ])

  const getChildren = (
    category:
      HttpTypes.StoreProductCategory
  ) => {
    if (
      category.category_children
        ?.length
    ) {
      return (
        category.category_children
      )
    }

    return categories.filter(
      (item) =>
        item.parent_category?.id ===
        category.id
    )
  }

  const getGrandchildren = (
    category:
      HttpTypes.StoreProductCategory
  ) => {
    if (
      category.category_children
        ?.length
    ) {
      return (
        category.category_children
      )
    }

    return categories.filter(
      (item) =>
        item.parent_category?.id ===
        category.id
    )
  }

  const closeMenu = () => {
    setOpen(false)
    setOpenCategoryId(null)
  }

  const toggleCategory = (
    categoryId: string
  ) => {
    setOpenCategoryId(
      (current) =>
        current === categoryId
          ? null
          : categoryId
    )
  }

  const menu =
    mounted && open
      ? createPortal(
          <div
            className="
              fixed
              inset-0
              z-[9999]
              bg-white
              text-black
            "
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            style={{
              fontFamily:
                '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            <div
              className="
                flex
                h-full
                flex-col
                overflow-hidden
              "
            >
              {/* TOP */}
              <div
                className="
                  flex
                  h-[72px]
                  shrink-0
                  items-center
                  justify-between
                  px-5
                "
              >
                <span
                  className="
                    text-[12px]
                    font-normal
                    leading-[1.4]
                  "
                >
                  Menu
                </span>

                <button
                  type="button"
                  onClick={
                    closeMenu
                  }
                  aria-label="Close menu"
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    text-[22px]
                    font-light
                    leading-none
                  "
                >
                  ×
                </button>
              </div>

              {/* CATEGORY LIST */}
              <div
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  px-5
                  pb-8
                "
              >
                <div
                  className="
                    border-t
                    border-black/10
                  "
                >
                  {menuCategories.map(
                    (category) => {
                      const children =
                        getChildren(
                          category
                        )

                      const hasChildren =
                        children.length >
                        0

                      const expanded =
                        openCategoryId ===
                        category.id

                      return (
                        <div
                          key={
                            category.id
                          }
                          className="
                            border-b
                            border-black/10
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-[52px]
                              items-center
                              justify-between
                              gap-4
                            "
                          >
                            <LocalizedClientLink
                              href={`/categories/${cleanHandle(
                                category.handle
                              )}`}
                              onClick={
                                closeMenu
                              }
                              className={[
                                "min-w-0 flex-1 text-[12px] font-normal leading-[1.4] text-black transition-opacity hover:opacity-55",
                                category.id ===
                                saleCategory?.id
                                  ? "text-red-500"
                                  : "",
                              ].join(
                                " "
                              )}
                            >
                              {
                                category.name
                              }
                            </LocalizedClientLink>

                            {hasChildren && (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleCategory(
                                    category.id
                                  )
                                }
                                aria-expanded={
                                  expanded
                                }
                                aria-label={`${
                                  expanded
                                    ? "Collapse"
                                    : "Expand"
                                } ${
                                  category.name
                                }`}
                                className="
                                  flex
                                  h-10
                                  w-10
                                  shrink-0
                                  items-center
                                  justify-end
                                  text-[20px]
                                  font-light
                                  leading-none
                                "
                              >
                                {expanded
                                  ? "−"
                                  : "+"}
                              </button>
                            )}
                          </div>

                          {expanded &&
                            hasChildren && (
                              <div
                                className="
                                  pb-5
                                  pl-4
                                "
                              >
                                {children.map(
                                  (
                                    child
                                  ) => {
                                    const grandchildren =
                                      getGrandchildren(
                                        child
                                      )

                                    return (
                                      <div
                                        key={
                                          child.id
                                        }
                                        className="
                                          mb-4
                                          last:mb-0
                                        "
                                      >
                                        <LocalizedClientLink
                                          href={`/categories/${cleanHandle(
                                            child.handle
                                          )}`}
                                          onClick={
                                            closeMenu
                                          }
                                          className="
                                            block
                                            w-fit
                                            text-[12px]
                                            font-normal
                                            leading-5
                                            text-black
                                            transition-opacity
                                            hover:opacity-55
                                          "
                                        >
                                          {
                                            child.name
                                          }
                                        </LocalizedClientLink>

                                        {grandchildren.length >
                                          0 && (
                                          <div
                                            className="
                                              mt-2
                                              flex
                                              flex-col
                                              gap-2
                                              pl-4
                                            "
                                          >
                                            {grandchildren.map(
                                              (
                                                grandchild
                                              ) => (
                                                <LocalizedClientLink
                                                  key={
                                                    grandchild.id
                                                  }
                                                  href={`/categories/${cleanHandle(
                                                    grandchild.handle
                                                  )}`}
                                                  onClick={
                                                    closeMenu
                                                  }
                                                  className="
                                                    w-fit
                                                    text-[12px]
                                                    font-normal
                                                    leading-5
                                                    text-black/60
                                                    transition-colors
                                                    hover:text-black
                                                  "
                                                >
                                                  {
                                                    grandchild.name
                                                  }
                                                </LocalizedClientLink>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            )}
                        </div>
                      )
                    }
                  )}
                </div>

                {/* SECONDARY LINKS */}
                <div
                  className="
                    mt-10
                    flex
                    flex-col
                    gap-5
                    text-[12px]
                    font-normal
                    leading-[1.4]
                  "
                >
                  <LocalizedClientLink
                    href="/account"
                    onClick={
                      closeMenu
                    }
                    className="w-fit"
                  >
                    Login
                  </LocalizedClientLink>

                  <LocalizedClientLink
                    href="/cart"
                    onClick={
                      closeMenu
                    }
                    className="w-fit"
                  >
                    Cart
                  </LocalizedClientLink>

                  <LocalizedClientLink
                    href="/"
                    onClick={
                      closeMenu
                    }
                    className="w-fit"
                  >
                    Safafi World
                  </LocalizedClientLink>
                </div>
              </div>

              {/* FOOTER */}
              <div
                className="
                  shrink-0
                  border-t
                  border-black/10
                  px-5
                  py-5
                  text-[11px]
                  font-normal
                  leading-5
                  text-black/60
                "
              >
                {!!locales?.length && (
                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      justify-between
                    "
                    onClick={() =>
                      languageToggleState.state
                        ? languageToggleState.close()
                        : languageToggleState.open()
                    }
                  >
                    <LanguageSelect
                      toggleState={
                        languageToggleState
                      }
                      locales={
                        locales
                      }
                      currentLocale={
                        currentLocale
                      }
                    />
                  </div>
                )}

                {regions && (
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                    onClick={() =>
                      countryToggleState.state
                        ? countryToggleState.close()
                        : countryToggleState.open()
                    }
                  >
                    <CountrySelect
                      toggleState={
                        countryToggleState
                      }
                      regions={
                        regions
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        data-testid="nav-menu-button"
        onClick={() =>
          setOpen(true)
        }
        aria-expanded={open}
        aria-label="Open menu"
        className="
          flex
          h-10
          w-10
          items-center
          justify-start
          text-current
        "
      >
        <span
          aria-hidden="true"
          className="
            flex
            w-[22px]
            flex-col
            gap-[5px]
          "
        >
          <span className="block h-px w-full bg-current" />
          <span className="block h-px w-full bg-current" />
          <span className="block h-px w-full bg-current" />
        </span>
      </button>

      {menu}
    </>
  )
}

export default SideMenu