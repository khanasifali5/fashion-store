import { clx } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="h-5 w-24 animate-pulse bg-gray-100" />
  }

  return (
    <div className="flex flex-col text-[#171513]">
      <span
        className={clx(
          "text-[14px] font-normal leading-none tracking-[-0.01em]",
          {
            "text-ui-fg-interactive": selectedPrice.price_type === "sale",
          }
        )}
      >
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>

      {selectedPrice.price_type === "sale" && (
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <span
            className="text-[#77716b] line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>

          <span className="text-ui-fg-interactive">
            -{selectedPrice.percentage_diff}%
          </span>
        </div>
      )}
    </div>
  )
}