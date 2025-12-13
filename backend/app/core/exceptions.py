# core/exceptions/vendor_exceptions.py
from fastapi import HTTPException, status

class VendorNotActiveException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor is not active"
        )
