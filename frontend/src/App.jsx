import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProductCreate from "./pages/product _create/ProductCreate";
import ProductUpdate from "./pages/Product_update/ProductUpdate";
import { Toaster } from "react-hot-toast";
import SigninPage from "./pages/login/SigninPage";
import SignupPage from "./pages/login/SignupPage";
import VendorProductManagemnt from "./pages/Vendor/ProductManagement";
import Products from "./pages/Vendor/Products";
import CreateStore from "./pages/Vendor/CreateStore";
import ViewStore from "./pages/Vendor/ViewStore";
import Announcements from "./pages/Announcements";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import EditAnnouncement from "./pages/EditAnnouncement";
import { AdminDashboard } from "./pages/AdminDashboard/AdminDashboard";
import VendorProfile from "./pages/Profiles/vendorProfile";
import Home from "./pages/Home";
import CheckoutPage from "./pages/CheckoutPage";
import UserProfileAndAddressBook from "./pages/Profiles/userProfile&AddressBook";
import "./App.css";
import StoresPage from "./pages/Vendor/Stores";
import EditStore from "./pages/Vendor/EditStore";
import SalesAnalytics from "./pages/Vendor/SalesAnalytics";
import VendorDashboard from "./pages/VendorDashboard";
import BuyerProductDetailsPage from "./pages/Buyer/BuyerProductDetailsPage";
import ShoppingCartPage from "./pages/ShoppingCart/ShoppingCartPage";
import { MyOrders } from "./pages/MyOrders/MyOrders.jsx";
import UserManagement from './pages/admin/UserManagement'
import VendorOrderManagementPage from "./pages/Vendor/OrderManagement";
import Q_AND_A_PAGE from "./pages/Buyer/Q&APage";


function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Home Page */}
          <Route path="/" element={<Home />} />
          {/* Authentication Routes */}
          <Route path="/login" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Layout 
          <Route path="/" element={<Footer />} />*/}
          <Route path="/register" element={<SignupPage />} />
          {/* Vendor Module */}
          <Route
            path="/vendor/product_management"
            element={<VendorProductManagemnt />}
          />
          <Route path="/vendor/products" element={<Products />} />
          <Route path="/vendor/product_create" element={<ProductCreate />} />
          <Route
            path="/vendor/product_update/:id"
            element={<ProductUpdate />}
          />
          <Route path="/vendor/create-store" element={<CreateStore />} />
          <Route path="/vendor/store/:id" element={<ViewStore />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />
          <Route path="/vendor/stores" element={<StoresPage />} />
          <Route path="/vendor/edit-store/:id" element={<EditStore />} />
          <Route path="/vendor/sales-analytics" element={<SalesAnalytics />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/orders" element={<VendorOrderManagementPage />} />
          {/* Admin Module */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route
            path="/admin/announcements/create"
            element={<CreateAnnouncement />}
          />
          <Route
            path="/admin/announcements/edit/:id"
            element={<EditAnnouncement />}
          />
           <Route path="/admin/users" element={<UserManagement />} />
          {/* Buyer */}
          <Route
            path="/buyer/productdetails/:id"
            element={<BuyerProductDetailsPage />}
          />
          <Route
            path="/buyer/product/:productId/qa"
            element={<Q_AND_A_PAGE />}
          />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/cart" element={<ShoppingCartPage />} />
          {/* Checkout */}
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/addressbook" element={<UserProfileAndAddressBook />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
