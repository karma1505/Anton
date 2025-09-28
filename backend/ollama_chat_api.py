
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    prompt = data.get("prompt")
    model = data.get("model")
    if not prompt or not model:
        return {"error": "Missing prompt or model"}
    ollama_url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    response = requests.post(ollama_url, json=payload)
    if response.status_code == 200:
        result = response.json()
        # Return the 'response' field from Ollama
        return {"response": result.get("response", "")}
    else:
        return {"error": "Ollama API error", "status": response.status_code}
