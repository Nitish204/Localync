from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .database import get_db
from .auth import get_current_user
from .products import to_product_out

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _line_out(item: models.CartItem) -> schemas.CartItemOut:
    product_out = to_product_out(item.product)
    return schemas.CartItemOut(
        id=item.id, product=product_out, quantity=item.quantity,
        line_total=round(product_out.price * item.quantity, 2),
    )


def order_to_out(o: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=o.id, total=o.total, status=o.status.value, created_at=o.created_at,
        items=[schemas.OrderItemOut(
            product_id=i.product_id, product_name=i.product.name, vendor_id=i.vendor_id,
            quantity=i.quantity, price_at_purchase=i.price_at_purchase,
        ) for i in o.items],
    )


def create_order_from_cart(db: Session, user: models.User) -> models.Order:
    """Turn a user's cart into a real Order + OrderItems, decrementing stock.

    No payment gateway is wired in right now — this places the order
    directly. If/when a gateway is added back, the natural seam is here:
    keep this function as the single place that actually creates the
    Order (so stock/validation rules stay identical everywhere), and have
    a payment-confirmation endpoint call it only after a payment is
    verified, instead of calling it straight from /checkout.
    """
    items = (
        db.query(models.CartItem)
        .options(joinedload(models.CartItem.product))
        .filter(models.CartItem.user_id == user.id)
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    total = sum(i.product.price * i.quantity for i in items)
    order = models.Order(user_id=user.id, total=total, status=models.OrderStatus.placed)
    db.add(order)
    db.flush()

    for i in items:
        if i.product.stock < i.quantity:
            raise HTTPException(status_code=400, detail=f"{i.product.name} doesn't have enough stock.")
        i.product.stock -= i.quantity
        db.add(models.OrderItem(
            order_id=order.id, product_id=i.product_id, vendor_id=i.product.vendor_id,
            quantity=i.quantity, price_at_purchase=i.product.price,
        ))
        db.delete(i)

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=List[schemas.CartItemOut])
def get_cart(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(models.CartItem)
        .options(joinedload(models.CartItem.product).joinedload(models.Product.category),
                 joinedload(models.CartItem.product).joinedload(models.Product.vendor),
                 joinedload(models.CartItem.product).joinedload(models.Product.price_points))
        .filter(models.CartItem.user_id == current_user.id)
        .all()
    )
    return [_line_out(i) for i in items]


@router.post("/items", response_model=schemas.CartItemOut)
def add_item(
    payload: schemas.CartItemIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    existing = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == current_user.id, models.CartItem.product_id == payload.product_id)
        .first()
    )
    if existing:
        existing.quantity += payload.quantity
        item = existing
    else:
        item = models.CartItem(user_id=current_user.id, product_id=payload.product_id, quantity=payload.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return _line_out(item)


@router.delete("/items/{item_id}")
def remove_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(models.CartItem)
        .filter(models.CartItem.id == item_id, models.CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.post("/checkout", response_model=schemas.OrderOut)
def checkout(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = create_order_from_cart(db, current_user)
    return order_to_out(order)


@router.get("/orders", response_model=List[schemas.OrderOut])
def my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [order_to_out(o) for o in orders]
