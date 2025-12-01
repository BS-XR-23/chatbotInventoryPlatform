from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.vendors import Vendor
from backend.schemas.vendors import VendorCreate, VendorRead, VendorUpdate
from backend.core import auth_vendor

router = APIRouter(prefix="/vendors", tags=["Vendors"])

# --- Create Vendor (Public, no authentication required) ---
@router.post("/create", response_model=VendorRead)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.email == vendor.email).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth_vendor.get_password_hash(vendor.password)

    new_vendor = Vendor(
        **vendor.dict(exclude={"password"}),
        hashed_password=hashed_password
    )

    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.get("/all-vendors", response_model=List[VendorRead])
def list_vendors(
    db: Session = Depends(get_db)
):
    return db.query(Vendor).all()


@router.get("/{vendor_id}", response_model=VendorRead)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/update/{vendor_id}", response_model=VendorRead)
def update_vendor(
    vendor_id: int,
    vendor_data: VendorUpdate,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor_data.dict().items():
        setattr(vendor, key, value)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/delete/{vendor_id}")
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
    return {"detail": "Vendor deleted successfully"}
