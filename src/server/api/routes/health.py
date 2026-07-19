from fastapi import APIRouter, Response

router = APIRouter()


@router.get("/health", operation_id="health")
def health():
    return Response(status_code=200)