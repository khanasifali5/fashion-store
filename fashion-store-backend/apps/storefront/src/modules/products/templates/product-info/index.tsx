import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col">
        {(product.collection || product.type?.value) && (
          <div className="mb-10 flex flex-wrap items-center gap-2 text-[11px] font-normal text-[#77716b]">
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="transition-colors hover:text-black"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}

            {product.collection && product.type?.value && <span>·</span>}

            {product.type?.value && <span>{product.type.value}</span>}
          </div>
        )}

        <h1
          className="text-[15px] font-normal leading-[1.35] tracking-[-0.01em] text-[#171513]"
          data-testid="product-title"
        >
          {product.title}
        </h1>
      </div>
    </div>
  )
}

export default ProductInfo