import { HttpTypes } from "@medusajs/types"

import {
  CampaignBannerConfig,
  CategoryShowcaseConfig,
  CollectionCardsConfig,
  EditorialSplitConfig,
  FeaturedStoryConfig,
  ImageMosaicConfig,
  MarqueeConfig,
  VideoStoryConfig,
  EditorialTextConfig,
  SpacerConfig,
  ShopTheLookConfig,
  listHomepageSections,
  ProductShowcaseConfig,
} from "@lib/data/homepage-sections"

import CampaignBanner from "./campaign-banner"
import CategoryShowcase from "./category-showcase"
import CollectionCards from "./collection-cards"
import EditorialSplit from "./editorial-split"
import FeaturedStory from "./featured-story"
import ImageMosaic from "./image-mosaic"
import Marquee from "./marquee"
import VideoStory from "./video-story"
import EditorialText from "./editorial-text"
import Spacer from "./spacer"
import ShopTheLook from "./shop-the-look"
import ProductShowcase from "./product-showcase"

type HomepageSectionsProps = {
  region: HttpTypes.StoreRegion
}

export default async function HomepageSections({
  region,
}: HomepageSectionsProps) {
  const sections = await listHomepageSections()

  if (!sections?.length) {
    return null
  }

  const activeSections = sections
    .filter((section) => section.is_active !== false)
    .sort(
      (a, b) =>
        (a.position ?? 0) - (b.position ?? 0)
    )

  return (
    <>
      {activeSections.map((section) => {
        switch (section.type) {
          case "product_showcase":
            return (
              <ProductShowcase
                key={section.id}
                title={section.title}
                config={(section.config || {}) as ProductShowcaseConfig}
                region={region}
              />
            )

          case "collection_cards":
            return (
              <CollectionCards
                key={section.id}
                title={section.title}
                config={(section.config || {}) as CollectionCardsConfig}
              />
            )

          case "editorial_split":
            return (
              <EditorialSplit
                key={section.id}
                title={section.title}
                config={(section.config || {}) as EditorialSplitConfig}
              />
            )

          case "campaign_banner":
            return (
              <CampaignBanner
                key={section.id}
                title={section.title}
                config={(section.config || {}) as CampaignBannerConfig}
              />
            )

          case "image_mosaic":
            return (
              <ImageMosaic
                key={section.id}
                title={section.title}
                config={(section.config || {}) as ImageMosaicConfig}
              />
            )

          case "shop_the_look":
            return (
              <ShopTheLook
                key={section.id}
                title={section.title}
                config={(section.config || {}) as ShopTheLookConfig}
              />
            )

          case "spacer":
            return (
              <Spacer
                key={section.id}
                config={(section.config || {}) as SpacerConfig}
              />
            )

          case "editorial_text":
            return (
              <EditorialText
                key={section.id}
                title={section.title}
                config={(section.config || {}) as EditorialTextConfig}
              />
            )

          case "video_story":
            return (
              <VideoStory
                key={section.id}
                title={section.title}
                config={(section.config || {}) as VideoStoryConfig}
              />
            )

          case "marquee":
            return (
              <Marquee
                key={section.id}
                title={section.title}
                config={(section.config || {}) as MarqueeConfig}
              />
            )

          case "category_showcase":
            return (
              <CategoryShowcase
                key={section.id}
                title={section.title}
                config={(section.config || {}) as CategoryShowcaseConfig}
              />
            )

          case "featured_story":
            return (
              <FeaturedStory
                key={section.id}
                title={section.title}
                config={(section.config || {}) as FeaturedStoryConfig}
              />
            )

          default:
            return null
        }
      })}
    </>
  )
}