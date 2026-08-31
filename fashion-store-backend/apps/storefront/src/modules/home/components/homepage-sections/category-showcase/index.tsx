"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import type {
  CSSProperties,
} from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type {
  CategoryShowcaseConfig,
  CategoryShowcaseItem,
} from "@lib/data/homepage-sections"

import {
  HOMEPAGE_WIDTH,
} from "../spacing"

type CategoryShowcaseProps = {
  title?: string | null
  config: CategoryShowcaseConfig
}

/*
 * These fields live inside the existing HomepageSection config JSON.
 * No database/model change is needed.
 */
type CategoryShowcaseMediaItem =
  CategoryShowcaseItem & {
    image_fit?: "cover" | "contain"
    image_position_x?: number
    image_position_y?: number
    image_zoom?: number
  }

type ShowcaseCssProperties =
  CSSProperties &
  Record<`--${string}`, string>

const getRatio = (
  ratio:
    | CategoryShowcaseConfig["image_ratio"]
    | undefined
) => {
  switch (ratio) {
    case "square":
      return "1 / 1"

    case "landscape":
      return "4 / 3"

    case "editorial":
      return "4 / 5"

    case "portrait":
    default:
      /*
       * SAFAFI fashion-category master:
       * taller editorial card, close to the visual
       * proportion used by the reference homepage.
       */
      return "2 / 3"
  }
}

const getButtonLabel = (
  item: CategoryShowcaseMediaItem
) => {
  const configured =
    item.button_text?.trim()

  const itemTitle =
    item.title?.trim()

  /*
   * Admin currently creates new cards with "Shop Now".
   * For a category-led visual section, "Shop Women",
   * "Shop Men", etc. is much clearer and matches the
   * visual reference without forcing manual editing.
   */
  if (
    (!configured ||
      /^shop now$/i.test(configured)) &&
    itemTitle
  ) {
    return `Shop ${itemTitle}`
  }

  return (
    configured ||
    itemTitle ||
    "Shop Now"
  )
}

const normalizeHex = (
  value?: string | null
) =>
  value?.trim().toLowerCase() || ""

export default function CategoryShowcase({
  title,
  config,
}: CategoryShowcaseProps) {
  const railRef =
    useRef<HTMLDivElement | null>(
      null
    )

  const [canScrollLeft, setCanScrollLeft] =
    useState(false)

  const [canScrollRight, setCanScrollRight] =
    useState(false)

  const items =
    useMemo(
      () =>
        (
          (config.items ?? []) as
            CategoryShowcaseMediaItem[]
        ).filter(
          (item) =>
            Boolean(
              item?.image_url ||
                item?.title
            )
        ),
      [config.items]
    )

  if (!items.length) {
    return null
  }

  const desktopColumns =
    Math.min(
      Math.max(
        Number(
          config.desktop_columns
        ) || 4,
        2
      ),
      4
    )

  const gap =
    Math.max(
      Number(config.gap) || 16,
      0
    )

  /*
   * CATEGORY SHOWCASE SPACING RHYTHM
   *
   * The visual reference works because the same spacing unit is
   * repeated around and between the cards.
   *
   * Use `gap` as the single source of truth for this section:
   *
   * Hero Banner
   *     ↓ gap
   * [Card] ← gap → [Card]
   *     ↓ gap
   * next section
   *
   * This intentionally prevents old top_spacing / bottom_spacing
   * values from creating an uneven white band above the carousel.
   */
  const verticalSpacing =
    gap

  const background =
    config.background ||
    "#F8F4EC"

  const width =
    config.width ||
    "full"

  const imageRatio =
    getRatio(
      config.image_ratio
    )

  /*
   * SAFAFI-safe button defaults.
   *
   * Older Category Showcase sections can contain
   * white text + white background because the old
   * Admin defaults were designed for overlay text.
   * Detect that invalid combination and fall back
   * to a dark premium CTA.
   */
  const configuredBg =
    config.button_bg ||
    "#2A211C"

  const configuredColor =
    config.button_color ||
    "#FFFFFF"

  const sameButtonColors =
    normalizeHex(
      configuredBg
    ) ===
    normalizeHex(
      configuredColor
    )

  const buttonBg =
    sameButtonColors
      ? "#2A211C"
      : configuredBg

  const buttonColor =
    sameButtonColors
      ? "#FFFFFF"
      : configuredColor

  const buttonBorder =
    config.button_border ||
    buttonBg

  const visibilityClass =
    config.desktop_visible ===
      false &&
    config.mobile_visible ===
      false
      ? "hidden"
      : config.desktop_visible ===
          false
        ? "lg:hidden"
        : config.mobile_visible ===
            false
          ? "hidden lg:block"
          : ""

  /*
   * FLUID ONE-ROW RESPONSIVE MASTER
   *
   * Important for SAFAFI because this section can contain
   * 5 category cards.
   *
   * phone < 640
   *   -> ~1.2 cards visible + touch swipe
   *
   * 640–1199
   *   -> ALWAYS one horizontal row
   *   -> card width grows/shrinks fluidly with viewport
   *   -> no 2x2 wrapping, so a fifth card never sits alone
   *
   * large desktop >= 1200
   *   -> configured master density (normally 4 visible)
   *   -> extra cards remain horizontally scrollable
   */
  const desktopBasis =
    `calc((100% - ${
      gap *
      (desktopColumns - 1)
    }px) / ${desktopColumns})`

  /*
   * One continuous size curve:
   * large desktop = master width,
   * narrower screens = smoothly smaller,
   * mobile stops shrinking at 180px.
   */
  const fluidBasis =
    `clamp(180px, 24vw, ${desktopBasis})`

  const updateScrollState =
    useCallback(() => {
      const rail =
        railRef.current

      if (!rail) {
        return
      }

      const maxScroll =
        Math.max(
          rail.scrollWidth -
            rail.clientWidth,
          0
        )

      setCanScrollLeft(
        rail.scrollLeft > 2
      )

      setCanScrollRight(
        rail.scrollLeft <
          maxScroll - 2
      )
    }, [])

  useEffect(() => {
    const rail =
      railRef.current

    if (!rail) {
      return
    }

    updateScrollState()

    const handleScroll = () =>
      updateScrollState()

    rail.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    )

    const observer =
      typeof ResizeObserver !==
      "undefined"
        ? new ResizeObserver(
            updateScrollState
          )
        : null

    observer?.observe(rail)

    return () => {
      rail.removeEventListener(
        "scroll",
        handleScroll
      )

      observer?.disconnect()
    }
  }, [
    items.length,
    updateScrollState,
  ])

  const move = (
    direction:
      | "left"
      | "right"
  ) => {
    const rail =
      railRef.current

    if (!rail) {
      return
    }

    const firstCard =
      rail.querySelector<HTMLElement>(
        "[data-category-showcase-card]"
      )

    const cardWidth =
      firstCard
        ?.getBoundingClientRect()
        .width ||
      rail.clientWidth /
        desktopColumns

    const step =
      cardWidth + gap

    rail.scrollBy({
      left:
        direction === "left"
          ? -step
          : step,
      behavior: "smooth",
    })
  }

  const showControls =
    items.length >
      desktopColumns ||
    canScrollLeft ||
    canScrollRight

  const sectionStyle: ShowcaseCssProperties =
    {
      backgroundColor:
        background,

      paddingTop:
        `${verticalSpacing}px`,

      paddingBottom:
        `${verticalSpacing}px`,

      "--category-gap":
        `${gap}px`,

      "--category-fluid-basis":
        fluidBasis,

      "--category-desktop-basis":
        desktopBasis,

      "--category-button-bg":
        buttonBg,

      "--category-button-color":
        buttonColor,

      "--category-button-border":
        buttonBorder,

    }

  return (
    <section
      className={
        visibilityClass
      }
      style={
        sectionStyle
      }
      aria-label={
        title ||
        "Shop by category"
      }
    >
      <div
        className={
          HOMEPAGE_WIDTH[
            width
          ]
        }
      >
        {title && (
          <h2
            className="
              text-[12px]
              font-normal
              leading-5
              tracking-normal
              text-[#29231d]
            "
            style={{
              marginBottom:
                "var(--category-gap)",
              paddingLeft:
                "var(--category-gap)",
              paddingRight:
                "var(--category-gap)",
              fontFamily:
                '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            {title}
          </h2>
        )}

        <div className="relative">
          <div
          ref={railRef}
          className="
            category-showcase-rail
            flex
            w-full
            snap-x
            snap-mandatory
            overflow-x-auto
            overflow-y-hidden
            scroll-smooth
            pb-0
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            gap:
              "var(--category-gap)",
            paddingLeft:
              "var(--category-gap)",
            paddingRight:
              "var(--category-gap)",
            WebkitOverflowScrolling:
              "touch",
            overscrollBehaviorX:
              "contain",
          }}
        >
          {items.map(
            (
              item,
              index
            ) => {
              const href =
                item.link_url?.trim() ||
                "/store"

              const label =
                getButtonLabel(
                  item
                )

              const alt =
                item.image_alt?.trim() ||
                item.title?.trim() ||
                `Category ${index + 1}`

              const imageFit =
                item.image_fit === "contain"
                  ? "contain"
                  : "cover"

              const imagePositionX =
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      item.image_position_x ??
                        50
                    )
                  )
                )

              const imagePositionY =
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      item.image_position_y ??
                        50
                    )
                  )
                )

              const imageZoom =
                imageFit === "contain"
                  ? 1
                  : Math.max(
                      1,
                      Math.min(
                        1.8,
                        Number(
                          item.image_zoom ??
                            1
                        )
                      )
                    )

              const imageHoverZoom =
                imageFit === "contain"
                  ? 1
                  : Math.min(
                      1.9,
                      imageZoom *
                        1.025
                    )

              return (
                <article
                  key={`${href}-${index}`}
                  data-category-showcase-card
                  className="
                    category-showcase-card
                    group/category
                    relative
                    shrink-0
                    snap-start
                    overflow-hidden
                    bg-[#EEE9E1]
                  "
                >
                  <LocalizedClientLink
                    href={href}
                    className="
                      relative
                      block
                      h-full
                      w-full
                      overflow-hidden
                    "
                    aria-label={
                      label
                    }
                  >
                    <div
                      className="
                        relative
                        w-full
                        overflow-hidden
                      "
                      style={{
                        aspectRatio:
                          imageRatio,
                      }}
                    >
                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={alt}
                          loading="lazy"
                          draggable={
                            false
                          }
                          className="
                            category-showcase-image
                            absolute
                            inset-0
                            h-full
                            w-full
                            transition-transform
                            duration-700
                            ease-out
                          "
                          style={{
                            objectFit:
                              imageFit,
                            objectPosition:
                              `${imagePositionX}% ${imagePositionY}%`,
                            transformOrigin:
                              `${imagePositionX}% ${imagePositionY}%`,
                            "--category-image-scale":
                              String(
                                imageZoom
                              ),
                            "--category-image-hover-scale":
                              String(
                                imageHoverZoom
                              ),
                          } as ShowcaseCssProperties}
                        />
                      ) : (
                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-[#E9E3DA]
                            px-6
                            text-center
                            text-[12px]
                            text-black/45
                          "
                        >
                          Add category image
                        </div>
                      )}

                      {/*
                       * Very light bottom protection only.
                       * No heavy dark overlay — keeps the
                       * visual premium and image-led.
                       */}
                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-x-0
                          bottom-0
                          h-[24%]
                          bg-gradient-to-t
                          from-black/12
                          to-transparent
                        "
                        aria-hidden="true"
                      />

                      <div
                        className="
                          absolute
                          inset-x-0
                          bottom-4
                          z-10
                          flex
                          justify-center
                          px-4
                          sm:bottom-5
                        "
                      >
                        <span
                          className="
                            category-showcase-cta
                            inline-flex
                            items-center
                            justify-center
                            text-center
                          "
                          style={{
                            fontFamily:
                              '"Helvetica Neue", Helvetica, Arial, sans-serif',
                            fontSize:
                              "clamp(9px, 0.8333vw, 12px)",
                            fontWeight: 400,
                            borderRadius: 0,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            padding:
                              "clamp(6px, 0.9722vw, 14px) clamp(10px, 1.6667vw, 24px)",
                            backgroundColor:
                              buttonBg,
                            color:
                              buttonColor,
                            border:
                              `1px solid ${buttonBorder}`,
                            transition:
                              "background-color 180ms ease, color 180ms ease, border-color 180ms ease, opacity 180ms ease",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                  </LocalizedClientLink>
                </article>
              )
            }
          )}
          </div>

          {showControls && (
            <>
              <button
                type="button"
                aria-label="Previous categories"
                onClick={() =>
                  move("left")
                }
                disabled={
                  !canScrollLeft
                }
                className="
                  category-showcase-side-arrow
                  absolute
                  left-1
                  top-1/2
                  z-40
                  hidden
                  -translate-y-1/2
                  items-center
                  justify-center
                  text-[#29231d]
                  transition-opacity
                  duration-200
                  hover:opacity-60
                  disabled:pointer-events-none
                  disabled:opacity-0
                  lg:flex
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18 9 12l6-6" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Next categories"
                onClick={() =>
                  move("right")
                }
                disabled={
                  !canScrollRight
                }
                className="
                  category-showcase-side-arrow
                  absolute
                  right-1
                  top-1/2
                  z-40
                  hidden
                  -translate-y-1/2
                  items-center
                  justify-center
                  text-[#29231d]
                  transition-opacity
                  duration-200
                  hover:opacity-60
                  disabled:pointer-events-none
                  disabled:opacity-0
                  lg:flex
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .category-showcase-card {
          flex-basis:
            var(--category-fluid-basis);
        }

        .category-showcase-side-arrow {
          width: 44px;
          height: 72px;
          background: transparent;
          border: 0;
          box-shadow: none;
        }

        .category-showcase-image {
          transform: scale(
            var(--category-image-scale)
          );
        }

        .group\/category:hover
          .category-showcase-image {
          transform: scale(
            var(--category-image-hover-scale)
          );
        }

        .category-showcase-cta {
          opacity: 1;
        }

        .category-showcase-card:hover .category-showcase-cta {
          opacity: 0.75;
        }

        /*
         * No card-width breakpoint.
         * The same clamp() curve runs through desktop,
         * tablet and mobile, so there is no mobile size jump.
         */
      `}</style>
    </section>
  )
}