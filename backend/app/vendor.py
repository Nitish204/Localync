from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .database import get_db
from .auth import get_current_user, require_role
from .products import to_product_out

router = APIRouter(prefix="/api/vendor", tags=["vendor"])


def _vendor_of(current_user: models.User, db: Session) -> models.Vendor:
    if not current_user.vendor_id:
        raise HTTPException(status_code=400, detail="This account has no vendor profile.")
    vendor = db.query(models.Vendor).filter(models.Vendor.id == current_user.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
    return vendor


@router.get("/dashboard", response_model=schemas.VendorStats)
def dashboard(
    current_user: models.User = Depends(require_role("vendor", "admin")),
    db: Session = Depends(get_db),
):
    vendor = _vendor_of(current_user, db)
    since = datetime.utcnow() - timedelta(days=1)

    today_orders = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.vendor_id == vendor.id)
        .join(models.Order)
        .filter(models.Order.created_at >= since)
        .count()
    )
    revenue = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.vendor_id == vendor.id)
        .all()
    )
    total_revenue = sum(i.price_at_purchase * i.quantity for i in revenue)
    product_count = db.query(models.Product).filter(models.Product.vendor_id == vendor.id).count()

    return schemas.VendorStats(
        today_orders=today_orders,
        revenue=round(total_revenue, 2),
        products=product_count,
        nearby_customers=max(12, product_count * 3),  # illustrative until real geo-tracking exists
    )


@router.get("/products", response_model=List[schemas.ProductOut])
def my_products(
    current_user: models.User = Depends(require_role("vendor", "admin")),
    db: Session = Depends(get_db),
):
    vendor = _vendor_of(current_user, db)
    products = (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.vendor),
                  joinedload(models.Product.price_points))
        .filter(models.Product.vendor_id == vendor.id)
        .all()
    )
    return [to_product_out(p) for p in products]


@router.post("/products", response_model=schemas.ProductOut, status_code=201)
def add_product(
    payload: schemas.ProductCreate,
    current_user: models.User = Depends(require_role("vendor", "admin")),
    db: Session = Depends(get_db),
):
    vendor = _vendor_of(current_user, db)
    category = db.query(models.Category).filter(models.Category.slug == payload.category_slug).first()
    if not category:
        raise HTTPException(status_code=400, detail="Unknown category slug.")

    product = models.Product(
        name=payload.name, brand=payload.brand, category_id=category.id, vendor_id=vendor.id,
        price=payload.price, stock=payload.stock, summary=payload.summary or "",
        score_performance=payload.score_performance, score_value=payload.score_value,
        score_upgradeability=payload.score_upgradeability, score_repairability=payload.score_repairability,
        score_longevity=payload.score_longevity, image_seed=payload.name.lower().replace(" ", "-"),
    )
    db.add(product)
    db.flush()
    db.add(models.PricePoint(product_id=product.id, price=payload.price))
    db.commit()
    db.refresh(product)
    return to_product_out(product)


@router.patch("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    current_user: models.User = Depends(require_role("vendor", "admin")),
    db: Session = Depends(get_db),
):
    vendor = _vendor_of(current_user, db)
    product = (
        db.query(models.Product)
        .filter(models.Product.id == product_id, models.Product.vendor_id == vendor.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found for this vendor.")

    if payload.price is not None and payload.price != product.price:
        product.price = payload.price
        db.add(models.PricePoint(product_id=product.id, price=payload.price))
    if payload.stock is not None:
        product.stock = payload.stock
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.commit()
    db.refresh(product)
    return to_product_out(product)


@router.get("/orders", response_model=List[schemas.VendorOrderLine])
def vendor_orders(
    current_user: models.User = Depends(require_role("vendor", "admin")),
    db: Session = Depends(get_db),
):
    vendor = _vendor_of(current_user, db)
    lines = (
        db.query(models.OrderItem)
        .options(joinedload(models.OrderItem.product), joinedload(models.OrderItem.order))
        .filter(models.OrderItem.vendor_id == vendor.id)
        .order_by(models.OrderItem.id.desc())
        .all()
    )
    return [
        schemas.VendorOrderLine(
            order_id=l.order_id, product_name=l.product.name, quantity=l.quantity,
            price_at_purchase=l.price_at_purchase, status=l.order.status.value,
            created_at=l.order.created_at,
        )
        for l in lines
    ]
