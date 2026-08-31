"use client"

import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductShowcaseSliderProps = {
  children: ReactNode
  title: string
  subtitle?: string | null
  ctaHref: string
}

export default function ProductShowcaseSlider({
  children,
  title,
  subtitle,
  ctaHref,
}: ProductShowcaseSliderProps) {
  const railRef =
    useRef<HTMLDivElement | null>(
      null
    )

  const [canScrollLeft, setCanScrollLeft] =
    useState(false)

  const [canScrollRight, setCanScrollRight] =
    useState(false)

  const updateArrowState =
    useCallback(() => {
      const rail = railRef.current

      if (!rail) {
        return
      }

      const maxScroll =
        rail.scrollWidth -
        rail.clientWidth

      setCanScrollLeft(
        rail.scrollLeft > 2
      )

      setCanScrollRight(
        rail.scrollLeft <
          maxScroll - 2
      )
    }, [])

  useEffect(() => {
    const rail = railRef.current

    if (!rail) {
      return
    }

    updateArrowState()

    rail.addEventListener(
      "scroll",
      updateArrowState,
      {
        passive: true,
      }
    )

    const resizeObserver =
      new ResizeObserver(() => {
        updateArrowState()
      })

    resizeObserver.observe(rail)

    Array.from(
      rail.children
    ).forEach((child) => {
      resizeObserver.observe(child)
    })

    return () => {
      rail.removeEventListener(
        "scroll",
        updateArrowState
      )

      resizeObserver.disconnect()
    }
  }, [
    children,
    updateArrowState,
  ])

  const move = (
    direction: "left" | "right"
  ) => {
    const rail = railRef.current

    if (!rail) {
      return
    }

    const firstSlide =
      rail.querySelector<HTMLElement>(
        "[data-showcase-slide]"
      )

    const styles =
      window.getComputedStyle(rail)

    const gap =
      Number.parseFloat(
        styles.columnGap ||
          styles.gap ||
          "0"
      ) || 0

    const step =
      (firstSlide?.offsetWidth ||
        rail.clientWidth) +
      gap

    rail.scrollBy({
      left:
        direction === "right"
          ? step
          : -step,
      behavior: "smooth",
    })
  }

  return (
    <div className="w-full">
      {/*
       * Brand typography stays ours.
       * Only the carousel interaction/layout is inspired
       * by the reference.
       */}
      <div className="mb-8 text-center md:mb-10">
        {subtitle && (
          <p
            className="
              mb-3
              text-[10px]
              font-medium
              uppercase
              tracking-[0.22em]
              text-[#6e625a]
            "
          >
            {subtitle}
          </p>
        )}

        <div className="flex items-center justify-center gap-7 sm:gap-9">
          <button
            type="button"
            aria-label="Previous products"
            onClick={() =>
              move("left")
            }
            disabled={!canScrollLeft}
            className="
              inline-flex
              h-8
              w-8
              items-center
              justify-center
              bg-transparent
              text-[#29231d]
              transition-opacity
              disabled:pointer-events-none
              disabled:opacity-25
            "
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18 9 12l6-6" />
            </svg>
          </button>

          <h2
            className="
              min-w-0
              text-[22px]
              font-normal
              tracking-[-0.02em]
              text-[#29231d]
              sm:text-[26px]
            "
            style={{
              fontFamily:
                "'Playfair Display', 'Times New Roman', serif",
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            aria-label="Next products"
            onClick={() =>
              move("right")
            }
            disabled={!canScrollRight}
            className="
              inline-flex
              h-8
              w-8
              items-center
              justify-center
              bg-transparent
              text-[#29231d]
              transition-opacity
              disabled:pointer-events-none
              disabled:opacity-25
            "
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="mt-2.5 flex justify-center">
          <LocalizedClientLink
            href={ctaHref}
            className="
              border-b
              border-[#29231d]/60
              pb-[2px]
              text-[10px]
              font-normal
              uppercase
              tracking-[0.14em]
              text-[#29231d]
              transition-opacity
              hover:opacity-60
            "
            style={{
              fontFamily:
                '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            Discover More
          </LocalizedClientLink>
        </div>
      </div>

      <div
        ref={railRef}
        className="
          flex
          w-full
          snap-x
          snap-mandatory
          gap-5
          overflow-x-auto
          overflow-y-hidden
          scroll-smooth
          pb-1
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
        style={{
          WebkitOverflowScrolling:
            "touch",
          overscrollBehaviorX:
            "contain",
        }}
      >
        {children}
      </div>
    </div>
  )
}
