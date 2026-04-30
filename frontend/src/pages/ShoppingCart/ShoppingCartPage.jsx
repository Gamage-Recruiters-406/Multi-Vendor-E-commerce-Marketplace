import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ShoppingCart/Header';
import CartSection from '../../components/ShoppingCart/CartSection';
import OrderSummary from '../../components/ShoppingCart/OrderSummary';
import Footer from '../../components/ShoppingCart/Footer';
import { getCart } from '../../services/cartService';

export default function ShoppingCartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartByStore, setCartByStore] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch cart data from backend
  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cart = await getCart();
      
      if (!cart || !cart.items || cart.items.length === 0) {
        setCartItems([]);
        setCartByStore([]);
        return;
      }

      // Group items by store
      const groupedByStore = {};
      
      cart.items.forEach((item) => {
        const product = item.product_id;
        const storeName = product?.store?.name || 'Unknown Store';
        
        if (!groupedByStore[storeName]) {
          groupedByStore[storeName] = [];
        }

        const imageUrl = Array.isArray(product?.images) && product.images.length > 0 
          ? product.images[0] 
          : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop';

        groupedByStore[storeName].push({
          product_id: product._id,
          image: imageUrl,
          title: product?.name || 'Unknown Product',
          store: storeName,
          color: 'N/A',
          size: 'One Size',
          stockStatus: product?.stock > 0 ? (product?.stock > 5 ? 'in_stock' : 'low_stock') : 'out_of_stock',
          price: item.price || product?.price || 0,
          quantity: item.quantity,
        });
      });

      setCartItems(cart.items);
      setCartByStore(
        Object.entries(groupedByStore).map(([storeName, items]) => ({
          storeName,
          items,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError(err.message || 'Failed to load cart');
      
      // If unauthorized, redirect to login
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart on component mount
  useEffect(() => {
    fetchCartData();
  }, []);

  const handleQuantityChange = (product_id, newQuantity) => {
    // Update state to reflect quantity change
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product_id._id === product_id ? { ...item, quantity: newQuantity } : item
      )
    );

    // Update grouped store items
    setCartByStore(prevStores =>
      prevStores.map(store => ({
        ...store,
        items: store.items.map(item =>
          item.product_id === product_id ? { ...item, quantity: newQuantity } : item
        ),
      }))
    );
  };

  const handleRemoveItem = (product_id) => {
    // Remove item from cart
    setCartItems(prevItems =>
      prevItems.filter(item => item.product_id._id !== product_id)
    );

    // Update grouped store items
    setCartByStore(prevStores =>
      prevStores
        .map(store => ({
          ...store,
          items: store.items.filter(item => item.product_id !== product_id),
        }))
        .filter(store => store.items.length > 0)
    );
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const totalPrice = calculateTotalPrice();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] text-gray-900 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-gray-500">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">Your Shopping Cart</h1>
          <p className="mt-1 text-sm text-gray-500">
            {cartByStore.length > 0
              ? `${itemCount} item${itemCount !== 1 ? 's' : ''} from ${cartByStore.length} store${cartByStore.length !== 1 ? 's' : ''}`
              : 'Your cart is empty'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {cartByStore.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-4">Your shopping cart is empty</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section>
              {cartByStore.map((store) => (
                <CartSection
                  key={store.storeName}
                  storeName={store.storeName}
                  items={store.items}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </section>

            <aside>
              <OrderSummary cartTotal={totalPrice} itemCount={itemCount} />
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
