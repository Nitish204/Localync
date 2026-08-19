from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, field_validator


# ---------- Auth ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "customer"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number.")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter.")
        return v

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: str) -> str:
        allowed = {"customer", "vendor", "technician"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    vendor_id: Optional[int] = None
    technician_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Products ----------

class PricePointOut(BaseModel):
    price: float
    recorded_at: datetime

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    category_group: Optional[str] = None
    unit: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_distance_km: Optional[float] = None
    price: float
    stock: int
    image_seed: str
    is_active: bool = True

    score_performance: int
    score_value: int
    score_upgradeability: int
    score_repairability: int
    score_longevity: int
    summary: str

    socket: Optional[str] = None
    ram_type: Optional[str] = None
    ram_capacity_gb: Optional[int] = None
    storage_capacity_gb: Optional[int] = None
    form_factor: Optional[str] = None
    wattage_draw: Optional[int] = None
    wattage_supply: Optional[int] = None
    length_mm: Optional[int] = None
    max_gpu_length_mm: Optional[int] = None

    price_history: List[PricePointOut] = []

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category_slug: str
    price: float
    stock: int = 10
    summary: Optional[str] = ""
    score_performance: int = 75
    score_value: int = 75
    score_upgradeability: int = 75
    score_repairability: int = 75
    score_longevity: int = 75


class ProductUpdate(BaseModel):
    price: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


# ---------- PC Builder ----------

class CompatibilityRequest(BaseModel):
    product_ids: List[int]


class CompatibilityCheck(BaseModel):
    label: str
    status: str  # "ok" | "warning" | "error"
    detail: str


class CompatibilityResult(BaseModel):
    score: int
    checks: List[CompatibilityCheck]
    estimated_wattage: int


# ---------- Cart / Checkout ----------

class CartItemIn(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemOut(BaseModel):
    id: int
    product: ProductOut
    quantity: int
    line_total: float

    class Config:
        from_attributes = True


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    vendor_id: Optional[int] = None
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    total: float
    status: str
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


# ---------- Vendor ----------

class VendorStats(BaseModel):
    today_orders: int
    revenue: float
    products: int
    nearby_customers: int


class VendorOrderLine(BaseModel):
    order_id: int
    product_name: str
    quantity: int
    price_at_purchase: float
    status: str
    created_at: datetime


# ---------- Technician ----------

class TechnicianOut(BaseModel):
    id: int
    name: str
    specialty: str
    locality: Optional[str] = None
    distance_km: float
    rating: float
    available: bool

    class Config:
        from_attributes = True


class ServiceRequestCreate(BaseModel):
    product_name: str
    issue: str
    technician_id: Optional[int] = None


class ServiceRequestOut(BaseModel):
    id: int
    product_name: Optional[str] = None
    issue: str
    status: str
    technician_id: Optional[int] = None
    customer_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceRequestStatusUpdate(BaseModel):
    status: str


# ---------- Repair / Upgrade ----------

class UpgradeSuggestion(BaseModel):
    product_id: int
    name: str
    price: float
    stars: int
    reason: str


# ---------- Admin ----------

class AdminStats(BaseModel):
    total_users: int
    total_vendors: int
    total_products: int
    total_orders: int
    revenue: float


class AdminUserOut(UserOut):
    is_active: bool


# ---------- Advisor ----------

class AdvisorRequest(BaseModel):
    budget: float
    use_case: str = "gaming"  # gaming | productivity | budget


class AdvisorComponent(BaseModel):
    category: str
    product: ProductOut


class AdvisorResponse(BaseModel):
    components: List[AdvisorComponent]
    estimated_total: float
    compatibility: CompatibilityResult
    message: str
