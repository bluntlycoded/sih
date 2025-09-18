from fastapi import APIRouter, Depends, HTTPException
from app.security import get_current_user
from app.schemas import UserOut

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    """
    Return the current authenticated user's profile.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Ensure role is always string
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "role": str(user.get("role")),
        "institution_id": user.get("institution_id"),
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
    }
