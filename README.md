# Localync

An intelligent commerce platform: hyper-local shopping, technical product
intelligence, PC compatibility analysis, price tracking, repair/upgrade
discovery, and role-based dashboards — a real (runnable) full-stack app,
not a mockup.

## What's implemented

**Customer**
- Auth (bcrypt + JWT), Marketplace, Product detail (Intelligence + price
  chart + upgrade suggestions), PC Builder, Compare, Localync Advisor,
  Repair & Upgrade Center, Local (hyper-local grocery) marketplace,
  Cart → Checkout → Orders

**Vendor**
- Auto-created vendor profile on signup
- Dashboard: today's orders, revenue, product count, nearby customers
- Quick stock/price updates, add new products, view incoming orders

**Technician**
- Auto-created technician profile on signup
- Dashboard: incoming/claimed service requests, status workflow
  (pending → accepted → in progress → completed), availability toggle

**Admin**
- Platform-wide stats (users, vendors, products, orders, revenue)
- Manage users, vendors, and products (activate/deactivate/hide)
- View all orders

**Cart, checkout & orders**
- Real server-side cart, checkout decrements stock and creates a real
  `Order`, order history page. No payment gateway is wired in right now
  — checkout places the order directly. See "Payments" further down for
  the plan to add one back in.

**Localync Advisor**
- Not a chatbot wrapper — a transparent budget-allocation algorithm.
  Give it a budget and a use case (gaming / productivity / budget); it
  spends the budget across PC Builder slots by priority, picks the
  best-scoring product that fits in each slot, and runs the *same*
  compatibility engine used by the PC Builder against the result. See
  `backend/app/advisor.py` for the full logic and reasoning.

**Repair & Upgrade Center**
- Every product page shows real upgrade suggestions: other products in
  the same category ranked by how much of an improvement they represent
  (`backend/app/technician.py::upgrade_suggestions`), star-rated
- Book a technician (with a written request) or browse available
  technicians directly at `/repair`

**Hyper-local marketplace**
- Categories are tagged `tech` or `grocery` (`Category.group`); `/local`
  reuses the same Marketplace component filtered to grocery vendors, with
  a "Nearby" toggle, matching the tech marketplace UX

## Password & session security

- Passwords are **never stored in plaintext**. `backend/app/security.py`
  hashes every password with **bcrypt** (via `passlib`, cost factor 12)
  before it touches the database — `User.hashed_password` only ever holds
  a bcrypt hash like `$2b$12$...`.
- Login verifies with bcrypt's constant-time comparison and returns an
  identical error for "wrong password" and "no such user."
- Sessions are short-lived signed **JWTs** (24h expiry) sent as a Bearer
  token. Set `LOCALYNC_SECRET_KEY` as an environment variable in any real
  deployment.
- Every route that needs a role (vendor/technician/admin dashboards) is
  gated by a `require_role(...)` dependency in `auth.py` — there's no
  separate "trusted" code path.

## Running it locally

### Backend (FastAPI + SQLite)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

First run auto-creates `localync.db` and seeds it with tech + grocery
products, vendors, technicians, and a few demo orders (so vendor/admin
dashboards aren't empty on first look). Swap the DSN in
`app/database.py` for Postgres when ready — everything goes through
SQLAlchemy's ORM, so nothing else changes.

API docs: http://localhost:8000/docs

### Payments (not yet wired in)

Checkout currently places the order directly — no gateway, no payment
step, nothing to configure. This was deliberate: we evaluated Razorpay
(needs a personal/business PAN as part of account creation, as of a
Jan 2026 onboarding change) and Stripe (India accounts are invite-only
and require a registered business entity — not viable for this kind of
project at all), and decided to hold off rather than build against
either constraint.

When you're ready to add one back in, the seam is intentionally clean:
- `backend/app/cart.py`'s `create_order_from_cart(db, user)` is the one
  place that actually creates an `Order` from a cart. Add a new router
  (e.g. `payments.py`) that: totals the cart server-side (never trust a
  client-sent amount), opens an order with whichever gateway you pick,
  and only calls `create_order_from_cart` after that gateway confirms
  payment — don't call it from `/checkout` directly anymore once a real
  gateway exists.
- On the frontend, `pages/Cart.jsx`'s `checkout()` function is the
  single call site to swap out for whatever the new flow needs (opening
  a hosted checkout page, a card form, etc).
- `models.Order` has no payment-related columns right now — you'd add
  something like `payment_status` / a gateway reference id back in
  `models.py` and the matching field in `schemas.OrderOut`.

### Frontend (React + Vite + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the backend on 8000.
Both need to be running together.

### Trying the different roles

Register three separate accounts (any email/password) picking
**Customer**, **Vendor**, or **Technician** as the role on the register
screen — each gets its own dashboard immediately. There's no self-serve
admin signup (deliberately — admin isn't a role you should be able to
grant yourself); create one by hand:

```bash
cd backend
python -c "
from app.database import SessionLocal
from app import models, security
db = SessionLocal()
db.add(models.User(name='Admin', email='admin@localync.test',
    hashed_password=security.hash_password('adminpass123'), role=models.Role.admin))
db.commit()
"
```
Then log in with `admin@localync.test` / `adminpass123`.

## Project structure

```
backend/
  app/
    main.py            FastAPI app, CORS, router wiring, startup seed
    database.py         SQLAlchemy engine/session (SQLite by default)
    models.py            User, Vendor, Technician, Product, Category,
                          PricePoint, Build, CartItem, Order, OrderItem,
                          ServiceRequest
    schemas.py            Pydantic request/response models
    security.py            bcrypt hashing + JWT session tokens
    auth.py                 /api/auth/*, get_current_user, require_role
    products.py              /api/products, /api/categories, PC Builder check
    compatibility.py          Rule-based PC compatibility engine
    cart.py                    /api/cart/*, checkout → Order, shared
                                order-creation helper
    vendor.py                   /api/vendor/* dashboard + product mgmt
    technician.py                 /api/repair/*, /api/technician/*
    admin.py                       /api/admin/*
    advisor.py + advisor_routes.py  Budget-allocation build recommender
    seed.py                          Demo vendors/products/orders

frontend/
  src/
    pages/    Landing, Login, Register, Marketplace (tech + /local),
              ProductDetail, PCBuilder, Compare, Advisor, RepairCenter,
              Cart, Orders, VendorDashboard, TechnicianDashboard,
              AdminDashboard
    components/  Navbar (role-aware), ProductCard, IntelligencePanel,
                 PriceChart
    lib/          api.js (axios client, one export per domain),
                  authStore.js (zustand)
```

## Design system

- **Type**: Space Grotesk (display) + Inter (body) + JetBrains Mono
  (data/prices/spec readouts)
- **Color**: warm off-white paper, near-black ink, one indigo accent
  (`#3B36D6`), plus red/amber/green signal colors reused everywhere a
  compatibility or price verdict appears
- **Signature motif**: the corner-bracket "schematic" card
  (`.bracket-frame` in `index.css`) — hero product card, intelligence
  panel, PC Builder/Advisor compatibility readout, auth side panel

## Known gaps / what's still a simplification

- **No payment gateway** — checkout places the order directly. See the
  "Payments" section above for the plan and the exact seam to add one
  back in later.
- Vendor "nearby customers" figure is illustrative, not real geo-tracking
- No image uploads — products render as labeled category tiles by design
  (see the original brief's "product photography" note — swapping in real
  images is a frontend-only change, `ProductCard`/`ProductDetail`'s tile div)
- Admin can't edit product content, only toggle visibility — full CRUD
  would reuse the same pattern as `vendor.py`'s product routes
