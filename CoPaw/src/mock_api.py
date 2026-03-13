"""
Minimal mock CoPaw API server for Webchat-Dev development
"""

from fastapi import FastAPI, WebSocket
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
from datetime import datetime

app = FastAPI(title="CoPaw Mock API")

class ChatRequest(BaseModel):
    message: str
    sessionId: str

@app.get("/")
async def root():
    return {"status": "ok", "message": "CoPaw Mock API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.put("/api/agent")
async def chat(request: ChatRequest):
    """Simple chat endpoint that returns a mock response"""
    
    async def generate_response():
        # Simulate thinking delay
        await asyncio.sleep(0.5)
        
        # Send thinking marker
        yield "__THINKING__"
        
        # Simulate streaming response
        response_text = f"收到消息: {request.message}\n\n这是来自 CoPaw Mock API 的测试响应。实际项目中，这里会连接到真实的 AI 模型。"
        
        # Stream the response word by word
        words = response_text.split()
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.05)
    
    return StreamingResponse(
        generate_response(),
        media_type="text/plain"
    )

@app.get("/api/history/{session_id}")
async def get_history(session_id: str):
    """Return mock chat history"""
    return {
        "session_id": session_id,
        "messages": [
            {
                "id": "1",
                "role": "assistant",
                "content": "你好！我是 CoPaw 助手。有什么可以帮助你的吗？",
                "created_at": datetime.now().isoformat()
            }
        ]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Echo back with a mock response
            response = {
                "type": "message",
                "id": str(datetime.now().timestamp()),
                "role": "assistant",
                "content": f"收到: {message.get('content', '')}",
                "timestamp": datetime.now().isoformat()
            }
            
            await websocket.send_json(response)
            
    except Exception:
        await websocket.close()

@app.get("/api/uploads/sign")
async def sign_url(url: str):
    """Mock URL signing endpoint"""
    return {
        "data": {
            "signed_url": url,
            "expires": int(datetime.now().timestamp()) + 3600
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7088)
