import asyncio
from fastapi import APIRouter, HTTPException, WebSocket

from server.models.volume import (
    ProcessVolumeError,
    ProcessVolumeProgressMessage,
    ProcessVolumeRequest,
    ProcessVolumeResponse,
    ProcessedVolumeResponse,
    ProcessedVolumeResponseStatus,
)
from server.services.jobs_manager import (
    ProcessVolumeJob,
    get_instance as get_jobs_manager_instance,
)
from server.services.volume_processor import Preprocessor

router = APIRouter()


@router.post(
    "/process_volume",
    operation_id="processVolume",
    response_model=ProcessVolumeResponse,
)
async def process_volume(request: ProcessVolumeRequest):
    job = ProcessVolumeJob()
    get_jobs_manager_instance().set_job(job.id, job)

    asyncio.create_task(
        Preprocessor.process_volume(
            job,
            request.temporary_directory,
            request.volume_filepaths,
            request.downsampling_strategy,
            request.volume_serializer,
            request.segmentations_filepaths,
            request.segmentation_mask_serializer,
            request.segmentation_volume_serializer,
            request.segmentation_mesh_serializer,
            request.bundling_approach,
        )
    )

    return {
        "job_id": job.id,
        "websocket_url": f"/ws/process_volume/{job.id}",
        "result_url": f"/process_volume/{job.id}/result",
    }


@router.websocket("/ws/process_volume/{job_id}")
async def process_volume_ws(websocket: WebSocket, job_id: str):
    job = get_jobs_manager_instance().get_job(job_id)

    if job is None:
        await websocket.close(code=404, reason="Job was not found!")
        return
    await websocket.accept()
    try:
        while True:
            message: ProcessVolumeProgressMessage = await job.queue.get()
            await websocket.send_json(message.model_dump())
            if message.stage == "done":
                break
    finally:
        await websocket.close()


@router.get(
    "/process_volume/{job_id}/result",
    operation_id="getProcessedVolumeResult",
    response_model=ProcessedVolumeResponse,
    responses={
        404: {"model": ProcessVolumeError, "description": "Job was not found!"},
        500: {"model": ProcessVolumeError, "description": "Processing failed!"},
    },
)
def get_processed_volume(job_id: str):
    job = get_jobs_manager_instance().get_job(job_id)

    if job is None:
        raise HTTPException(404, detail={"error": f"No job found with id '{job_id}'!"})
    if not job.done:
        return ProcessedVolumeResponse(
            status=ProcessedVolumeResponseStatus.PENDING, output_files=[]
        )
    if job.error:
        raise HTTPException(500, detail={"error": job.error})

    return ProcessedVolumeResponse(
        status=ProcessedVolumeResponseStatus.FINISHED, output_files=job.result
    )
