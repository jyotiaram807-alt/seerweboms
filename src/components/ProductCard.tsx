import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiUrl } from '@/url';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(0);
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  const handleIncrement = () => {
    setQuantity(prev => Math.min(prev + 1, product.stock));
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(prev - 1, 0));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    
    if (!isNaN(value)) {
      setQuantity(Math.min(Math.max(value, 0), product.stock));
    } else {
      setQuantity(0);
    }
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      addToCart(product, quantity);
      setQuantity(0);
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <Card className="bg-white shadow-md p-3 card-hover mb-2">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold">{product.name}</div>
            <div className="text-royal font-bold">{product.price.toFixed(2)}</div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{product.brand} {product.model}</span>
            {/* {product.stock > 0 ? (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                In Stock: {product.stock}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                Out of Stock
              </Badge>
            )} */}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <button 
                className="quantity-btn"
                onClick={handleDecrement}
                disabled={quantity === 0}
              >
                <Minus size={14} />
              </button>
              <input
                type="text"
                className="quantity-input w-12 text-sm"
                value={quantity}
                onChange={handleInputChange}
                min="0"
                max={product.stock}
              />
              <button 
                className="quantity-btn"
                onClick={handleIncrement}
                disabled={quantity >= product.stock}
              >
                <Plus size={14} />
              </button>
            </div>
            
            <Button 
              onClick={handleAddToCart}
              disabled={quantity === 0 || product.stock === 0}
              className="bg-royal hover:bg-royal-dark"
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Desktop layout
  return (
    <Card className="bg-white shadow-md p-4 card-hover">
      <div className="flex items-center justify-between">
        {product.image && (
          <img
            src={`${apiUrl.replace('/api', '')}/${product.image}`}
            alt={product.name}
            className="h-16 w-16 object-cover rounded mr-4 border"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{product.name}</span>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-600">{product.brand} {product.model}</span>
            <span className="text-gray-600">|</span>
            <span className="text-royal font-bold">{product.price.toFixed(2)}</span>
            {/*<span className="text-gray-600">|</span>
             {product.stock > 0 ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                In Stock: {product.stock}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                Out of Stock
              </Badge>
            )} */}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <button 
              className="quantity-btn"
              onClick={handleDecrement}
              disabled={quantity === 0}
            >
              <Minus size={16} />
            </button>
            <input
              type="text"
              className="quantity-input"
              value={quantity}
              onChange={handleInputChange}
              min="0"
              max={product.stock}
            />
            <button 
              className="quantity-btn"
              onClick={handleIncrement}
              disabled={quantity >= product.stock}
            >
              <Plus size={16} />
            </button>
          </div>
          
          <Button 
            onClick={handleAddToCart}
            disabled={quantity === 0 || product.stock === 0}
            className="bg-royal hover:bg-royal-dark"
            size="sm"
          >
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;