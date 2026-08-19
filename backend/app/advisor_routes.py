from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from . import schemas
from .database import get_db
from .advisor import recommend_build

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


@router.post("/recommend", response_model=schemas.AdvisorResponse)
def recommend(payload: schemas.AdvisorRequest, db: Session = Depends(get_db)):
    return recommend_build(payload, db)
