from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from modules.vendors.schemas.vendor_schema import VendorCreate, VendorRead, VendorUpdate
from modules.vendors.services import vendor_service
from modules.vendors.models.vendor_model import Vendor
from modules.users.schemas.user_schema import UserRead
from modules.users.services import user_service
from modules.auth.vendors import auth_vendor
from modules.vendors.models.vendor_model import Vendor

router = APIRouter(tags=["Vendors"])

@router.post("/create", response_model=VendorRead)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    new_vendor = vendor_service.create_vendor(db, vendor)
    if not new_vendor:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_vendor

@router.get("/all-vendors", response_model=List[VendorRead])
def list_vendors(db: Session = Depends(get_db)):
    return vendor_service.list_vendors(db)

@router.get("/{vendor_id}", response_model=VendorRead)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = vendor_service.get_vendor(db, vendor_id)
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
    updated_vendor = vendor_service.update_vendor(db, vendor_id, vendor_data)
    if not updated_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return updated_vendor


