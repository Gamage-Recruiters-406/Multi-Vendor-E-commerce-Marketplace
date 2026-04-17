const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id, quantity } = req.body;

    const product = await Product.findById(product_id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user_id });

    // If cart not exist → create new
    if (!cart) {
      cart = new Cart({
        user_id,
        items: [],
      });
    }

    // Check product already in cart
    const existingItem = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        product_id,
        quantity: quantity || 1,
        price: product.price,
      });
    }

    // Calculate total
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    res.json({
      message: "Added to cart",
      cart,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user.id })
      .populate("items.product_id");

    if (!cart) {
      return res.json({ items: [], totalPrice: 0 });
    }

    res.json(cart);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id } = req.params;

    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== product_id
    );

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    res.json({
      message: "Item removed",
      cart,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user_id: req.user.id });

    res.json({
      message: "Cart cleared",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};