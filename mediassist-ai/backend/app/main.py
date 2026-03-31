from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat_routes import router as chat_router
from app.routes.skin_routes import router as skin_router


app = FastAPI(title="MediAssist AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "MediAssist AI Backend Running 🚀"}


app.include_router(chat_router, prefix="/api", tags=["Chat"])

app.include_router(skin_router, prefix="/api", tags=["Skin Scan"])
