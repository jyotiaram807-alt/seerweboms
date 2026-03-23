import { useState } from 'react';
import { Plus, Minus, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/imageUrl';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [quantity, setQuantity]     = useState(0);
  const [imgError, setImgError]     = useState(false);
  const { addToCart, cart, updateQuantity } = useCart();

  const cartProduct  = cart.items.find((i) => i.productId === product.id);
  const cartVariant  = cartProduct?.variants.find((v) => v.variantId === 0) ?? null;
  const isOutOfStock = product.stock === 0;

  const handleIncrement = () => setQuantity((prev) => Math.min(prev + 1, product.stock));
  const handleDecrement = () => setQuantity((prev) => Math.max(prev - 1, 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) setQuantity(Math.min(Math.max(value, 0), product.stock));
    else setQuantity(0);
  };

  const handleAddToCart = () => {
    if (quantity > 0) { addToCart(product, quantity); setQuantity(0); }
  };

  const handleCartQtyChange = (change: number) => {
    if (!cartVariant) return;
    const newQty = cartVariant.quantity + change;
    if (newQty >= 1) updateQuantity(product.id, newQty);
  };

  // Use shared utility — handles BASE_URL + /public/ prefix automatically
  const imageUrl = getImageUrl(product.image);
  const showImage = imageUrl && !imgError;

  return (
    <Card className={`bg-white border overflow-hidden transition-all duration-200 flex flex-col ${
      isOutOfStock ? "opacity-60" : "hover:shadow-md hover:border-blue-200"
    }`}>

      {/* Image — shows placeholder on error instead of broken icon */}
      <div className="w-full h-36 bg-gray-50 border-b overflow-hidden flex-shrink-0 flex items-center justify-center">
        {showImage ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <ImageOff size={28} />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">

        {/* Name + Price */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-blue-600 flex-shrink-0 whitespace-nowrap">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Brand · Model */}
        <p className="text-xs text-gray-400 mb-3">
          {product.brand}{product.model ? ` · ${product.model}` : ""}
        </p>

        {/* Stock + Controls */}
        <div className="flex items-center justify-between mt-auto gap-2">
          {isOutOfStock ? (
            <Badge variant="outline" className="text-red-500 border-red-200 text-xs">Out of Stock</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs text-gray-500 bg-gray-100">
              Stock: {product.stock}
            </Badge>
          )}

          {cartVariant ? (
            <div className="flex items-center border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
              <button onClick={() => handleCartQtyChange(-1)} className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-100 transition-colors">
                <Minus size={12} />
              </button>
              <span className="px-2 text-sm font-semibold text-blue-700 min-w-[24px] text-center">
                {cartVariant.quantity}
              </span>
              <button
                onClick={() => handleCartQtyChange(1)}
                disabled={cartVariant.quantity >= product.stock}
                className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-100 disabled:opacity-30 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={handleDecrement} disabled={quantity === 0} className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                  <Minus size={11} />
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={handleInputChange}
                  className="w-8 text-center text-xs font-medium text-gray-800 bg-white focus:outline-none"
                  min="0"
                  max={product.stock}
                />
                <button onClick={handleIncrement} disabled={quantity >= product.stock} className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                  <Plus size={11} />
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={quantity === 0 || isOutOfStock}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 px-3 text-xs"
              >
                <Plus size={11} /> Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
