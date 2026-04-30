import Header from '../../components/ShoppingCart/Header';
import CartSection from '../../components/ShoppingCart/CartSection';
import OrderSummary from '../../components/ShoppingCart/OrderSummary';
import Footer from '../../components/ShoppingCart/Footer';

const cartByStore = [
  {
    storeName: 'Artisan Hub',
    items: [
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop',
        title: 'Smart Fitness Watch',
        store: 'Artisan Hub',
        color: 'Black',
        size: 'Standard',
        stockStatus: 'in_stock',
        unitPrice: 129.99,
        quantity: 1,
        subtotal: 129.99,
      },
      {
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop',
        title: 'Wireless Headphones',
        store: 'Artisan Hub',
        color: 'White',
        size: 'One Size',
        stockStatus: 'low_stock',
        unitPrice: 79.99,
        quantity: 2,
        subtotal: 159.98,
      },
    ],
  },
  {
    storeName: 'Nature Nest',
    items: [
      {
        image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&auto=format&fit=crop',
        title: 'Ceramic Flower Vase',
        store: 'Nature Nest',
        color: 'Terracotta',
        size: 'Medium',
        stockStatus: 'in_stock',
        unitPrice: 34.5,
        quantity: 1,
        subtotal: 34.5,
      },
    ],
  },
];

export default function ShoppingCartPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">Your Shopping Cart</h1>
          <p className="mt-1 text-sm text-gray-500">Review items from your favorite vendors and proceed securely.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            {cartByStore.map((store) => (
              <CartSection key={store.storeName} storeName={store.storeName} items={store.items} />
            ))}
          </section>

          <aside>
            <OrderSummary />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
