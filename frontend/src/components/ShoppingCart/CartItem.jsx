import { Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { removeFromCart, updateCartItemQuantity } from '../../services/cartService';

export default function CartItem({ 
  product_id, 
  image, 
  title, 
  store, 
  color = 'N/A', 
  size = 'One Size', 
  stockStatus = 'in_stock', 
  price, 
  quantity,
  onQuantityChange,
  onRemove
}) {
  const [isLoading, setIsLoading] = useState(false);
  const subtotal = (price * quantity).toFixed(2);

  const handleIncreaseQuantity = async () => {
    try {
      setIsLoading(true);
      const newQuantity = quantity + 1;
      await updateCartItemQuantity(product_id, newQuantity);
      if (onQuantityChange) {
        onQuantityChange(product_id, newQuantity);
      }
    } catch (error) {
      console.error('Error increasing quantity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecreaseQuantity = async () => {
    if (quantity <= 1) {
      handleRemove();
      return;
    }
    try {
      setIsLoading(true);
      const newQuantity = quantity - 1;
      await updateCartItemQuantity(product_id, newQuantity);
      if (onQuantityChange) {
        onQuantityChange(product_id, newQuantity);
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsLoading(true);
      await removeFromCart(product_id);
      if (onRemove) {
        onRemove(product_id);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-6 py-6 border-b border-gray-100 last:border-0 opacity-100 transition-opacity" style={isLoading ? { opacity: 0.5 } : {}}>
      {/* Image */}
      <div className="w-28 h-28 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
        <img src={image} alt={title} className="w-full h-full object-cover mix-blend-multiply p-2" />
      </div>
      
      {/* Details */}
      <div className="flex-1 flex justify-between">
        <div className="flex flex-col justify-start">
          <h4 className="font-bold text-gray-900 text-[15px]">{title}</h4>
          <div className="mt-1 mb-3">
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-[11px] font-medium rounded">{store}</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-500 mb-3">
            <p>Color: <span className="font-semibold text-gray-900">{color}</span></p>
            <p>Size: <span className="font-semibold text-gray-900">{size}</span></p>
          </div>
          <div>
            {stockStatus === 'in_stock' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 text-[11px] font-bold rounded">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Low Stock
              </span>
            )}
          </div>
        </div>
        {/* Pricing & Controls */}
        <div className="flex flex-col items-end justify-between min-w-[100px]">
          <div className="text-right">
            <p className="text-[11px] text-gray-400 mb-0.5 font-medium">Unit Price</p>
            <p className="font-bold text-gray-900">${price.toFixed(2)}</p>
          </div>
          
          <div className="flex items-center border border-gray-200 rounded-md my-2">
            <button 
              onClick={handleDecreaseQuantity}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-l-md transition-colors disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input 
              type="text" 
              value={quantity} 
              readOnly
              className="w-8 text-center text-sm font-semibold border-x border-gray-200 py-1 outline-none text-gray-700"
            />
            <button 
              onClick={handleIncreaseQuantity}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-r-md transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5 font-medium">Subtotal</p>
              <p className="font-bold text-gray-900">${subtotal}</p>
            </div>
            <button 
              onClick={handleRemove}
              disabled={isLoading}
              className="text-red-400 hover:text-red-600 transition-colors mt-1 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}