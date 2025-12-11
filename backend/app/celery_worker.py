# celery_worker.py
from core.celery_app import celery_app

if __name__ == "__main__":
    # Run worker programmatically
    celery_app.worker_main(
        argv=[
            "worker",
            "--loglevel=info",
            "--pool=solo",  # solo pool works better for Windows; remove if on Linux/macOS
        ]
    )

