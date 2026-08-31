"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type MediaImage = {
  id?: string
  url: string
}

type SizeLink = {
  value: string
  href: string
  available: boolean
}

type ColorLink = {
  value: string
  href: string
  swatch?: {
    imageUrl: string
    x: number
    y: number
    zoom: number
  }
  fallback: string
  images?: MediaImage[]
  sizes?: SizeLink[]
}

type ProductPreviewMediaProps = {
  title: string
  href: string
  thumbnail?: string | null
  primaryImage?: string | null
  defaultColor?: string | null
  images?: MediaImage[]
  flipImage?: string | null
  colors?: ColorLink[]
  sizes?: SizeLink[]
  isFeatured?: boolean
  disableMobileImageSwipe?: boolean
}

const normalize = (
  value?: string | null
) =>
  value?.trim().toLowerCase() ?? ""

export default function ProductPreviewMedia({
  title,
  href,
  thumbnail,
  primaryImage,
  defaultColor,
  images = [],
  flipImage,
  colors = [],
  sizes = [],
  isFeatured = false,
  disableMobileImageSwipe = false,
}: ProductPreviewMediaProps) {
  /*
   * Product Builder presentation wins over Medusa option order.
   * Example: Black can be the first option, while the chosen Main
   * Card Image belongs to White. In that case White starts selected.
   */
  const [selectedColor, setSelectedColor] =
    useState(
      defaultColor ||
      colors[0]?.value ||
      ""
    )

  const [activeIndex, setActiveIndex] =
    useState(0)

  /*
   * Mobile-only swipe state.
   *
   * IMPORTANT:
   * We intentionally DO NOT use Pointer Capture here.
   * Desktop arrows, swatches and the product link must remain
   * normal native click targets.
   */
  const pointerStartXRef =
    useRef<number | null>(null)

  const pointerCurrentXRef =
    useRef<number | null>(null)

  const pointerIdRef =
    useRef<number | null>(null)

  const didSwipeRef =
    useRef(false)

  /*
   * Laptop trackpad support for the narrow/mobile card layout.
   *
   * Horizontal two-finger gestures normally fall through to the
   * browser and can trigger Back / Forward navigation. We attach
   * a native non-passive wheel listener to THIS card only, so while
   * the cursor is over the product image the gesture changes the
   * selected variant's gallery image instead.
   */
  const mediaRootRef =
    useRef<HTMLDivElement | null>(null)

  const wheelAccumulatorRef =
    useRef(0)

  const wheelLockedRef =
    useRef(false)

  const wheelUnlockTimerRef =
    useRef<number | null>(null)

  const activeColor =
    colors.find(
      (color) =>
        normalize(color.value) ===
        normalize(selectedColor)
    ) ?? colors[0]

  /*
   * IMPORTANT:
   * If the selected color has variant-specific images,
   * use ONLY those images for the card gallery.
   *
   * We fall back to the product-level gallery only when
   * no variant images exist for that color.
   */
  const selectedColorImages =
    activeColor?.images ?? []

  const rawImageUrls =
    selectedColorImages.length > 0
      ? Array.from(
          new Set(
            selectedColorImages
              .map((image) => image.url)
              .filter(
                (url): url is string =>
                  typeof url === "string" &&
                  url.trim().length > 0
              )
          )
        )
      : Array.from(
          new Set(
            [
              primaryImage,
              thumbnail,
              ...images.map(
                (image) => image.url
              ),
            ].filter(
              (url): url is string =>
                typeof url === "string" &&
                url.trim().length > 0
            )
          )
        )

  /*
   * Main Card Image must be image #1 only for its own default color.
   * Once the shopper selects another swatch, that color's own image
   * gallery becomes authoritative and no White/Black cross-mixing occurs.
   */
  const isDefaultColorActive =
    !defaultColor ||
    normalize(activeColor?.value) ===
      normalize(defaultColor)

  const imageUrls =
    isDefaultColorActive &&
    primaryImage &&
    rawImageUrls.includes(primaryImage)
      ? [
          primaryImage,
          ...rawImageUrls.filter(
            (url) =>
              url !== primaryImage
          ),
        ]
      : rawImageUrls

  const displaySizes =
    activeColor?.sizes ?? sizes

  const activeHref =
    activeColor?.href ?? href

  const hasMultipleImages =
    imageUrls.length > 1

  const safeActiveIndex =
    activeIndex <
    imageUrls.length
      ? activeIndex
      : 0

  const activeImage =
    imageUrls[safeActiveIndex]

  const selectColor = (
    color: ColorLink
  ) => {
    setSelectedColor(
      color.value
    )

    /*
     * Start the newly selected color from
     * its first image.
     */
    setActiveIndex(0)
  }

  const previousImage = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (!hasMultipleImages) {
      return
    }

    goToPreviousImage()
  }

  const nextImage = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (!hasMultipleImages) {
      return
    }

    goToNextImage()
  }

  const isInteractiveControl = (
    target: EventTarget | null
  ) => {
    if (
      !(target instanceof HTMLElement)
    ) {
      return false
    }

    return Boolean(
      target.closest(
        "button, input, select, textarea, [role='button']"
      )
    )
  }

  const goToPreviousImage = () => {
    if (!hasMultipleImages) {
      return
    }

    setActiveIndex((current) =>
      current <= 0
        ? imageUrls.length - 1
        : current - 1
    )
  }

  const goToNextImage = () => {
    if (!hasMultipleImages) {
      return
    }

    setActiveIndex((current) =>
      current >= imageUrls.length - 1
        ? 0
        : current + 1
    )
  }

  const isMobileViewport = () =>
    typeof window !== "undefined" &&
    window.matchMedia(
      "(max-width: 767px)"
    ).matches

  useEffect(() => {
    const element =
      mediaRootRef.current

    if (!element) {
      return
    }

    const handleTrackpadWheel = (
      event: WheelEvent
    ) => {
      /*
       * This behavior is intentionally limited to the narrow/mobile
       * product-card layout. Desktop remains exactly as before.
       */
      if (
        disableMobileImageSwipe ||
        !isMobileViewport() ||
        imageUrls.length <= 1
      ) {
        return
      }

      /*
       * Most trackpads report horizontal two-finger movement as deltaX.
       * Shift + vertical wheel is also treated as horizontal navigation.
       */
      const horizontalDelta =
        Math.abs(event.deltaX) > 0
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0

      const isHorizontalGesture =
        Math.abs(horizontalDelta) >
        Math.abs(event.deltaY) * 0.75

      if (
        !isHorizontalGesture ||
        Math.abs(horizontalDelta) < 1
      ) {
        return
      }

      /*
       * Critical: stop the browser from treating this gesture as
       * history Back / Forward while the cursor is on the product.
       */
      if (event.cancelable) {
        event.preventDefault()
      }

      event.stopPropagation()

      if (wheelLockedRef.current) {
        return
      }

      wheelAccumulatorRef.current +=
        horizontalDelta

      /*
       * Accumulate small high-resolution trackpad deltas so an
       * accidental tiny movement doesn't change the product image.
       */
      const SWIPE_THRESHOLD = 28

      if (
        Math.abs(
          wheelAccumulatorRef.current
        ) < SWIPE_THRESHOLD
      ) {
        return
      }

      const direction =
        wheelAccumulatorRef.current > 0
          ? 1
          : -1

      wheelAccumulatorRef.current = 0
      wheelLockedRef.current = true
      didSwipeRef.current = true

      setActiveIndex((current) => {
        const lastIndex =
          imageUrls.length - 1

        if (direction > 0) {
          return current >= lastIndex
            ? 0
            : current + 1
        }

        return current <= 0
          ? lastIndex
          : current - 1
      })

      /*
       * A physical trackpad gesture emits many wheel events.
       * Lock briefly so one swipe advances exactly one image.
       */
      if (
        wheelUnlockTimerRef.current
      ) {
        window.clearTimeout(
          wheelUnlockTimerRef.current
        )
      }

      wheelUnlockTimerRef.current =
        window.setTimeout(() => {
          wheelLockedRef.current = false
          didSwipeRef.current = false
          wheelAccumulatorRef.current = 0
          wheelUnlockTimerRef.current = null
        }, 240)
    }

    element.addEventListener(
      "wheel",
      handleTrackpadWheel,
      {
        passive: false,
      }
    )

    return () => {
      element.removeEventListener(
        "wheel",
        handleTrackpadWheel
      )

      if (
        wheelUnlockTimerRef.current
      ) {
        window.clearTimeout(
          wheelUnlockTimerRef.current
        )

        wheelUnlockTimerRef.current =
          null
      }

      wheelAccumulatorRef.current = 0
      wheelLockedRef.current = false
    }
  }, [
    imageUrls.length,
    disableMobileImageSwipe,
  ])

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    /*
     * Mobile interaction only.
     * Desktop card behavior stays untouched.
     */
    if (
      disableMobileImageSwipe ||
      !isMobileViewport() ||
      isInteractiveControl(
        event.target
      ) ||
      !hasMultipleImages
    ) {
      return
    }

    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return
    }

    pointerStartXRef.current =
      event.clientX

    pointerCurrentXRef.current =
      event.clientX

    pointerIdRef.current =
      event.pointerId

    didSwipeRef.current = false
  }

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      disableMobileImageSwipe ||
      !isMobileViewport() ||
      pointerStartXRef.current ===
        null ||
      pointerIdRef.current !==
        event.pointerId
    ) {
      return
    }

    pointerCurrentXRef.current =
      event.clientX
  }

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      disableMobileImageSwipe ||
      !isMobileViewport() ||
      pointerStartXRef.current ===
        null ||
      pointerCurrentXRef.current ===
        null ||
      pointerIdRef.current !==
        event.pointerId
    ) {
      return
    }

    const distance =
      pointerCurrentXRef.current -
      pointerStartXRef.current

    if (
      Math.abs(distance) >= 35
    ) {
      didSwipeRef.current = true

      if (distance < 0) {
        goToNextImage()
      } else {
        goToPreviousImage()
      }
    }

    pointerStartXRef.current = null
    pointerCurrentXRef.current = null
    pointerIdRef.current = null

    /*
     * Prevent the synthetic click after a successful swipe.
     */
    window.setTimeout(() => {
      didSwipeRef.current = false
    }, 120)
  }

  const handlePointerCancel = () => {
    pointerStartXRef.current = null
    pointerCurrentXRef.current = null
    pointerIdRef.current = null
    didSwipeRef.current = false
  }

  const handleClickCapture = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      isInteractiveControl(
        event.target
      )
    ) {
      return
    }

    if (
      didSwipeRef.current
    ) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  /*
   * Hover uses the Product Builder Flip image
   * only when that Flip image belongs to the
   * CURRENT selected color gallery.
   *
   * This prevents another color's Flip image
   * from appearing accidentally.
   */
  const showFlipImage = () => {
    /*
     * Mobile cards use swipe, not hover-flip.
     * This also keeps Chrome mobile emulation from changing
     * the progress line just because the mouse is hovering.
     */
    if (
      isMobileViewport() ||
      !imageUrls.length
    ) {
      return
    }

    if (flipImage) {
      const flipIndex =
        imageUrls.findIndex(
          (url) =>
            url === flipImage
        )

      if (flipIndex !== -1) {
        setActiveIndex(
          flipIndex
        )
        return
      }
    }

    /*
     * If the configured Flip belongs to another
     * color, fall back to the second image of the
     * selected color only.
     */
    if (imageUrls.length > 1) {
      setActiveIndex(1)
    }
  }

  const restoreFirstImage = () => {
    if (isMobileViewport()) {
      return
    }

    setActiveIndex(0)
  }

  return (
    <div
      ref={mediaRootRef}
      className={[
        "group/media relative w-full overflow-hidden bg-[#f4f1ec]",
        isFeatured
          ? "aspect-[2/3]"
          : "aspect-[2/3]",
      ].join(" ")}
      onMouseEnter={showFlipImage}
      onMouseLeave={restoreFirstImage}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      style={{
        touchAction:
          disableMobileImageSwipe
            ? "auto"
            : "pan-y",
        overscrollBehaviorX:
          "contain",
      }}
    >
      <LocalizedClientLink
        href={activeHref}
        className="absolute inset-0 z-10 block"
        aria-label={`View ${title}`}
      >
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            draggable={false}
            quality={75}
            sizes="
              (max-width: 640px) 50vw,
              (max-width: 1024px) 33vw,
              25vw
            "
            className="
              object-contain
              object-center
              transition-opacity
              duration-200
            "
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlaceholderImage size={24} />
          </div>
        )}
      </LocalizedClientLink>

      {colors.length > 0 && (
        <div
          className="
            absolute
            right-2
            top-2
            z-20
            flex
            max-w-[150px]
            flex-wrap
            justify-end
            gap-1
            opacity-100
            transition-opacity
            md:pointer-events-none
            md:opacity-0
            md:group-hover/media:pointer-events-auto
            md:group-hover/media:opacity-100
          "
        >
          {colors.map((color) => {
            const isSelected =
              normalize(
                activeColor?.value
              ) ===
              normalize(color.value)

            return (
              <button
                key={color.value}
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  selectColor(color)
                }}
                aria-label={`Show ${title} in ${color.value}`}
                aria-pressed={isSelected}
                className={[
                  "group/swatch relative block h-[12px] w-[12px] shrink-0 transition-opacity md:h-[13px] md:w-[13px]",
                  isSelected
                    ? "after:absolute after:-bottom-[4px] after:left-0 after:right-0 after:h-px after:bg-black"
                    : "",
                ].join(" ")}
              >
                <span
                  className="
                    absolute
                    inset-0
                    overflow-hidden
                  "
                  style={
                    color.swatch
                      ? {
                          backgroundImage:
                            `url(${color.swatch.imageUrl})`,
                          backgroundRepeat:
                            "no-repeat",
                          backgroundPosition:
                            `${color.swatch.x}% ${color.swatch.y}%`,
                          backgroundSize:
                            `${color.swatch.zoom * 100}% auto`,
                        }
                      : {
                          backgroundColor:
                            color.fallback,
                        }
                  }
                />

                <span
                  className="
                    pointer-events-none
                    absolute
                    right-0
                    top-full
                    z-30
                    mt-1
                    hidden
                    whitespace-nowrap
                    bg-white/95
                    px-1.5
                    py-1
                    text-[9px]
                    font-medium
                    text-[#302823]
                    opacity-0
                    shadow-sm
                    transition-opacity
                    md:block
                    group-hover/swatch:opacity-100
                  "
                >
                  {color.value}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {hasMultipleImages && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={previousImage}
            className="
              absolute
              left-2
              top-1/2
              z-30
              hidden
              h-8
              w-8
              -translate-y-1/2
              items-center
              justify-center
              bg-transparent
              text-[#302823]
              opacity-0
              transition-opacity
              duration-150
              md:flex
              group-hover/media:opacity-100
            "
          >
            <span className="text-[23px] font-light leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            aria-label="Next image"
            onClick={nextImage}
            className="
              absolute
              right-2
              top-1/2
              z-30
              hidden
              h-8
              w-8
              -translate-y-1/2
              items-center
              justify-center
              bg-transparent
              text-[#302823]
              opacity-0
              transition-opacity
              duration-150
              md:flex
              group-hover/media:opacity-100
            "
          >
            <span className="text-[23px] font-light leading-none">
              ›
            </span>
          </button>
        </>
      )}

      {hasMultipleImages && (
        <div
          className="
            pointer-events-none
            absolute
            bottom-0
            left-0
            right-0
            z-30
            h-px
            bg-black/15
            md:hidden
          "
          aria-hidden="true"
        >
          <span
            className="
              absolute
              bottom-0
              left-0
              h-px
              bg-black
              transition-transform
              duration-200
              ease-out
            "
            style={{
              width:
                `${100 / imageUrls.length}%`,
              transform:
                `translateX(${safeActiveIndex * 100}%)`,
            }}
          />
        </div>
      )}

      {displaySizes.length > 0 && (
        <div
          className="
            absolute
            bottom-0
            left-0
            right-0
            z-40
            hidden
            min-h-[42px]
            translate-y-full
            items-center
            justify-center
            gap-x-4
            bg-white/[0.40]
            px-3
            backdrop-blur-[2px]
            transition-transform
            duration-150
            md:flex
            group-hover/media:translate-y-0
          "
        >
          {displaySizes
            .slice(0, 8)
            .map((size) =>
              size.available ? (
                <LocalizedClientLink
                  key={size.value}
                  href={size.href}
                  aria-label={`View ${title} in size ${size.value}`}
                  className="
                    whitespace-nowrap
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.01em]
                    text-[#302823]
                    transition-opacity
                    hover:opacity-45
                  "
                >
                  {size.value}
                </LocalizedClientLink>
              ) : (
                <span
                  key={size.value}
                  title={`${size.value} - Out of stock`}
                  className="
                    whitespace-nowrap
                    text-[10px]
                    font-medium
                    uppercase
                    text-black/25
                    line-through
                  "
                >
                  {size.value}
                </span>
              )
            )}
        </div>
      )}
    </div>
  )
}
