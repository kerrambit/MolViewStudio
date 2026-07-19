from pydantic import BaseModel
from typing import List

from server.core.errors import ErrorDetail

class ProcessVolumeRequest(BaseModel):
    filepath: str
    temporary_directory: str
    

class ProcessVolumeResponse(BaseModel):
    output_files: List[str]
    

class ProcessVolumeError(BaseModel):
    detail: ErrorDetail
