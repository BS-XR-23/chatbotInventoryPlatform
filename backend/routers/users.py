from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.users import User
from backend.models.vendors import Vendor
from backend.schemas.users import UserCreate, UserRead
from backend.core import auth_user, auth_vendor

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/create", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth_user.get_password_hash(user.password)

    new_user = User(
        **user.dict(exclude={"password"}),
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=List[UserRead])
def get_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user_data.dict().items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}
