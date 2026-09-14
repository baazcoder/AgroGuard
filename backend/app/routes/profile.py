from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.profile import FarmerProfileResponse, FarmerProfileUpdate
from app.services import profile_service
from app.db.auth_deps import get_optional_current_user
from app.db.models import User
from typing import Dict, Any, Optional

router = APIRouter(prefix="/api", tags=["Farmer Profile & Farm Memory"])

@router.get("/farmer-profile", response_model=FarmerProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Retrieve current farmer profile for authenticated user.
    """
    u_id = current_user.id if current_user else None
    profile = profile_service.get_or_create_farmer_profile(db, user_id=u_id)
    if current_user and not profile.farmer_name:
        profile.farmer_name = current_user.full_name
    return profile

@router.post("/farmer-profile", response_model=FarmerProfileResponse)
def update_profile(
    data: FarmerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Create or update farmer profile details for authenticated user.
    """
    try:
        u_id = current_user.id if current_user else None
        profile = profile_service.save_farmer_profile(db, data, user_id=u_id)
        return profile
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save profile: {str(exc)}"
        )

@router.get("/farmer-profile/context")
def get_context(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> Dict[str, Any]:
    """
    Retrieve internal `farmer_context` representation (Farm Memory).
    """
    u_id = current_user.id if current_user else None
    return profile_service.get_farmer_context(db, user_id=u_id)
