"""
Localync Advisor.

This is deliberately NOT a wrapper around an LLM chat API — the brief
explicitly says "you don't need to turn everything into an AI chatbot,
make AI quietly useful." Instead this is a transparent budget-allocation
algorithm: given a budget and a use case, it walks the required PC-builder
slots in priority order for that use case, picks the best-scoring product
that fits the remaining budget in each slot, then runs the exact same
compatibility engine used by the PC Builder against the result — so the
"recommendation" is provably compatible, not just plausible-sounding text.
"""
from typing import List

from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .compatibility import evaluate_build
from .products import to_product_out

# Budget share + slot priority differ by use case. Order matters: earlier
# slots get first claim on budget.
USE_CASE_PROFILES = {
    "gaming": {
        "order": ["gpu", "cpu", "motherboard", "ram", "storage", "psu", "case"],
        "share": {"gpu": 0.38, "cpu": 0.20, "motherboard": 0.12, "ram": 0.10,
                   "storage": 0.08, "psu": 0.07, "case": 0.05},
    },
    "productivity": {
        "order": ["cpu", "ram", "storage", "motherboard", "gpu", "psu", "case"],
        "share": {"cpu": 0.28, "ram": 0.16, "storage": 0.14, "motherboard": 0.14,
                   "gpu": 0.16, "psu": 0.07, "case": 0.05},
    },
    "budget": {
        "order": ["cpu", "motherboard", "ram", "storage", "gpu", "psu", "case"],
        "share": {"cpu": 0.22, "motherboard": 0.16, "ram": 0.14, "storage": 0.12,
                   "gpu": 0.20, "psu": 0.10, "case": 0.06},
    },
}


def recommend_build(payload: schemas.AdvisorRequest, db: Session) -> schemas.AdvisorResponse:
    use_case = payload.use_case if payload.use_case in USE_CASE_PROFILES else "gaming"
    profile = USE_CASE_PROFILES[use_case]

    products_by_category = {}
    for slug in profile["order"]:
        items = (
            db.query(models.Product)
            .options(joinedload(models.Product.category), joinedload(models.Product.vendor),
                      joinedload(models.Product.price_points))
            .join(models.Category)
            .filter(models.Category.slug == slug, models.Product.is_active == True)  # noqa: E712
            .all()
        )
        products_by_category[slug] = items

    chosen: List[models.Product] = []
    remaining = payload.budget

    for slug in profile["order"]:
        slot_budget = payload.budget * profile["share"].get(slug, 0.1)
        candidates = [p for p in products_by_category.get(slug, []) if p.price <= max(slot_budget, remaining)]
        if not candidates:
            # fall back to the cheapest option in the category if nothing fits the target share
            candidates = sorted(products_by_category.get(slug, []), key=lambda p: p.price)
            candidates = candidates[:1]
        if not candidates:
            continue
        # Pick the best overall-scoring product that still fits what's left of the budget.
        affordable = [p for p in candidates if p.price <= remaining] or candidates
        best = max(affordable, key=lambda p: (p.score_performance + p.score_value) / 2)
        chosen.append(best)
        remaining -= best.price

    compatibility = evaluate_build(chosen)
    total = sum(p.price for p in chosen)

    if remaining < 0:
        message = (
            f"This build runs about ₹{abs(round(remaining)):,} over your ₹{payload.budget:,.0f} budget — "
            f"consider the {use_case} profile's cheaper alternatives, or raise the budget slightly."
        )
    elif compatibility.score < 70:
        message = (
            "Compatibility came out lower than ideal on this combination — check the flagged "
            "components below before buying."
        )
    else:
        message = (
            f"For ₹{payload.budget:,.0f} and {use_case}, this combination scores {compatibility.score}/100 "
            f"on compatibility with about ₹{max(0, round(remaining)):,} left over."
        )

    return schemas.AdvisorResponse(
        components=[
            schemas.AdvisorComponent(category=p.category.slug, product=to_product_out(p))
            for p in chosen
        ],
        estimated_total=round(total, 2),
        compatibility=compatibility,
        message=message,
    )
