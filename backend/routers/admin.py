# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from app.models.admin import Admin
# from app.schemas.admin_schema import AdminRead, AdminCreate
# from app.services import auth_admin_service
# from app.config.database import get_db




# router = APIRouter(tags=["Admins"])

# @router.post("/", response_model=AdminRead)
# def create_admin(admin: AdminCreate, db: Session = Depends(get_db)):

#     db_admin = db.query(Admin).filter(Admin.email == admin.email).first()
#     if db_admin:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     hashed_password = auth_admin_service.get_password_hash(admin.password)

#     new_admin = Admin(
#         **admin.dict(exclude={"password"}),
#         hashed_password=hashed_password
#     )

#     db.add(new_admin)
#     db.commit()
#     db.refresh(new_admin)

#     return new_admin


# @router.get("/me", response_model=AdminRead)
# def read_current_admin(current_admin: Admin = Depends(auth_admin_service.get_current_admin)):
#     return current_admin