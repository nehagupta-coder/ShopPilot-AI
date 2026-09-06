import mongoose, { Schema } from "mongoose";

const preferenceSchema = new Schema(
  {
    budget: Number,
    categories: { type: [String], default: [] },
    brands: { type: [String], default: [] },
    priorities: { type: [String], default: [] },
    notes: String,
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    _appId: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "merchant"], default: "customer" },
    preferences: { type: preferenceSchema, default: () => ({}) },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const specSchema = new Schema(
  { key: String, value: String },
  { _id: false },
);

const productSchema = new Schema(
  {
    _appId: { type: String, index: true, unique: true },
    name: String,
    slug: { type: String, unique: true },
    description: String,
    category: String,
    brand: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    rating: Number,
    reviewCount: Number,
    stock: Number,
    specifications: [specSchema],
    tags: [String],
    images: [String],
    relatedProducts: [String],
    weightGrams: Number,
    batteryLifeHours: Number,
    popularity: Number,
    createdAt: String,
  },
  { versionKey: false },
);

const reviewSchema = new Schema(
  {
    _appId: { type: String, index: true },
    productId: String,
    author: String,
    rating: Number,
    title: String,
    body: String,
    createdAt: String,
  },
  { versionKey: false },
);

const cartSchema = new Schema(
  {
    _appId: { type: String, index: true },
    userId: { type: String, unique: true },
    items: [{ productId: String, quantity: Number, _id: false }],
    updatedAt: String,
  },
  { versionKey: false },
);

const orderSchema = new Schema(
  {
    _appId: { type: String, index: true },
    userId: String,
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        _id: false,
      },
    ],
    subtotal: Number,
    discount: Number,
    total: Number,
    status: String,
    createdAt: String,
    estimatedDelivery: String,
    timeline: [
      { status: String, at: String, note: String, _id: false },
    ],
  },
  { versionKey: false },
);

const conversationSchema = new Schema(
  {
    _appId: { type: String, index: true },
    userId: String,
    title: String,
    mode: { type: String, enum: ["shopping", "growth"], default: "shopping" },
    messages: { type: [Schema.Types.Mixed], default: [] },
    createdAt: String,
    updatedAt: String,
  },
  { versionKey: false },
);

const eventSchema = new Schema(
  {
    _appId: { type: String, index: true },
    userId: String,
    eventType: String,
    productId: String,
    metadata: Schema.Types.Mixed,
    createdAt: String,
  },
  { versionKey: false },
);

export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);
export const ProductModel = mongoose.models.Product ?? mongoose.model("Product", productSchema);
export const ReviewModel = mongoose.models.Review ?? mongoose.model("Review", reviewSchema);
export const CartModel = mongoose.models.Cart ?? mongoose.model("Cart", cartSchema);
export const OrderModel = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
export const ConversationModel =
  mongoose.models.Conversation ?? mongoose.model("Conversation", conversationSchema);
export const AnalyticsEventModel =
  mongoose.models.AnalyticsEvent ?? mongoose.model("AnalyticsEvent", eventSchema);
