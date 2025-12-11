from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from db.database import get_db
from core.config import settings
from modules.vendors.models import vendor_model


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/vendor/token")

def get_password_hash(password: str):
    truncated_password = password[:72]
    return pwd_context.hash(truncated_password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_vendor(db: Session, email: str):
    return db.query(vendor_model.Vendor).filter(vendor_model.Vendor.email == email).first()

def authenticate_vendor(db: Session, email: str, password: str):
    vendor_obj = get_vendor(db, email)
    if not vendor_obj:
        return False
    if not verify_password(password, vendor_obj.hashed_password):
        return False
    return vendor_obj

def create_access_token(
    vendor_id: int,
    chatbot_id: int,
    data: Optional[dict] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy() if data else {}
    # Add vendor_id and chatbot_id to payload
    to_encode.update({
        "vendor_id": vendor_id,
        "chatbot_id": chatbot_id
    })

    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_vendor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    vendor_obj = get_vendor(db, email=email)
    if vendor_obj is None:
        raise credentials_exception
    return vendor_obj
