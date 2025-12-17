from sqlalchemy.orm import Session
from typing import List
from modules.vector_dbs.models.vector_db_model import VectorDB
from modules.vector_dbs.schemas.vector_db_schema import VectorDBCreate


def add_vector_db(db: Session, vector_db_data: VectorDBCreate) -> VectorDB:
    new_vector_db = VectorDB(**vector_db_data.dict())
    db.add(new_vector_db)
    db.commit()
    db.refresh(new_vector_db)

    return new_vector_db

def get_vector_dbs(db: Session) -> List[VectorDB]:
    return db.query(VectorDB).all()

def get_vector_db(db: Session, vector_db_id: int) -> VectorDB:
    return db.query(VectorDB).filter(VectorDB.id == vector_db_id).first()

def update_vector_db(db: Session, vector_db_id: int, vector_db_data: VectorDBCreate) -> VectorDB:
    vector_db = db.query(VectorDB).filter(VectorDB.id == vector_db_id).first()
    if not vector_db:
        return None
    for key, value in vector_db_data.dict().items():
        setattr(vector_db, key, value)
    db.commit()
    db.refresh(vector_db)
    return vector_db

def delete_vector_db(db: Session, vector_db_id: int) -> bool:
    vector_db = db.query(VectorDB).filter(VectorDB.id == vector_db_id).first()
    if not vector_db:
        return False
    db.delete(vector_db)
    db.commit()
    return True
