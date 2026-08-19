from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from . import models, schemas, security
from .database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = models.User(
        name=payload.name,
        email=payload.email,
        # Only the bcrypt hash is ever persisted — see security.py
        hashed_password=security.hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.flush()

    # Vendor and technician accounts get an operational profile created
    # automatically, so the vendor/technician dashboards have something
    # to attach to immediately after signup.
    if payload.role == "vendor":
        vendor = models.Vendor(name=f"{payload.name}'s Store", locality="Hyderabad", distance_km=0, rating=4.5)
        db.add(vendor)
        db.flush()
        user.vendor_id = vendor.id
    elif payload.role == "technician":
        tech = models.Technician(
            name=payload.name, specialty="General repair", locality="Hyderabad",
            distance_km=0, rating=4.5, available=True,
        )
        db.add(tech)
        db.flush()
        user.technician_id = tech.id

    db.commit()
    db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    # Deliberately generic error + same code path whether the user exists
    # or the password is wrong, so responses don't leak which one failed.
    if not user or not security.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error

    payload = security.decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise credentials_error

    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if user is None:
        raise credentials_error
    return user


def require_role(*roles: str):
    """Dependency factory: require the current user to hold one of `roles`.
    Usage: Depends(require_role("vendor", "admin"))."""

    def dependency(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role.value not in roles:
            raise HTTPException(status_code=403, detail="You don't have access to this resource.")
        return current_user

    return dependency


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
