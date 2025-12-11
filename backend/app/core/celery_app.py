from celery import Celery

celery_app = Celery(
    "chatbotInventoryPlatform",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1"
)

celery_app.conf.update(
    task_track_started=True,
    worker_max_tasks_per_child=100,
    task_serializer="json",
    accept_content=["json"]
)

# Autodiscover your tasks
celery_app.autodiscover_tasks(["utils.ollama_tasks"])

