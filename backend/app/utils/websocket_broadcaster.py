from fastapi.websockets import WebSocket
import json
from typing import List

# in-memory list of active connections; suitable for single-process dev.
active_connections: List[WebSocket] = []


async def register_ws(ws: WebSocket):
    await ws.accept()
    active_connections.append(ws)


def unregister_ws(ws: WebSocket):
    try:
        active_connections.remove(ws)
    except ValueError:
        pass


def _format_llm_message(llm):
    return json.dumps({
        "type": "llm.update",
        "payload": {
            "id": llm.id,
            "pull_status": llm.pull_status,
            "pull_progress": llm.pull_progress,
            "is_available_locally": llm.is_available_locally,
            "local_size_mb": llm.local_size_mb,
            "last_synced": llm.last_synced.isoformat() if llm.last_synced else None,
        }
    })


def broadcast_llm_update(llm):
    """
    Synchronously broadcast from background thread/process.
    FastAPI WebSocket send_text is async; to call from sync context we use anyio.from_thread.run
    """
    import anyio

    msg = _format_llm_message(llm)

    # copy list to avoid concurrent modification
    conns = list(active_connections)
    for ws in conns:
        try:
            anyio.from_thread.run(ws.send_text, msg)
        except Exception:
            # if send fails, remove connection
            try:
                active_connections.remove(ws)
            except Exception:
                pass
