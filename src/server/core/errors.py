from pydantic import BaseModel

class ErrorDetail(BaseModel):
    error: str