"use client"

import Image from "next/image"
import {
  useMemo,
  useState,
} from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type SizeLink = {
  value: string
  href: string
  available: boolean
}

type ColorLink = {
  value: string
  href: string
  color: string
}

type ProductShowcaseCardMediaProps = {
  title: string
  handle: string

  thumbnail?: string | null

  images?: Array<{
    id?: string | null
    url?: string | null
  }>

  flipImageUrl?: string

  sizes?: SizeLink[]
  colors?: ColorLink[]

  imageRatio?:
    | "portrait"
    | "square"
    | "landscape"
    | "editorial"

  showBadge?: boolean
}

const buildImages = ({
  thumbnail,
  images,
}: {
  thumbnail?: string | null

  images?: Array<{
    id?: string | null
    url?: string | null
  }>
}) => {
  const result: string[] = []
  const seen = new Set<string>()

  const add = (
    url?: string | null
  ) => {
    if (!url) {
      return
    }

    const clean = url.trim()

    if (
      !clean ||
      seen.has(clean)
    ) {
      return
    }

    seen.add(clean)
    result.push(clean)
  }

  add(thumbnail)

  for (
    const image of images ?? []
  ) {
    add(image.url)
  }

  return result
}

export default function ProductShowcaseCardMedia({
  title,
  handle,
  thumbnail,
  images: productImages,
  flipImageUrl,
  sizes = [],
  colors = [],
  imageRatio = "portrait",
  showBadge = true,
}: ProductShowcaseCardMediaProps) {
  const images = useMemo(
    () =>
      buildImages({
        thumbnail,
        images: productImages,
      }),
    [
      thumbnail,
      productImages,
    ]
  )

  const [
    imageIndex,
    setImageIndex,
  ] = useState(0)

  const [
    imageHovered,
    setImageHovered,
  ] = useState(false)

  const [
    hoveredColor,
    setHoveredColor,
  ] = useState<
    string | null
  >(null)

  const ratioClass = {
    portrait: "aspect-[11/14]",
    square: "aspect-square",
    landscape: "aspect-[4/3]",
    editorial: "aspect-[3/4]",
  }[imageRatio]

  const normalImage =
    images[
      Math.min(
        imageIndex,
        Math.max(
          0,
          images.length - 1
        )
      )
    ] ?? null

  /*
   * Admin selected flip image gets priority.
   * Otherwise second gallery image is used.
   */
  const hoverImage =
    flipImageUrl?.trim() ||
    (images.length > 1
      ? images[1]
      : normalImage)

  /*
   * Hover image should only activate while
   * the card is on its first/default image.
   */
  const isShowingHoverImage =
    Boolean(
      imageHovered &&
        imageIndex === 0 &&
        hoverImage
    )

  const activeImage =
    isShowingHoverImage
      ? hoverImage
      : normalImage

  /*
   * If an explicit flip image was selected
   * in Product Builder, show the COMPLETE
   * image without cropping it.
   *
   * Normal/gallery images retain object-cover.
   */
  const isAdminFlipImage =
    Boolean(
      isShowingHoverImage &&
        flipImageUrl?.trim() &&
        activeImage ===
          flipImageUrl.trim()
    )

  const previousImage = () => {
    if (images.length <= 1) {
      return
    }

    setImageHovered(false)

    setImageIndex(
      (current) =>
        current <= 0
          ? images.length - 1
          : current - 1
    )
  }

  const nextImage = () => {
    if (images.length <= 1) {
      return
    }

    setImageHovered(false)

    setImageIndex(
      (current) =>
        current >=
        images.length - 1
          ? 0
          : current + 1
    )
  }

  return (
    <div
      className={`group/media relative w-full overflow-hidden bg-[#f5f3ef] ${ratioClass}`}
      onMouseEnter={() =>
        setImageHovered(true)
      }
      onMouseLeave={() => {
        setImageHovered(false)
        setHoveredColor(null)
      }}
    >
      <LocalizedClientLink
        href={`/products/${handle}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${title}`}
      >
        {activeImage ? (
          <Image
            key={activeImage}
            src={activeImage}
            alt={title}
            fill
            draggable={false}
            quality={78}
            sizes="(max-width: 768px) 50vw, 25vw"
            className={
              isAdminFlipImage
                ? "object-contain object-center transition-opacity duration-200"
                : "object-cover object-center transition-opacity duration-200"
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlaceholderImage
              size={24}
            />
          </div>
        )}
      </LocalizedClientLink>

      {showBadge && (
        <div className="pointer-events-none absolute right-3 top-3 z-20">
          <span className="bg-[#4b9d8a] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-white">
            New in
          </span>
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous product image"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()

              previousImage()
            }}
            className="
              absolute
              left-2
              top-1/2
              z-30
              flex
              h-8
              w-8
              -translate-y-1/2
              items-center
              justify-center
              bg-white/80
              text-[#29231d]
              opacity-0
              transition-opacity
              duration-150
              hover:bg-white
              group-hover/media:opacity-100
              max-md:opacity-100
            "
          >
            <span className="text-[23px] font-light leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            aria-label="Next product image"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()

              nextImage()
            }}
            className="
              absolute
              right-2
              top-1/2
              z-30
              flex
              h-8
              w-8
              -translate-y-1/2
              items-center
              justify-center
              bg-white/80
              text-[#29231d]
              opacity-0
              transition-opacity
              duration-150
              hover:bg-white
              group-hover/media:opacity-100
              max-md:opacity-100
            "
          >
            <span className="text-[23px] font-light leading-none">
              ›
            </span>
          </button>
        </>
      )}

      {sizes.length > 0 && (
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
            bg-white/78
            px-3
            backdrop-blur-[1px]
            transition-transform
            duration-150
            md:flex
            group-hover/media:translate-y-0
          "
        >
          {sizes
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
                  title={`${size.value} - unavailable`}
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

      {hoveredColor && (
        <span className="sr-only">
          Previewing{" "}
          {hoveredColor}
        </span>
      )}

      {colors.length > 0 &&
        null}
    </div>
  )
}