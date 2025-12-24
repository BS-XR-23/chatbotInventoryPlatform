from sqlalchemy import Column, Integer, String, Enum
from db.database import Base
from core.enums import UserRole

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.admin, nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
