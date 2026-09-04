import { sdk } from "@lib/config"

import HeroSlider, {
  type HeroBanner,
} from "./hero-slider"

const getTimestamp = (
  value?: string | Date | null
) => {
  if (!value) {
    return null
  }

  const timestamp =
    new Date(value).getTime()

  return Number.isFinite(timestamp)
    ? timestamp
    : null
}

const isCurrentlyPublished = (
  banner: HeroBanner,
  now: number
) => {
  if (
    banner.is_active === false ||
    !banner.media_url
  ) {
    return false
  }

  const startsAt =
    getTimestamp(
      banner.starts_at
    )

  const endsAt =
    getTimestamp(
      banner.ends_at
    )

  if (
    startsAt !== null &&
    now < startsAt
  ) {
    return false
  }

  if (
    endsAt !== null &&
    now > endsAt
  ) {
    return false
  }

  return true
}

const getDesktopPreload = (
  banner: HeroBanner
) => {
  if (
    banner.media_type ===
    "image"
  ) {
    return banner.media_url
  }

  return (
    banner.poster_url ||
    null
  )
}

const getMobilePreload = (
  banner: HeroBanner
) => {
  /*
   * Dedicated mobile artwork.
   */
  if (
    banner.mobile_media_url
  ) {
    if (
      banner.mobile_media_type ===
      "image"
    ) {
      return banner.mobile_media_url
    }

    return (
      banner.mobile_poster_url ||
      banner.poster_url ||
      null
    )
  }

  /*
   * Mobile inherits desktop artwork.
   */
  return getDesktopPreload(
    banner
  )
}

/*
 * SERVER-FIRST HERO
 *
 * Medusa Hero data is resolved before HeroSlider reaches
 * the browser, so the page doesn't first render an empty
 * client-side Hero shell.
 */
const Hero = async () => {
  try {
    const response =
      await sdk.client.fetch<{
        hero_banners:
          HeroBanner[]
      }>(
        "/store/hero-banners",
        {
          method: "GET",

          /*
           * Hero publishing / Admin edits should be visible
           * immediately.
           */
          cache: "no-store",
        }
      )

    const now =
      Date.now()

    const slides =
      (
        response.hero_banners ||
        []
      )
        .filter(
          (banner) =>
            isCurrentlyPublished(
              banner,
              now
            )
        )
        .sort(
          (a, b) =>
            (a.position ?? 0) -
            (b.position ?? 0)
        )

    if (!slides.length) {
      return null
    }

    const first =
      slides[0]

    const desktopPreload =
      getDesktopPreload(
        first
      )

    const mobilePreload =
      getMobilePreload(
        first
      )

    const samePreload =
      Boolean(
        desktopPreload &&
        mobilePreload &&
        desktopPreload ===
          mobilePreload
      )

    return (
      <>
        {desktopPreload &&
          samePreload && (
            <link
              rel="preload"
              as="image"
              href={
                desktopPreload
              }
              fetchPriority="high"
            />
          )}

        {desktopPreload &&
          !samePreload && (
            <link
              rel="preload"
              as="image"
              href={
                desktopPreload
              }
              media="(min-width: 768px)"
              fetchPriority="high"
            />
          )}

        {mobilePreload &&
          !samePreload && (
            <link
              rel="preload"
              as="image"
              href={
                mobilePreload
              }
              media="(max-width: 767px)"
              fetchPriority="high"
            />
          )}

        <HeroSlider
          slides={slides}
        />
      </>
    )
  } catch (error) {
    console.error(
      "Failed to load Hero Banners on server:",
      error
    )

    /*
     * Never reserve a large empty Hero area if the backend
     * is temporarily unavailable.
     */
    return null
  }
}

export default Hero