"""Raw counts only; preprocessing stays identical to the audited baseline."""
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, model_validator

from ml.research.rello.features import QUESTIONS

SCHEMA_VERSION = "rello-counts-v1"
TASK_KEYS = {f"Q{q}" for q in QUESTIONS}
Count = Annotated[StrictInt, Field(ge=0, le=1_000_000)]


class TaskCounts(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clicks: Count | None
    hits: Count | None
    misses: Count | None

    @model_validator(mode="after")
    def validate_counts(self):
        if self.clicks is not None:
            if self.hits is not None and self.hits > self.clicks:
                raise ValueError("hits cannot exceed clicks")
            if self.misses is not None and self.misses > self.clicks:
                raise ValueError("misses cannot exceed clicks")
        return self


class PredictionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal["rello-counts-v1"]
    tasks: dict[str, TaskCounts] = Field(min_length=19, max_length=19)

    @model_validator(mode="after")
    def validate_tasks(self):
        if set(self.tasks) != TASK_KEYS:
            raise ValueError("Supply exactly the 19 Rello task keys; use null counts for missing tasks")
        active = [t for t in self.tasks.values()
                  if t.clicks is not None and t.clicks > 0
                  and t.hits is not None and t.misses is not None]
        if not active:
            raise ValueError("At least one task needs a complete count tuple with clicks > 0")
        return self


class PredictionOutput(BaseModel):
    model_id: str
    model_sha256: str
    schema_version: Literal["rello-counts-v1"]
    scope: Literal["research_only"] = "research_only"
    score: float = Field(ge=0, le=1)
    threshold: float = Field(ge=0, le=1)
    above_threshold: bool
    feature_count: int
    missing_feature_count: int
    complete_task_count: int
    active_task_count: int
    warnings: list[str]


def synthetic_example(partial=False):
    """Invented counts, never a participant record or a claimed clinical case."""
    tasks = {f"Q{q}": {"clicks": 20, "hits": 16, "misses": 4} for q in QUESTIONS}
    if partial:
        tasks["Q22"] = {"clicks": None, "hits": None, "misses": None}
        tasks["Q23"] = {"clicks": 0, "hits": 0, "misses": 0}
    return {"schema_version": SCHEMA_VERSION, "tasks": tasks}
