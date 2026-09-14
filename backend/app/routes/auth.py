import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, FarmerProfile, Farm
from app.schemas.auth import UserSignup, UserLogin, UserResponse, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.db.auth_deps import get_current_user
from app.services import farm_map_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Accounts"])

@router.post("/signup", response_model=TokenResponse)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    """
    Registers a new farmer account, creates initial farmer profile and farm context.
    Returns access token and user info.
    """
    clean_identifier = data.email_or_phone.strip().lower()
    
    # Check duplicate account
    existing = db.query(User).filter(User.email_or_phone == clean_identifier).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email/phone already exists. Please log in."
        )

    # Hash password & create user
    hashed = hash_password(data.password)
    new_user = User(
        full_name=data.full_name.strip(),
        email_or_phone=clean_identifier,
        hashed_password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated FarmerProfile
    profile = FarmerProfile(
        user_id=new_user.id,
        farmer_name=new_user.full_name,
        preferred_language="English",
        state="",
        district="",
        village_location=""
    )
    db.add(profile)
    db.commit()

    # Create initial farm for user
    farm_map_service.get_or_create_default_farm(db)
    # Reassign or link farm to user
    default_farm = db.query(Farm).filter(Farm.farmer_id == 1).first()
    if default_farm:
        default_farm.farmer_id = new_user.id
        default_farm.name = f"{new_user.full_name.split()[0]}'s Farm"
        default_farm.is_active = True
        db.commit()

    token = create_access_token({"sub": str(new_user.id), "name": new_user.full_name})
    logger.info(f"Created new user account ID={new_user.id} email={new_user.email_or_phone}")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates farmer credentials and returns access token.
    """
    clean_identifier = data.email_or_phone.strip().lower()
    user = db.query(User).filter(User.email_or_phone == clean_identifier).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password. Please try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )

    token = create_access_token({"sub": str(user.id), "name": user.full_name})
    logger.info(f"User ID={user.id} logged in successfully.")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns currently authenticated user.
    """
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logs out farmer (client clears token).
    """
    return {"message": "Logged out successfully", "user_id": current_user.id}
