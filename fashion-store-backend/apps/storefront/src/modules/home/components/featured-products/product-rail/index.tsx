import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  return (
    <section className="bg-[#fffdf9] py-14 sm:py-20">
      <div className="content-container">
        {/* Section heading */}
        <div className="mb-8 flex items-end justify-between border-b border-[#e9e0d5] pb-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a57a42]">
              Discover Safafi
            </p>

            <h2
              className="text-3xl font-medium text-[#29231d] sm:text-4xl"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
              }}
            >
              {collection.title}
            </h2>
          </div>

          <InteractiveLink href={`/collections/${collection.handle}`}>
            View all
          </InteractiveLink>
        </div>

        {/* Product grid */}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {pricedProducts.slice(0, 4).map((product) => (
            <li
              key={product.id}
              className="group transition-transform duration-300 hover:-translate-y-1"
            >
              <ProductPreview
                product={product}
                region={region}
                isFeatured
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}