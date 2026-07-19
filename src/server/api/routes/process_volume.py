from fastapi import APIRouter, HTTPException
from result import is_ok

from server.models.volume import ProcessVolumeError, ProcessVolumeRequest, ProcessVolumeResponse
from server.services.volume_processor import VolumeProcessor

router = APIRouter()


@router.post(
    "/process_volume",
    operation_id="processVolume",
    response_model=ProcessVolumeResponse,
    responses={
        500: {"model": ProcessVolumeError, "description": "Processing failed."},
    },
)
def process_volume(request: ProcessVolumeRequest) -> ProcessVolumeResponse:
    result = VolumeProcessor.process_volume(request.filepath, request.temporary_directory)

    if is_ok(result):
        return ProcessVolumeResponse(output_files=result.ok_value)

    raise HTTPException(
        status_code=500,
        detail={
            "error": result.err_value,
        },
    )
