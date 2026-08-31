import { sdk } from "@lib/config"

import HeroSlider, {
  type HeroBanner,
} from "./hero-slider"

/*
 * SERVER-FIRST HERO
 *
 * The old Hero rendered in the browser, then fetched:
 * /store/hero-banners
 *
 * That guaranteed a blank/loading hero on every page load.
 *
 * Now Medusa data is resolved on the server BEFORE HeroSlider
 * is sent to the browser.
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
           * Keep Admin changes immediately visible.
           * We remove the visual client-fetch lag without
           * introducing stale hero content.
           */
          cache: "no-store",
        }
      )

    const slides =
      (
        response.hero_banners ||
        []
      )
        .filter(
          (banner) =>
            banner.is_active !==
              false &&
            Boolean(
              banner.media_url
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

    return (
      <>
        {/*
         * Start downloading the first hero image as early
         * as possible. HeroSlider also marks it eager/high.
         */}
        {first.media_type ===
          "image" && (
          <link
            rel="preload"
            as="image"
            href={
              first.media_url
            }
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
     * Do not reserve a giant black empty area on failure.
     */
    return null
  }
}

export default Hero
