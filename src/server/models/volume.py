import enum
from pydantic import BaseModel
from typing import List, Optional

from server.core.errors import ErrorDetail


class ProcessVolumeRequest(BaseModel):
    filepath: str
    temporary_directory: str


class ProcessVolumeResponse(BaseModel):
    job_id: str
    websocket_url: str
    result_url: str


class ProcessVolumeProgressMessage(BaseModel):
    stage: str
    error: Optional[str] = None
    result: Optional[List[str]] = None


class ProcessedVolumeResponseStatus(enum.StrEnum):
    FINISHED = "finished"
    PENDING = "pending"


class ProcessedVolumeResponse(BaseModel):
    status: ProcessedVolumeResponseStatus
    output_files: List[str]


class ProcessVolumeError(BaseModel):
    detail: ErrorDetail
