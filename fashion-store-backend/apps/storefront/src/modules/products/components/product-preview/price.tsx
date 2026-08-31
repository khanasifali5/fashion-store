import { Text, clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const matchingTypography = {
    fontFamily:
      '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "normal",
    color: "#000000",
  }

  return (
    <>
      {price.price_type === "sale" && (
        <Text
          className="line-through opacity-50"
          data-testid="original-price"
          style={matchingTypography}
        >
          {price.original_price}
        </Text>
      )}

      <Text
        className={clx({
          "text-black":
            price.price_type === "sale",
        })}
        data-testid="price"
        style={matchingTypography}
      >
        {price.calculated_price}
      </Text>
    </>
  )
}