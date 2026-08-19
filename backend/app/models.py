import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text, Boolean
)
from sqlalchemy.orm import relationship

from .database import Base


class Role(str, enum.Enum):
    customer = "customer"
    vendor = "vendor"
    technician = "technician"
    admin = "admin"


class RequestStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class OrderStatus(str, enum.Enum):
    placed = "placed"
    confirmed = "confirmed"
    delivered = "delivered"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=False)

    # Never store plaintext or reversible-encrypted passwords.
    # This column holds a bcrypt hash (via passlib), e.g. "$2b$12$...".
    hashed_password = Column(String(200), nullable=False)

    role = Column(Enum(Role), default=Role.customer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # A vendor/technician-role user is linked to exactly one operational
    # profile, auto-created at registration (see auth.py). Kept as separate
    # tables (rather than columns on User) because Vendor/Technician also
    # need to exist independent of a login (e.g. vendors seeded for demo
    # product data).
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True)

    builds = relationship("Build", back_populates="user")
    vendor_profile = relationship("Vendor", foreign_keys=[vendor_id])
    technician_profile = relationship("Technician", foreign_keys=[technician_id])


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    locality = Column(String(160))
    distance_km = Column(Float, default=1.0)
    rating = Column(Float, default=4.5)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="vendor")


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    specialty = Column(String(160), default="General repair")
    locality = Column(String(160))
    distance_km = Column(Float, default=1.0)
    rating = Column(Float, default=4.5)
    available = Column(Boolean, default=True)

    requests = relationship("ServiceRequest", back_populates="technician")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)
    # cpu, gpu, motherboard, ram, storage, psu, case, grocery, etc.
    slug = Column(String(80), unique=True, nullable=False)
    # Broad grouping used to separate the PC-parts marketplace from the
    # hyper-local grocery/everyday-goods marketplace on the frontend.
    group = Column(String(20), default="tech")  # "tech" | "grocery"
    unit = Column(String(20), nullable=True)     # e.g. "kg" for grocery


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    brand = Column(String(120))
    category_id = Column(Integer, ForeignKey("categories.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))

    price = Column(Float, nullable=False)
    stock = Column(Integer, default=10)
    image_seed = Column(String(80), default="default")
    is_active = Column(Boolean, default=True)

    # Localync Intelligence scores (0-100)
    score_performance = Column(Integer, default=80)
    score_value = Column(Integer, default=80)
    score_upgradeability = Column(Integer, default=80)
    score_repairability = Column(Integer, default=80)
    score_longevity = Column(Integer, default=80)
    summary = Column(Text, default="")

    # Technical spec fields used by the compatibility engine.
    # Kept flat + nullable rather than a generic JSON blob so the
    # compatibility engine can query/index on them directly.
    socket = Column(String(40))              # CPU / motherboard socket, e.g. "AM5"
    ram_type = Column(String(20))             # "DDR4" / "DDR5"
    ram_capacity_gb = Column(Integer)
    storage_capacity_gb = Column(Integer)
    form_factor = Column(String(20))          # "ATX", "mATX", "ITX"
    wattage_draw = Column(Integer)            # for GPUs/CPUs: power draw
    wattage_supply = Column(Integer)          # for PSUs: rated output
    length_mm = Column(Integer)               # for GPUs / case clearance
    max_gpu_length_mm = Column(Integer)       # for cases

    category = relationship("Category")
    vendor = relationship("Vendor", back_populates="products")
    price_points = relationship("PricePoint", back_populates="product")


class PricePoint(Base):
    """A single historical price observation, used to draw the price chart
    and compute lowest/average/verdict."""
    __tablename__ = "price_points"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    price = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="price_points")


class Build(Base):
    """A saved PC Builder configuration for a user."""
    __tablename__ = "builds"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(120), default="My Build")
    component_ids_json = Column(Text)  # JSON list of product ids
    compatibility_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="builds")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)

    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.placed)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    quantity = Column(Integer, default=1)
    price_at_purchase = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    vendor = relationship("Vendor")


class ServiceRequest(Base):
    """A repair/upgrade request raised by a customer against a technician."""
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True)
    product_name = Column(String(200))
    issue = Column(Text, nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    technician = relationship("Technician", back_populates="requests")
    customer = relationship("User", foreign_keys=[customer_id])
