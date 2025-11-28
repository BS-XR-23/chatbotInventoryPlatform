import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env file
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(project_root, ".env"))

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")  # default to HS256 if not set
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
ACCESS_TOKEN_EXPIRE = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

# Optional sanity check
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not found in environment variables")