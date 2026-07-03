import time

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

import models
import repositories
from database import get_db
from deps import get_current_user, user_for_api_key
from schemas import DesignInput, DesignResponse, validate_design

router = APIRouter(tags=["designs"])


@router.get("/designs", response_model=list[DesignResponse])
def list_designs(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = repositories.designs_for_user(db, user)
    return [DesignResponse.from_row(r) for r in rows]


@router.get("/designs/by-name/{name}", response_model=DesignResponse)
def get_design_by_name(
    name: str,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias="X-Api-Key"),
):
    owner = user_for_api_key(db, x_api_key)
    row = repositories.design_by_owner_name(db, owner.email, name)
    if row is None:
        raise HTTPException(status_code=404, detail="Design not found")
    return DesignResponse.from_row(row)


@router.post("/designs", response_model=DesignResponse, status_code=201)
def create_design(
    payload: DesignInput,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    error = validate_design(payload)
    if error is not None:
        raise HTTPException(status_code=400, detail=error)

    name = payload.name.strip()
    if repositories.design_name_taken(db, user.email, name):
        raise HTTPException(status_code=409, detail="A design with this name already exists.")

    now = int(time.time() * 1000)
    design = models.FormDesign(
        owner_email=user.email,
        name=name,
        title=payload.title.strip(),
        description=payload.description,
        fields=repositories.normalized_fields(payload),
        background_color=payload.background_color,
        card_color=payload.card_color,
        title_color=payload.title_color,
        button_color=payload.button_color,
        created_at=now,
        updated_at=now,
    )
    db.add(design)
    db.commit()
    db.refresh(design)
    return DesignResponse.from_row(design)


@router.put("/designs/{design_id}", response_model=DesignResponse)
def update_design(
    design_id: int,
    payload: DesignInput,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    error = validate_design(payload)
    if error is not None:
        raise HTTPException(status_code=400, detail=error)

    design = db.get(models.FormDesign, design_id)
    if design is None or design.owner_email != user.email:
        raise HTTPException(status_code=404, detail="Design not found")

    name = payload.name.strip()
    if repositories.design_name_taken(db, user.email, name, exclude_id=design_id):
        raise HTTPException(status_code=409, detail="A design with this name already exists.")

    design.name = name
    design.title = payload.title.strip()
    design.description = payload.description
    design.fields = repositories.normalized_fields(payload)
    design.background_color = payload.background_color
    design.card_color = payload.card_color
    design.title_color = payload.title_color
    design.button_color = payload.button_color
    design.updated_at = int(time.time() * 1000)
    db.commit()
    db.refresh(design)
    return DesignResponse.from_row(design)


@router.delete("/designs/{design_id}")
def delete_design(
    design_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    design = db.get(models.FormDesign, design_id)
    if design is None or design.owner_email != user.email:
        raise HTTPException(status_code=404, detail="Design not found")
    db.delete(design)
    db.commit()
    return {"deleted": design_id}
