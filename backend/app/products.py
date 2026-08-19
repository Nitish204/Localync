from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .database import get_db
from .compatibility import evaluate_build

router = APIRouter(prefix="/api", tags=["products"])


def to_product_out(p: models.Product) -> schemas.ProductOut:
    data = schemas.ProductOut.model_validate(p, from_attributes=True)
    data.category = p.category.slug if p.category else None
    data.category_group = p.category.group if p.category else None
    data.unit = p.category.unit if p.category else None
    data.vendor_id = p.vendor.id if p.vendor else None
    data.vendor_name = p.vendor.name if p.vendor else None
    data.vendor_distance_km = p.vendor.distance_km if p.vendor else None
    data.price_history = [
        schemas.PricePointOut.model_validate(pp) for pp in
        sorted(p.price_points, key=lambda x: x.recorded_at)
    ]
    return data


@router.get("/products", response_model=List[schemas.ProductOut])
def list_products(
    category: Optional[str] = None,
    group: Optional[str] = None,
    q: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.vendor),
        joinedload(models.Product.price_points),
    )
    if not include_inactive:
        query = query.filter(models.Product.is_active == True)  # noqa: E712
    if category:
        query = query.join(models.Category).filter(models.Category.slug == category)
    if group:
        query = query.join(models.Category).filter(models.Category.group == group)
    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    products = query.all()
    return [to_product_out(p) for p in products]


@router.get("/products/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = (
        db.query(models.Product)
        .options(
            joinedload(models.Product.category),
            joinedload(models.Product.vendor),
            joinedload(models.Product.price_points),
        )
        .filter(models.Product.id == product_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return to_product_out(p)


@router.get("/categories")
def list_categories(group: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Category)
    if group:
        query = query.filter(models.Category.group == group)
    return [{"name": c.name, "slug": c.slug, "group": c.group, "unit": c.unit} for c in query.all()]


@router.post("/pc-builder/check", response_model=schemas.CompatibilityResult)
def check_compatibility(payload: schemas.CompatibilityRequest, db: Session = Depends(get_db)):
    components = (
        db.query(models.Product)
        .options(joinedload(models.Product.category))
        .filter(models.Product.id.in_(payload.product_ids))
        .all()
    )
    if not components:
        raise HTTPException(status_code=400, detail="No valid components supplied.")
    return evaluate_build(components)
