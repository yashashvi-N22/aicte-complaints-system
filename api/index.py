import os
import sys
import shutil

# Add backend directory to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# On Vercel, serverless function filesystem is read-only except /tmp
if os.getenv("VERCEL"):
    tmp_db = "/tmp/aicte_portal.db"
    
    # Try locating the pre-seeded db
    potential_srcs = [
        os.path.join(backend_dir, "aicte_portal.db"),
        os.path.join(root_dir, "aicte_portal.db"),
        os.path.join(os.path.dirname(__file__), "aicte_portal.db"),
    ]
    
    src_db = None
    for p in potential_srcs:
        if os.path.exists(p):
            src_db = p
            break
            
    if src_db and not os.path.exists(tmp_db):
        try:
            shutil.copyfile(src_db, tmp_db)
            print(f"Copied seed DB from {src_db} to {tmp_db}")
        except Exception as e:
            print(f"Notice copying db to /tmp: {e}")
            
    if not os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL").startswith("sqlite"):
        os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"

from app.main import app

# Vercel ASGI Handler
handler = app
