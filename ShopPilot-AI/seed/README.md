# Seed data

Catalog, reviews, demo users, orders, and analytics events live in `server/src/seed/`.

From the repository root:

```bash
npm run seed
```

This writes into MongoDB when `MONGO_URI` is a real connection string, or into `server/data/store.json` when `MONGO_URI=memory`.
