from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="CoPaw Console")

console_dir = "/app/console"

if os.path.exists(console_dir):
    app.mount("/", StaticFiles(directory=console_dir, html=True), name="static")
else:
    print(f"Console directory not found: {console_dir}")

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
