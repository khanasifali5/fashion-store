"use client"

import { HttpTypes } from "@medusajs/types"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

type PreviewEventDetail = {
  image?: HttpTypes.StoreProductImage
  images?: HttpTypes.StoreProductImage[]
}

type CommitEventDetail = {
  images?: HttpTypes.StoreProductImage[]
}

const imagesKey = (
  items: HttpTypes.StoreProductImage[]
) => {
  return items
    .map(
      (image) =>
        `${image.id ?? ""}:${image.url ?? ""}`
    )
    .join("|")
}

const ImageGallery = ({
  images,
}: ImageGalleryProps) => {
  const [
    committedImages,
    setCommittedImages,
  ] = useState<
    HttpTypes.StoreProductImage[]
  >(() => images)

  const [
    previewImages,
    setPreviewImages,
  ] = useState<
    HttpTypes.StoreProductImage[]
  >([])

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false)

  const [
    lightboxStartIndex,
    setLightboxStartIndex,
  ] = useState(0)


  const [
    activeLightboxIndex,
    setActiveLightboxIndex,
  ] = useState(0)

  /*
   * Mobile product-page gallery:
   * one controlled image at a time.
   *
   * Desktop gallery remains unchanged.
   */
  const [
    mobileGalleryIndex,
    setMobileGalleryIndex,
  ] = useState(0)

  const mobileSwipeStartXRef =
    useRef<number | null>(null)

  const mobileSwipeCurrentXRef =
    useRef<number | null>(null)

  const mobileSwipePointerIdRef =
    useRef<number | null>(null)

  const mobileSwipeTargetRef =
    useRef<
      "gallery" | "lightbox" | null
    >(null)

  const suppressMobileImageClickRef =
    useRef(false)

  const committedKeyRef =
    useRef(imagesKey(images))

  const previewKeyRef =
    useRef("")

  const desktopLightboxRefs =
    useRef<
      Array<HTMLDivElement | null>
    >([])

  const thumbnailRefs =
    useRef<
      Array<HTMLButtonElement | null>
    >([])

  const preloadOne = (
    image?: HttpTypes.StoreProductImage
  ) => {
    if (!image?.url) {
      return
    }

    const preloadImage =
      new window.Image()

    preloadImage.src = image.url
  }

  const preloadMany = (
    items: HttpTypes.StoreProductImage[]
  ) => {
    items.forEach((image) => {
      preloadOne(image)
    })
  }

  useEffect(() => {
    const nextKey =
      imagesKey(images)

    if (
      nextKey ===
      committedKeyRef.current
    ) {
      return
    }

    committedKeyRef.current =
      nextKey

    setCommittedImages(images)

    preloadMany(images)
  }, [images])

  useEffect(() => {
    const handlePreview = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<PreviewEventDetail>

      const detail = customEvent.detail

      const nextImages =
        detail?.images?.filter((image) => Boolean(image?.url)) ??
        (detail?.image?.url ? [detail.image] : [])

      if (!nextImages.length) {
        return
      }

      const nextKey =
        imagesKey(nextImages)

      if (
        previewKeyRef.current ===
        nextKey
      ) {
        return
      }

      preloadMany(nextImages)

      previewKeyRef.current =
        nextKey

      setPreviewImages(
        nextImages
      )
    }

    const handleCommit = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<CommitEventDetail>

      const nextImages =
        customEvent.detail?.images ?? []

      if (!nextImages.length) {
        return
      }

      const nextKey =
        imagesKey(nextImages)

      preloadMany(nextImages)

      if (
        committedKeyRef.current !==
        nextKey
      ) {
        committedKeyRef.current =
          nextKey

        setCommittedImages(
          nextImages
        )
      }

      previewKeyRef.current = ""

      setPreviewImages([])
    }

    const handleClear = () => {
      if (
        !previewKeyRef.current
      ) {
        return
      }

      previewKeyRef.current = ""

      setPreviewImages([])
    }

    window.addEventListener(
      "product-color-preview",
      handlePreview
    )

    window.addEventListener(
      "product-color-commit",
      handleCommit
    )

    window.addEventListener(
      "product-color-preview-clear",
      handleClear
    )

    return () => {
      window.removeEventListener(
        "product-color-preview",
        handlePreview
      )

      window.removeEventListener(
        "product-color-commit",
        handleCommit
      )

      window.removeEventListener(
        "product-color-preview-clear",
        handleClear
      )
    }
  }, [])

  /*
   * Hover must show the REAL image set for the hovered color.
   * Do not repeat/fake images just to keep the old gallery length.
   *
   * Flicker is handled by disabling browser scroll anchoring on the
   * gallery container below, so changing gallery length does not pull
   * the viewport away from the color swatch.
   */
  const visibleImages =
    useMemo(() => {
      return previewImages.length
        ? previewImages
        : committedImages
    }, [
      committedImages,
      previewImages,
    ])

  const visibleImagesSignature =
    imagesKey(visibleImages)

  /*
   * New selected color / variant => start from its first image.
   */
  useEffect(() => {
    setMobileGalleryIndex(0)
    setActiveLightboxIndex(0)
  }, [visibleImagesSignature])

  const hasMultipleVisibleImages =
    visibleImages.length > 1

  const safeMobileGalleryIndex =
    Math.min(
      mobileGalleryIndex,
      Math.max(
        visibleImages.length - 1,
        0
      )
    )

  const safeActiveLightboxIndex =
    Math.min(
      activeLightboxIndex,
      Math.max(
        visibleImages.length - 1,
        0
      )
    )

  const mobileGalleryImage =
    visibleImages[
      safeMobileGalleryIndex
    ]

  const mobileLightboxImage =
    visibleImages[
      safeActiveLightboxIndex
    ]

  const previousIndex = (
    current: number
  ) => {
    if (!visibleImages.length) {
      return 0
    }

    return current <= 0
      ? visibleImages.length - 1
      : current - 1
  }

  const nextIndex = (
    current: number
  ) => {
    if (!visibleImages.length) {
      return 0
    }

    return current >=
      visibleImages.length - 1
      ? 0
      : current + 1
  }

  const showPreviousMobileImage =
    () => {
      if (!hasMultipleVisibleImages) {
        return
      }

      setMobileGalleryIndex(
        (current) =>
          previousIndex(current)
      )
    }

  const showNextMobileImage =
    () => {
      if (!hasMultipleVisibleImages) {
        return
      }

      setMobileGalleryIndex(
        (current) =>
          nextIndex(current)
      )
    }

  const showPreviousMobileLightboxImage =
    () => {
      if (!hasMultipleVisibleImages) {
        return
      }

      setActiveLightboxIndex(
        (current) =>
          previousIndex(current)
      )
    }

  const showNextMobileLightboxImage =
    () => {
      if (!hasMultipleVisibleImages) {
        return
      }

      setActiveLightboxIndex(
        (current) =>
          nextIndex(current)
      )
    }

  const startMobileSwipe = (
    event:
      React.PointerEvent<HTMLElement>,
    target:
      "gallery" | "lightbox"
  ) => {
    if (
      !hasMultipleVisibleImages
    ) {
      return
    }

    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return
    }

    mobileSwipeStartXRef.current =
      event.clientX

    mobileSwipeCurrentXRef.current =
      event.clientX

    mobileSwipePointerIdRef.current =
      event.pointerId

    mobileSwipeTargetRef.current =
      target

    suppressMobileImageClickRef.current =
      false
  }

  const moveMobileSwipe = (
    event:
      React.PointerEvent<HTMLElement>
  ) => {
    if (
      mobileSwipeStartXRef.current ===
        null ||
      mobileSwipePointerIdRef.current !==
        event.pointerId
    ) {
      return
    }

    mobileSwipeCurrentXRef.current =
      event.clientX
  }

  const finishMobileSwipe = (
    event:
      React.PointerEvent<HTMLElement>
  ) => {
    if (
      mobileSwipeStartXRef.current ===
        null ||
      mobileSwipeCurrentXRef.current ===
        null ||
      mobileSwipePointerIdRef.current !==
        event.pointerId
    ) {
      return
    }

    const distance =
      mobileSwipeCurrentXRef.current -
      mobileSwipeStartXRef.current

    if (
      Math.abs(distance) >= 35
    ) {
      suppressMobileImageClickRef.current =
        true

      if (
        mobileSwipeTargetRef.current ===
        "gallery"
      ) {
        if (distance < 0) {
          showNextMobileImage()
        } else {
          showPreviousMobileImage()
        }
      }

      if (
        mobileSwipeTargetRef.current ===
        "lightbox"
      ) {
        if (distance < 0) {
          showNextMobileLightboxImage()
        } else {
          showPreviousMobileLightboxImage()
        }
      }

      window.setTimeout(() => {
        suppressMobileImageClickRef.current =
          false
      }, 180)
    }

    mobileSwipeStartXRef.current =
      null

    mobileSwipeCurrentXRef.current =
      null

    mobileSwipePointerIdRef.current =
      null

    mobileSwipeTargetRef.current =
      null
  }

  const cancelMobileSwipe = () => {
    mobileSwipeStartXRef.current =
      null

    mobileSwipeCurrentXRef.current =
      null

    mobileSwipePointerIdRef.current =
      null

    mobileSwipeTargetRef.current =
      null

    suppressMobileImageClickRef.current =
      false
  }

  const openLightbox = (
    index: number
  ) => {
    setLightboxStartIndex(index)
    setActiveLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  useEffect(() => {
    if (!lightboxOpen) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        closeLightbox()
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [lightboxOpen])

  useEffect(() => {
    if (!lightboxOpen) {
      return
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          const desktopTarget =
            desktopLightboxRefs
              .current[
              lightboxStartIndex
            ]

          desktopTarget?.scrollIntoView({
            block: "start",
          })

        }
      )

    return () => {
      window.cancelAnimationFrame(
        frame
      )
    }
  }, [
    lightboxOpen,
    lightboxStartIndex,
  ])

  const scrollDesktopToImage = (
    index: number
  ) => {
    setActiveLightboxIndex(index)

    desktopLightboxRefs
      .current[index]
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })

    thumbnailRefs
      .current[index]
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
  }

  useEffect(() => {
    if (!lightboxOpen) {
      return
    }

    const elements =
      desktopLightboxRefs.current
        .filter(
          (
            element
          ): element is HTMLDivElement =>
            Boolean(element)
        )

    if (!elements.length) {
      return
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleEntry =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio
              )[0]

          if (!visibleEntry) {
            return
          }

          const index =
            desktopLightboxRefs.current.indexOf(
              visibleEntry.target as HTMLDivElement
            )

          if (index < 0) {
            return
          }

          setActiveLightboxIndex(index)

          thumbnailRefs
            .current[index]
            ?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            })
        },
        {
          root: null,
          threshold: [
            0.35,
            0.55,
            0.75,
          ],
        }
      )

    elements.forEach(
      (element) =>
        observer.observe(element)
    )

    return () => {
      observer.disconnect()
    }
  }, [
    lightboxOpen,
    visibleImages.length,
  ])

  if (!committedImages.length) {
    return (
      <div className="w-full py-16 text-center text-sm text-gray-400">
        No product image
      </div>
    )
  }

  return (
    <>
      {/* ==================================================
          MOBILE PRODUCT GALLERY
          Single image, transparent arrows, swipe/drag.
          No horizontal carousel / scrollbar.
      =================================================== */}
      <div
        className="
          relative
          w-full
          overflow-hidden
          lg:hidden
        "
        style={{
          overflowAnchor: "none",
        }}
      >
        {mobileGalleryImage?.url && (
          <button
            type="button"
            onPointerDown={(event) =>
              startMobileSwipe(
                event,
                "gallery"
              )
            }
            onPointerMove={
              moveMobileSwipe
            }
            onPointerUp={
              finishMobileSwipe
            }
            onPointerCancel={
              cancelMobileSwipe
            }
            onClick={() => {
              if (
                suppressMobileImageClickRef.current
              ) {
                return
              }

              openLightbox(
                safeMobileGalleryIndex
              )
            }}
            aria-label={`Open product image ${
              safeMobileGalleryIndex +
              1
            } in full screen`}
            className="
              block
              w-full
              overflow-hidden
              bg-transparent
              p-0
              text-left
              cursor-zoom-in
            "
            style={{
              touchAction: "pan-y",
            }}
          >
            <img
              src={
                mobileGalleryImage.url
              }
              alt={`Product image ${
                safeMobileGalleryIndex +
                1
              }`}
              draggable={false}
              loading="eager"
              decoding="async"
              className="
                block
                h-auto
                w-full
                select-none
                object-contain
              "
            />
          </button>
        )}

        {hasMultipleVisibleImages && (
          <>
            <button
              type="button"
              onClick={
                showPreviousMobileImage
              }
              aria-label="Previous image"
              className="
                absolute
                left-2
                top-1/2
                z-20
                flex
                -translate-y-1/2
                items-center
                justify-center
                bg-transparent
                p-2
                text-black
                transition-opacity
                hover:opacity-55
              "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 4.5 7.5 12 15 19.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={
                showNextMobileImage
              }
              aria-label="Next image"
              className="
                absolute
                right-2
                top-1/2
                z-20
                flex
                -translate-y-1/2
                items-center
                justify-center
                bg-transparent
                p-2
                text-black
                transition-opacity
                hover:opacity-55
              "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m9 4.5 7.5 7.5L9 19.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ==================================================
          DESKTOP PRODUCT GALLERY
          Original behavior intentionally preserved.
      =================================================== */}
      <div
        style={{
          overflowAnchor: "none",
        }}
        className="
          hidden
          w-full
          lg:flex
          lg:flex-col
          lg:gap-0
          lg:overflow-visible
          lg:snap-none
        "
      >
        {visibleImages.map(
          (
            displayImage,
            index
          ) => {
            if (
              !displayImage.url
            ) {
              return null
            }

            return (
              <button
                type="button"
                key={
                  displayImage.id ??
                  displayImage.url ??
                  index
                }
                id={
                  displayImage.id ??
                  undefined
                }
                onClick={() =>
                  openLightbox(index)
                }
                aria-label={`Open product image ${
                  index + 1
                } in full screen`}
                className="
                  block
                  w-full
                  min-w-0
                  shrink
                  overflow-hidden
                  bg-transparent
                  p-0
                  text-left
                  cursor-zoom-in
                "
              >
                <img
                  src={
                    displayImage.url
                  }
                  alt={`Product image ${
                    index + 1
                  }`}
                  draggable={false}
                  loading={
                    index === 0
                      ? "eager"
                      : "lazy"
                  }
                  decoding="async"
                  className="
                    block
                    h-auto
                    w-full
                    select-none
                    object-contain
                  "
                />
              </button>
            )
          }
        )}
      </div>

      {lightboxOpen && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            bg-white
          "
          role="dialog"
          aria-modal="true"
          aria-label="Product image gallery"
        >
          {/* Desktop full-screen gallery */}
          <div className="hidden h-full lg:flex">
            {/* Thumbnails */}
            <aside
              className="
                w-[88px]
                shrink-0
                overflow-x-hidden
                overflow-y-auto
                bg-white
                px-3
                py-5
                [&::-webkit-scrollbar]:hidden
              "
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="flex flex-col gap-2">
                {visibleImages.map(
                  (
                    image,
                    index
                  ) => {
                    if (
                      !image.url
                    ) {
                      return null
                    }

                    return (
                      <button
                        type="button"
                        key={`thumb-${
                          image.id ??
                          image.url ??
                          index
                        }`}
                        ref={(element) => {
                          thumbnailRefs.current[
                            index
                          ] = element
                        }}
                        onClick={() =>
                          scrollDesktopToImage(
                            index
                          )
                        }
                        className={[
                          "overflow-hidden border p-0 transition",
                          activeLightboxIndex === index
                            ? "border-black bg-[#eeeeec]"
                            : "border-black/10 bg-[#f7f7f5] hover:border-black/40",
                        ].join(" ")}
                        aria-label={`View image ${
                          index + 1
                        }`}
                      >
                        <img
                          src={
                            image.url
                          }
                          alt=""
                          draggable={
                            false
                          }
                          className="
                            block
                            aspect-[4/5]
                            w-full
                            object-contain
                          "
                        />
                      </button>
                    )
                  }
                )}
              </div>
            </aside>

            {/* Main vertical image scroller */}
            <main
  className="
    flex-1
    overflow-x-hidden
    overflow-y-auto
    overscroll-contain
    scroll-smooth
    bg-transparent
    [&::-webkit-scrollbar]:hidden
  "
  style={{
    overflowAnchor: "none",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  }}
>
              {visibleImages.map(
                (
                  image,
                  index
                ) => {
                  if (
                    !image.url
                  ) {
                    return null
                  }

                  return (
                    <div
                      key={`large-${
                        image.id ??
                        image.url ??
                        index
                      }`}
                      ref={(
                        element
                      ) => {
                        desktopLightboxRefs.current[
                          index
                        ] =
                          element
                      }}
                      className="
                        w-full
                        overflow-hidden
                        bg-transparent
                      "
                    >
                      <img
                        src={
                          image.url
                        }
                        alt={`Product image ${
                          index + 1
                        }`}
                        draggable={
                          false
                        }
                        className="
                          block
                          h-auto
                          w-full
                          select-none
                          object-contain
                        "
                      />
                    </div>
                  )
                }
              )}
            </main>

            {/* Close column */}
            <div
              className="
                w-[90px]
                shrink-0
                border-l
                border-black/10
                bg-white
              "
            >
              <button
                type="button"
                onClick={
                  closeLightbox
                }
                className="
                  sticky
                  top-0
                  w-full
                  px-4
                  py-7
                  text-center
                  text-[12px]
                  text-black
                  hover:underline
                "
              >
                Close
              </button>
            </div>
          </div>

          {/* =================================================
              MOBILE FULL-SCREEN GALLERY
              No bottom carousel/scrollbar.
              Transparent arrows + swipe/drag.
          ================================================== */}
          <div
            className="
              relative
              h-full
              bg-[#f7f7f5]
              lg:hidden
            "
          >
            <button
              type="button"
              onClick={
                closeLightbox
              }
              className="
                absolute
                right-4
                top-4
                z-30
                flex
                h-10
                w-10
                items-center
                justify-center
                bg-transparent
                p-0
                text-[25px]
                font-light
                leading-none
                text-black
                transition-opacity
                hover:opacity-55
              "
              aria-label="Close gallery"
            >
              ×
            </button>

            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                overflow-hidden
                px-4
                py-14
              "
              onPointerDown={(event) =>
                startMobileSwipe(
                  event,
                  "lightbox"
                )
              }
              onPointerMove={
                moveMobileSwipe
              }
              onPointerUp={
                finishMobileSwipe
              }
              onPointerCancel={
                cancelMobileSwipe
              }
              style={{
                touchAction: "pan-y",
              }}
            >
              {mobileLightboxImage?.url && (
                <img
                  key={
                    mobileLightboxImage.id ??
                    mobileLightboxImage.url ??
                    safeActiveLightboxIndex
                  }
                  src={
                    mobileLightboxImage.url
                  }
                  alt={`Product image ${
                    safeActiveLightboxIndex +
                    1
                  }`}
                  draggable={false}
                  className="
                    block
                    max-h-full
                    max-w-full
                    select-none
                    object-contain
                  "
                />
              )}
            </div>

            {hasMultipleVisibleImages && (
              <>
                <button
                  type="button"
                  onClick={
                    showPreviousMobileLightboxImage
                  }
                  aria-label="Previous image"
                  className="
                    absolute
                    left-2
                    top-1/2
                    z-30
                    flex
                    -translate-y-1/2
                    items-center
                    justify-center
                    bg-transparent
                    p-3
                    text-black
                    transition-opacity
                    hover:opacity-55
                  "
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M15 4.5 7.5 12 15 19.5"
                      stroke="currentColor"
                      strokeWidth="1.15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={
                    showNextMobileLightboxImage
                  }
                  aria-label="Next image"
                  className="
                    absolute
                    right-2
                    top-1/2
                    z-30
                    flex
                    -translate-y-1/2
                    items-center
                    justify-center
                    bg-transparent
                    p-3
                    text-black
                    transition-opacity
                    hover:opacity-55
                  "
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m9 4.5 7.5 7.5L9 19.5"
                      stroke="currentColor"
                      strokeWidth="1.15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageGallery