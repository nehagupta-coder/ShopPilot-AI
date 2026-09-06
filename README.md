# 🚀 ShopPilot AI

## AI Growth & Agentic Commerce

ShopPilot AI is an AI-powered commerce platform built for the Razorpay AI Builder Internship 2026.

The platform uses AI agents to help users discover products, compare products, get personalized recommendations, manage their cart, and optimize purchases.

It also provides AI-powered growth insights to help merchants improve conversion, revenue, average order value, and customer engagement.

---

## 🎯 Problem Statement

Traditional e-commerce requires users to manually search for products, apply filters, compare multiple products, read reviews, and decide what to buy.

This becomes difficult when users have specific requirements.

For example:

> Find me the best laptop for coding under ₹70,000 with at least 16GB RAM and good battery life.

Instead of making the user perform multiple searches, ShopPilot AI allows the user to simply describe what they need.

The AI agent understands the requirement, searches products, compares available options, recommends the best product, and can perform authorized actions such as adding the product to the cart.

---

## 💡 Solution

ShopPilot AI provides an Agentic Commerce experience where AI can understand user goals and interact with commerce functionality through tools.

### AI Shopping Flow

```text
User
  ↓
AI Agent
  ↓
Understand Requirements
  ↓
Search Products
  ↓
Compare Products
  ↓
AI Recommendation
  ↓
User Confirmation
  ↓
Authorized Action
  ↓
Cart / Commerce Result
```

---

## ✨ Features

### 🤖 AI Shopping Agent

Users can communicate with the shopping platform using natural language.

Example:

```text
Find me the best laptop under ₹70,000 for coding.
```

The AI can understand:

- Budget
- Category
- Use case
- Product specifications
- User preferences

### 🔎 Natural Language Product Search

Users do not need to manually apply multiple filters.

Example:

```text
Gaming laptop with 16GB RAM under ₹80,000.
```

The AI can convert this request into structured requirements:

```text
Category: Laptop
Use Case: Gaming
RAM: 16GB+
Budget: ₹80,000
```

### 🎯 AI Product Recommendations

The AI recommends products based on:

- Budget
- Product specifications
- Ratings
- Reviews
- User preferences
- Product category
- Value for money

The AI also explains why a product was recommended.

### ⚖️ AI Product Comparison

Users can compare multiple products.

The AI can compare:

- Price
- Specifications
- Ratings
- Reviews
- Advantages
- Disadvantages
- Best use case
- Overall value

Example:

```text
Best for Coding       → Product A
Best for Gaming       → Product B
Best Battery Life     → Product C
Best Overall Value    → Product A
```

### 🛒 Smart Cart Management

The AI agent can help users manage their cart.

Example commands:

```text
Add this laptop to my cart.

Remove the headphones.

Increase the quantity to 2.

Show me my cart.

Optimize my cart for ₹50,000.
```

Possible tools:

```text
addToCart()
removeFromCart()
updateCart()
getCart()
calculateCartTotal()
```

### 💰 Budget Optimization

Users can provide a total shopping budget.

Example:

```text
Build me the best work-from-home setup under ₹80,000.
```

The AI can recommend:

- Laptop
- Monitor
- Keyboard
- Mouse
- Headphones
- Accessories

while keeping the total within the specified budget.

### 📈 AI Upselling

The AI can recommend relevant products that may improve the customer's shopping experience.

Example:

```text
Laptop
  ↓
Laptop Stand
Wireless Mouse
Laptop Bag
Keyboard
```

### 🔗 AI Cross-Selling

The system can recommend products that are useful together.

Example:

```text
Smartphone
  +
Phone Case
  +
Screen Protector
  +
Wireless Earbuds
```

### 📦 AI Bundle Recommendations

The AI can create product bundles based on user requirements.

Example:

```text
Gaming Setup

Gaming Laptop
+
Gaming Mouse
+
Gaming Keyboard
+
Gaming Headset
+
Mouse Pad
```

---

# 📊 AI Growth Advisor

ShopPilot AI also provides an AI-powered growth assistant for merchants.

Merchants can ask questions such as:

```text
Why is my conversion rate low?

Which products should I promote?

How can I increase average order value?

Which products should I bundle?

Which products have high views but low conversion?

What offer should I create?
```

The AI analyzes commerce data and provides actionable growth recommendations.

---

# 📈 Growth Analytics Dashboard

The merchant dashboard can display:

- Revenue
- Total Orders
- Conversion Rate
- Average Order Value
- Product Views
- Add-to-Cart Rate
- Checkout Rate
- Abandoned Carts
- Top Products
- Category Performance

---

# 🧠 AI Agent Tools

The AI agent can interact with application tools such as:

```text
searchProducts()
getProductDetails()
compareProducts()
getRecommendations()
findBestProductForBudget()

addToCart()
removeFromCart()
updateCart()
getCart()
calculateCartTotal()

getOrderStatus()

getUserPreferences()
saveUserPreference()

getProductReviews()

getSalesAnalytics()
getConversionAnalytics()
getTopProducts()
getAbandonedCartAnalytics()

analyzeSales()
identifyGrowthOpportunities()

recommendOffer()
recommendBundle()
```

The AI selects the appropriate tool based on the user's request.

---

# 🏗️ System Architecture

```text
                         USER
                           |
                           v
                  +----------------+
                  | React Frontend |
                  +-------+--------+
                          |
                          v
                  +----------------+
                  |  Express API   |
                  +-------+--------+
                          |
                          v
                  +----------------+
                  |    AI Agent    |
                  +-------+--------+
                          |
            +-------------+-------------+
            |             |             |
            v             v             v
      +-----------+ +-----------+ +-----------+
      | Products  | |   Cart    | | Analytics |
      |   Tools   | |   Tools   | |   Tools   |
      +-----+-----+ +-----+-----+ +-----+-----+
            |             |             |
            +-------------+-------------+
                          |
                          v
                  +----------------+
                  |    MongoDB     |
                  +----------------+
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React

## Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose

## AI

- Large Language Model
- AI Agents
- Tool Calling
- Agentic Workflow

## Deployment

- Vercel
- Render
- MongoDB Atlas

---

# 📁 Project Structure

```text
ShopPilot-AI/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── agents/
│   │   ├── tools/
│   │   └── middleware/
│   │
│   └── package.json
│
├── screenshots/
│
├── README.md
├── .env.example
├── .gitignore
└── package.json
```

---

# 📸 Screenshots

The following screenshots demonstrate the main features of ShopPilot AI.

## 🏠 Home Page

![ShopPilot AI Home Page](docs/screenshots/home.png)

## 🤖 AI Shopping Agent

![AI Shopping Agent](docs/screenshots/AI%20Shopping%20Agent.png)

## 🔎 Product Search

![Product Search](docs/screenshots/Product%20Search.png)

## 📦 Product Details

![Product Details](docs/screenshots/Product%20Details.png)

## ⚖️ Product Comparison

![Product Comparison](docs/screenshots/Product%20Comparison.png)

## 🛒 Smart Cart

![Smart Cart](docs/screenshots/Smart%20Cart.png)

## 📈 AI Growth Dashboard

![AI Growth Dashboard](docs/screenshots/AI%20Growth%20Dashboard.png)

---




---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ShopPilot-AI
```

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

## 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file inside the `server` directory.

```env
MONGO_URI=your_mongodb_connection_string
AI_PROVIDER=your_ai_provider
AI_API_KEY=your_ai_api_key
AI_MODEL=your_ai_model
PORT=5000
CLIENT_URL=http://localhost:5173
```

Never commit the `.env` file to GitHub.

---

# ▶️ Run the Project

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the application:

```text
http://localhost:5173
```

---

# 🧪 Demo Prompts

### Product Search

```text
Find me the best laptop under ₹70,000 for coding.
```

### Product Comparison

```text
Compare the top 3 smartphones under ₹30,000.
```

### Cart Action

```text
Add the best laptop to my cart.
```

### Budget Optimization

```text
Build me a work-from-home setup under ₹80,000.
```

### Growth Analysis

```text
Why is my conversion rate low?
```

### Bundle Recommendation

```text
Which products should I bundle together?
```

---

# 🎯 Razorpay AI Builder Internship Alignment

## Selected Track

**AI Growth & Agentic Commerce**

ShopPilot AI aligns with the selected track through two major areas.

### Agentic Commerce

- Natural-language shopping
- AI product discovery
- Product comparison
- Budget optimization
- Smart cart management
- AI tool calling
- Authorized commerce actions
- Personalized recommendations

### AI Growth

- AI product recommendations
- Upselling
- Cross-selling
- Bundle recommendations
- Conversion analysis
- Revenue insights
- Offer recommendations
- Customer personalization
- Growth opportunity detection

---

# 🔄 Traditional Commerce vs Agentic Commerce

## Traditional Commerce

```text
Search
  ↓
Filter
  ↓
Compare
  ↓
Decide
  ↓
Add to Cart
  ↓
Checkout
```

## Agentic Commerce

```text
Tell AI what you need
        ↓
AI understands your goal
        ↓
AI searches products
        ↓
AI compares options
        ↓
AI recommends the best option
        ↓
AI performs authorized actions
        ↓
User completes checkout
```

---

# 🔒 Security

ShopPilot AI follows basic security practices:

- API keys stored in environment variables
- AI API calls handled on the backend
- Input validation
- Error handling
- Protected routes
- Confirmation for destructive actions
- No secrets committed to GitHub

---

# 🔮 Future Improvements

- Real payment gateway integration
- Voice shopping agent
- WhatsApp shopping assistant
- Multi-agent architecture
- Real-time inventory
- Vector product search
- Advanced recommendation models
- Customer lifetime value prediction
- Automated marketing campaigns
- AI-generated product descriptions
- Automated A/B testing
- Multi-language shopping assistant

---

# 📌 Project Status

**Status: In Development**

- [x] Project Architecture
- [x] Track Selection
- [ ] Frontend
- [ ] Backend
- [ ] MongoDB
- [ ] AI Agent
- [ ] Agent Tools
- [ ] Product Search
- [ ] Product Recommendations
- [ ] Product Comparison
- [ ] Smart Cart
- [ ] Growth Dashboard
- [ ] AI Growth Advisor
- [ ] Testing
- [ ] Deployment
- [ ] Demo Video

---

# ⭐ Vision

ShopPilot AI aims to make commerce more intelligent by allowing customers and businesses to communicate with an AI agent instead of navigating complex shopping workflows manually.

> **Tell the AI what you want. Let the agent find it, compare it, and help you act on it.**

---

# 👨‍💻 Project Information

**Project:** ShopPilot AI

**Track:** AI Growth & Agentic Commerce

**Event:** Razorpay AI Builder Internship 2026

**Focus:** AI Agents + Commerce + Personalization + Growth Intelligence
----
## 👩‍💻 Author

**Neha Gupta**

📧 Email: [ng8846558@gmail.com](mailto:ng8846558@gmail.com)

🔗 LinkedIn: [Neha Gupta](https://www.linkedin.com/in/neha-gupta-1892312b8)
