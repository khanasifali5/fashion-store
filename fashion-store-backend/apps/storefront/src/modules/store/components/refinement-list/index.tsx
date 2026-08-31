"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { ChevronDownMini } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import OptionsPicker from "./options-picker"
import { SortOptions } from "./sort-products"

type CategoryFilterOption = {
  id: string
  title: string
  values: Array<{
    id: string
    value: string
  }>
}

type RefinementListProps = {
  sortBy: SortOptions
  categoryId: string
  availability?: "in_stock"
  filterOptions: CategoryFilterOption[]
  availabilitySupported?: boolean
  search?: boolean
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const SORT_OPTIONS: {
  value: SortOptions
  label: string
}[] = [
  {
    value: "created_at",
    label: "Latest Arrivals",
  },
  {
    value: "price_asc",
    label: "Price: Low → High",
  },
  {
    value: "price_desc",
    label: "Price: High → Low",
  },
]

const RefinementList = ({
  sortBy,
  categoryId: _categoryId,
  availability,
  filterOptions,
  availabilitySupported = true,
  hideOptionsPicker = false,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams =
    useSearchParams()

  const [mounted, setMounted] =
    useState(false)

  const [open, setOpen] =
    useState(false)

  const [sortOpen, setSortOpen] =
    useState(false)

  const [
    availabilityOpen,
    setAvailabilityOpen,
  ] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateQueryParams =
    useCallback(
      (
        updater: (
          params: URLSearchParams
        ) => void
      ) => {
        const params =
          new URLSearchParams(
            searchParams.toString()
          )

        updater(params)
        params.delete("page")

        const queryString =
          params.toString()

        const currentQuery =
          searchParams.toString()

        const nextPath =
          queryString
            ? `${pathname}?${queryString}`
            : pathname

        const currentPath =
          currentQuery
            ? `${pathname}?${currentQuery}`
            : pathname

        if (
          nextPath !== currentPath
        ) {
          router.push(nextPath)
        }
      },
      [
        pathname,
        router,
        searchParams,
      ]
    )

  const setQueryParams = (
    name: string,
    value: string
  ) =>
    updateQueryParams(
      (params) =>
        params.set(name, value)
    )

  const selectedOptionValueIds =
    useMemo(
      () =>
        parseOptionValueIds(
          searchParams
        ),
      [searchParams]
    )

  /*
   * The storefront can still default to Latest Arrivals internally,
   * but the filter UI should only show a Sort selection when the
   * customer explicitly chose one in the URL.
   */
  const explicitSortBy =
    searchParams.get("sortBy")

  const activeSortBy =
    SORT_OPTIONS.some(
      (option) =>
        option.value ===
        explicitSortBy
    )
      ? (explicitSortBy as SortOptions)
      : undefined

  const setOptionValueIds = (
    valueIds: string[]
  ) =>
    updateQueryParams(
      (params) => {
        params.delete(
          OPTION_VALUE_QUERY_KEY
        )

        valueIds.forEach(
          (valueId) =>
            params.append(
              OPTION_VALUE_QUERY_KEY,
              valueId
            )
        )
      }
    )

  const setAvailability = (
    value: "all" | "in_stock"
  ) =>
    updateQueryParams(
      (params) => {
        if (
          value === "in_stock"
        ) {
          params.set(
            "availability",
            "in_stock"
          )
        } else {
          params.delete(
            "availability"
          )
        }
      }
    )

  const resetFilters = () =>
    updateQueryParams(
      (params) => {
        params.delete(
          OPTION_VALUE_QUERY_KEY
        )

        params.delete(
          "availability"
        )

        params.delete(
          "sortBy"
        )
      }
    )

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      "hidden"

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        setOpen(false)
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

  const selectedSortLabel =
    activeSortBy
      ? SORT_OPTIONS.find(
          (option) =>
            option.value ===
            activeSortBy
        )?.label
      : undefined

  /*
   * Count every explicit customer selection:
   * - each selected Color / Size value
   * - explicit Sort By choice
   * - Hide Sold Out
   */
  const activeFilterCount =
    selectedOptionValueIds.length +
    (activeSortBy ? 1 : 0) +
    (availability ===
    "in_stock"
      ? 1
      : 0)

  const hasActiveFilters =
    activeFilterCount > 0

  const drawer =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            role="dialog"
            aria-modal="true"
            aria-label="Filter products"
          >
            <button
              type="button"
              aria-label="Close filters"
              onClick={() =>
                setOpen(false)
              }
              className="
                absolute
                inset-0
                z-0
                bg-black/50
              "
            />

            <aside
              id="category-filter-drawer"
              className="
                absolute
                right-0
                top-0
                z-10
                h-full
                w-full
                overflow-y-auto
                bg-white
                small:w-[42vw]
                small:min-w-[500px]
                small:max-w-[600px]
              "
            >
              <div className="relative flex min-h-full flex-col px-6 pb-8 pt-20 small:px-10">
                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  aria-label="Close filters"
                  className="
                    absolute
                    right-5
                    top-5
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    bg-transparent
                    text-[22px]
                    font-normal
                    leading-none
                    text-black
                    transition-opacity
                    hover:opacity-50
                  "
                >
                  ×
                </button>

                <div className="mb-7 text-[12px] font-normal leading-5 text-black">
                  Filter By
                </div>

                <div className="border-t border-black/10">
                  <Accordion.Root
                    type="single"
                    collapsible
                    value={
                      sortOpen
                        ? "sort"
                        : ""
                    }
                    onValueChange={(
                      value
                    ) =>
                      setSortOpen(
                        value === "sort"
                      )
                    }
                  >
                    <Accordion.Item
                      value="sort"
                      className="border-b border-black/10"
                    >
                      <Accordion.Header>
                        <Accordion.Trigger
                          className="
                            flex
                            w-full
                            items-center
                            justify-between
                            py-5
                            text-left
                            text-[12px]
                            font-normal
                            leading-4
                            text-black
                            transition-opacity
                            hover:opacity-60
                          "
                        >
                          <span className="min-w-0">
                            <span className="block">
                              Sort By
                            </span>

                            {selectedSortLabel && (
                              <span className="mt-0.5 block truncate text-[11px] text-black/45">
                                Selected:{" "}
                                {
                                  selectedSortLabel
                                }
                              </span>
                            )}
                          </span>

                          <span
                            className={[
                              "ml-4 flex h-5 w-5 shrink-0 items-center justify-center text-black transition-transform duration-150",
                              sortOpen
                                ? "rotate-0"
                                : "-rotate-90",
                            ].join(
                              " "
                            )}
                            aria-hidden="true"
                          >
                            <ChevronDownMini />
                          </span>
                        </Accordion.Trigger>
                      </Accordion.Header>

                      <Accordion.Content
                        className="
                          overflow-hidden
                          pb-5
                          data-[state=closed]:animate-accordion-close
                          data-[state=open]:animate-accordion-open
                        "
                      >
                        <div
                          className="flex flex-wrap gap-2"
                          data-testid={
                            dataTestId
                          }
                        >
                          {SORT_OPTIONS.map(
                            (option) => {
                              const selected =
                                activeSortBy ===
                                option.value

                              return (
                                <button
                                  key={
                                    option.value
                                  }
                                  type="button"
                                  onClick={() =>
                                    setQueryParams(
                                      "sortBy",
                                      option.value
                                    )
                                  }
                                  className={[
                                    "flex min-h-[34px] items-center justify-center border bg-white px-4 py-2 text-[12px] font-normal leading-4 text-black transition-colors",
                                    selected
                                      ? "border-black"
                                      : "border-black/15 hover:border-black/50",
                                  ].join(
                                    " "
                                  )}
                                >
                                  {
                                    option.label
                                  }
                                </button>
                              )
                            }
                          )}
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>

                  {!hideOptionsPicker && (
                    <OptionsPicker
                      options={
                        filterOptions
                      }
                      selectedValueIds={
                        selectedOptionValueIds
                      }
                      setOptionValueIds={
                        setOptionValueIds
                      }
                    />
                  )}

                  {availabilitySupported && (
                    <Accordion.Root
                      type="single"
                      collapsible
                      value={
                        availabilityOpen
                          ? "availability"
                          : ""
                      }
                      onValueChange={(
                        value
                      ) =>
                        setAvailabilityOpen(
                          value ===
                            "availability"
                        )
                      }
                    >
                      <Accordion.Item
                        value="availability"
                        className="border-b border-black/10"
                      >
                        <Accordion.Header>
                          <Accordion.Trigger
                            className="
                              flex
                              w-full
                              items-center
                              justify-between
                              py-5
                              text-left
                              text-[12px]
                              font-normal
                              leading-4
                              text-black
                              transition-opacity
                              hover:opacity-60
                            "
                          >
                            <span className="min-w-0">
                              <span className="block">
                                Availability
                              </span>

                              {availability ===
                                "in_stock" && (
                                <span className="mt-0.5 block truncate text-[11px] text-black/45">
                                  Selected: Hide Sold Out
                                </span>
                              )}
                            </span>

                            <span
                              className={[
                                "ml-4 flex h-5 w-5 shrink-0 items-center justify-center text-black transition-transform duration-150",
                                availabilityOpen
                                  ? "rotate-0"
                                  : "-rotate-90",
                              ].join(
                                " "
                              )}
                              aria-hidden="true"
                            >
                              <ChevronDownMini />
                            </span>
                          </Accordion.Trigger>
                        </Accordion.Header>

                        <Accordion.Content
                          className="
                            overflow-hidden
                            pb-5
                            data-[state=closed]:animate-accordion-close
                            data-[state=open]:animate-accordion-open
                          "
                        >
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setAvailability(
                                  "all"
                                )
                              }
                              className="
                                flex
                                min-h-[34px]
                                items-center
                                justify-center
                                border
                                border-black/15
                                bg-white
                                px-4
                                py-2
                                text-[12px]
                                font-normal
                                leading-4
                                text-black
                                transition-colors
                                hover:border-black/50
                              "
                            >
                              All Products
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setAvailability(
                                  "in_stock"
                                )
                              }
                              className={[
                                "flex min-h-[34px] items-center justify-center border bg-white px-4 py-2 text-[12px] font-normal leading-4 text-black transition-colors",
                                availability ===
                                "in_stock"
                                  ? "border-black"
                                  : "border-black/15 hover:border-black/50",
                              ].join(
                                " "
                              )}
                            >
                              Hide Sold Out
                            </button>
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  )}
                </div>

                <div className="mt-auto flex justify-end pt-7">
                  <button
                    type="button"
                    onClick={
                      resetFilters
                    }
                    disabled={
                      !hasActiveFilters
                    }
                    className="
                      min-w-[90px]
                      border
                      border-black
                      bg-white
                      px-5
                      py-2.5
                      text-[12px]
                      font-normal
                      text-black
                      transition-opacity
                      hover:opacity-55
                      disabled:cursor-default
                      disabled:opacity-30
                    "
                  >
                    Reset
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <div className="relative z-10 shrink-0">
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          className="
            inline-flex
            items-center
            gap-1
            whitespace-nowrap
            text-[12px]
            font-normal
            leading-5
            text-black
            transition-opacity
            hover:opacity-55
          "
          aria-expanded={open}
          aria-controls="category-filter-drawer"
        >
          <span>
            Filter By
            {activeFilterCount > 0
              ? ` (${activeFilterCount})`
              : ""}
          </span>

          <span
            aria-hidden="true"
          >
            +
          </span>
        </button>
      </div>

      {drawer}
    </>
  )
}

export default RefinementList