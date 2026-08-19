from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .database import get_db
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["technician", "repair"])


# ---------- Repair / Upgrade Center (open to any logged-in user) ----------

STAR_RULES = {
    "ram": ("ram_capacity_gb", "RAM"),
    "storage": ("storage_capacity_gb", "storage"),
    "gpu": ("score_performance", "GPU"),
}


@router.get("/repair/upgrades/{product_id}", response_model=List[schemas.UpgradeSuggestion])
def upgrade_suggestions(product_id: int, db: Session = Depends(get_db)):
    """Suggest upgrade paths within the same category, ranked by how much
    of an improvement they represent over the current product."""
    current = db.query(models.Product).options(joinedload(models.Product.category)).filter(
        models.Product.id == product_id
    ).first()
    if not current:
        raise HTTPException(status_code=404, detail="Product not found.")
    if not current.category:
        return []

    candidates = (
        db.query(models.Product)
        .filter(models.Product.category_id == current.category_id, models.Product.id != current.id,
                models.Product.is_active == True)  # noqa: E712
        .all()
    )

    def overall_score(p):
        return (p.score_performance + p.score_upgradeability + p.score_longevity) / 3

    base_score = overall_score(current)
    suggestions = []
    for c in candidates:
        delta = overall_score(c) - base_score
        if delta <= 0:
            continue
        stars = 1 + min(4, round(delta / 8))
        reason_bits = []
        if current.ram_capacity_gb and c.ram_capacity_gb and c.ram_capacity_gb > current.ram_capacity_gb:
            reason_bits.append(f"{current.ram_capacity_gb}GB → {c.ram_capacity_gb}GB")
        if current.storage_capacity_gb and c.storage_capacity_gb and c.storage_capacity_gb > current.storage_capacity_gb:
            reason_bits.append(f"{current.storage_capacity_gb}GB → {c.storage_capacity_gb}GB")
        if not reason_bits:
            reason_bits.append(f"+{round(delta)} pts overall score")
        suggestions.append(schemas.UpgradeSuggestion(
            product_id=c.id, name=c.name, price=c.price, stars=int(stars),
            reason=", ".join(reason_bits),
        ))

    suggestions.sort(key=lambda s: s.stars, reverse=True)
    return suggestions[:5]


@router.get("/repair/technicians", response_model=List[schemas.TechnicianOut])
def list_technicians(db: Session = Depends(get_db)):
    return db.query(models.Technician).filter(models.Technician.available == True).all()  # noqa: E712


@router.post("/repair/requests", response_model=schemas.ServiceRequestOut, status_code=201)
def create_service_request(
    payload: schemas.ServiceRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = models.ServiceRequest(
        customer_id=current_user.id, technician_id=payload.technician_id,
        product_name=payload.product_name, issue=payload.issue,
        status=models.RequestStatus.pending,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return schemas.ServiceRequestOut(
        id=req.id, product_name=req.product_name, issue=req.issue, status=req.status.value,
        technician_id=req.technician_id, customer_id=req.customer_id, created_at=req.created_at,
    )


@router.get("/repair/requests/mine", response_model=List[schemas.ServiceRequestOut])
def my_service_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reqs = (
        db.query(models.ServiceRequest)
        .filter(models.ServiceRequest.customer_id == current_user.id)
        .order_by(models.ServiceRequest.created_at.desc())
        .all()
    )
    return [
        schemas.ServiceRequestOut(
            id=r.id, product_name=r.product_name, issue=r.issue, status=r.status.value,
            technician_id=r.technician_id, customer_id=r.customer_id, created_at=r.created_at,
        )
        for r in reqs
    ]


# ---------- Technician dashboard ----------

def _technician_of(current_user: models.User, db: Session) -> models.Technician:
    if not current_user.technician_id:
        raise HTTPException(status_code=400, detail="This account has no technician profile.")
    tech = db.query(models.Technician).filter(models.Technician.id == current_user.technician_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician profile not found.")
    return tech


@router.get("/technician/requests", response_model=List[schemas.ServiceRequestOut])
def technician_requests(
    current_user: models.User = Depends(require_role("technician", "admin")),
    db: Session = Depends(get_db),
):
    tech = _technician_of(current_user, db)
    reqs = (
        db.query(models.ServiceRequest)
        .filter(
            (models.ServiceRequest.technician_id == tech.id) |
            (models.ServiceRequest.technician_id.is_(None))
        )
        .order_by(models.ServiceRequest.created_at.desc())
        .all()
    )
    return [
        schemas.ServiceRequestOut(
            id=r.id, product_name=r.product_name, issue=r.issue, status=r.status.value,
            technician_id=r.technician_id, customer_id=r.customer_id, created_at=r.created_at,
        )
        for r in reqs
    ]


@router.patch("/technician/requests/{request_id}", response_model=schemas.ServiceRequestOut)
def update_request_status(
    request_id: int,
    payload: schemas.ServiceRequestStatusUpdate,
    current_user: models.User = Depends(require_role("technician", "admin")),
    db: Session = Depends(get_db),
):
    tech = _technician_of(current_user, db)
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found.")
    if payload.status not in [s.value for s in models.RequestStatus]:
        raise HTTPException(status_code=400, detail="Invalid status.")

    req.technician_id = tech.id  # claiming the request, if unclaimed
    req.status = payload.status
    db.commit()
    db.refresh(req)
    return schemas.ServiceRequestOut(
        id=req.id, product_name=req.product_name, issue=req.issue, status=req.status.value,
        technician_id=req.technician_id, customer_id=req.customer_id, created_at=req.created_at,
    )


@router.patch("/technician/availability")
def set_availability(
    available: bool,
    current_user: models.User = Depends(require_role("technician", "admin")),
    db: Session = Depends(get_db),
):
    tech = _technician_of(current_user, db)
    tech.available = available
    db.commit()
    return {"available": tech.available}
