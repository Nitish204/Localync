from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .database import get_db
from .auth import require_role
from .products import to_product_out

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard", response_model=schemas.AdminStats)
def dashboard(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    orders = db.query(models.Order).all()
    return schemas.AdminStats(
        total_users=db.query(models.User).count(),
        total_vendors=db.query(models.Vendor).count(),
        total_products=db.query(models.Product).count(),
        total_orders=len(orders),
        revenue=round(sum(o.total for o in orders), 2),
    )


@router.get("/users", response_model=List[schemas.AdminUserOut])
def list_users(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    return db.query(models.User).all()


@router.patch("/users/{user_id}/toggle")
def toggle_user(
    user_id: int,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/vendors")
def list_vendors(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    vendors = db.query(models.Vendor).all()
    return [
        {"id": v.id, "name": v.name, "locality": v.locality, "rating": v.rating,
         "is_active": v.is_active, "product_count": len(v.products)}
        for v in vendors
    ]


@router.patch("/vendors/{vendor_id}/toggle")
def toggle_vendor(
    vendor_id: int,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    vendor.is_active = not vendor.is_active
    db.commit()
    return {"id": vendor.id, "is_active": vendor.is_active}


@router.get("/products", response_model=List[schemas.ProductOut])
def list_products(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    products = (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.vendor),
                  joinedload(models.Product.price_points))
        .all()
    )
    return [to_product_out(p) for p in products]


@router.patch("/products/{product_id}/toggle")
def toggle_product(
    product_id: int,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    product.is_active = not product.is_active
    db.commit()
    return {"id": product.id, "is_active": product.is_active}


@router.get("/orders", response_model=List[schemas.OrderOut])
def list_orders(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [
        schemas.OrderOut(
            id=o.id, total=o.total, status=o.status.value,
            created_at=o.created_at,
            items=[schemas.OrderItemOut(
                product_id=i.product_id, product_name=i.product.name, vendor_id=i.vendor_id,
                quantity=i.quantity, price_at_purchase=i.price_at_purchase,
            ) for i in o.items],
        )
        for o in orders
    ]
