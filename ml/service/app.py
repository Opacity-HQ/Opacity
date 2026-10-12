"""Internal API. Next.js checks the user session and forwards its server secret."""
from contextlib import asynccontextmanager
import hmac
import os

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.security import APIKeyHeader

from ml.service.contracts import PredictionInput, PredictionOutput
from ml.service.model import ResearchModel

api_key_header = APIKeyHeader(name="X-ML-API-Key", auto_error=False)


def require_service_key(request: Request, supplied: str | None = Depends(api_key_header)):
    if supplied is None or not supplied.isascii() or not hmac.compare_digest(supplied, request.app.state.api_key):
        raise HTTPException(status_code=401, detail="Invalid service credential")


def create_app(model_path=None):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        key = os.environ.get("ML_SERVICE_API_KEY", "")
        if len(key) < 24 or not key.isascii():
            raise RuntimeError("Set ML_SERVICE_API_KEY to an ASCII secret of at least 24 characters")
        app.state.api_key = key
        app.state.model = ResearchModel() if model_path is None else ResearchModel(model_path)
        yield
        del app.state.model

    app = FastAPI(title="Opacity Rello research service", lifespan=lifespan,
                  docs_url=None, redoc_url=None, openapi_url=None)

    @app.get("/health")
    def health(request: Request):
        return {"status": "ready", "model_id": request.app.state.model.model_id, "scope": "research_only"}

    @app.get("/v1/research/rello/metadata", dependencies=[Depends(require_service_key)])
    def metadata(request: Request):
        return request.app.state.model.metadata()

    @app.post("/v1/research/rello/predict", response_model=PredictionOutput,
              dependencies=[Depends(require_service_key)])
    def predict(payload: PredictionInput, request: Request):
        return request.app.state.model.predict(payload)

    return app


app = create_app()
