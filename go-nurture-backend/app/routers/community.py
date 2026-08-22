from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.community_partner import CommunityPartner
from app.schemas.community_partner import CommunityPartnerResponse

router = APIRouter(prefix="/api/community", tags=["Community"])


@router.get("/partners", response_model=List[CommunityPartnerResponse])
def get_community_partners(
    db: Session = Depends(get_db),
):
    """Public: Get all active community partners for the community-support page."""
    partners = (
        db.query(CommunityPartner)
        .filter(CommunityPartner.is_active == True)
        .order_by(CommunityPartner.created_at.desc())
        .all()
    )
    return [CommunityPartnerResponse.model_validate(p) for p in partners]
