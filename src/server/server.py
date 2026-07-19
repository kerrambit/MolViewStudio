from typing import List
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from result import Ok, Err, Result, is_ok
from fastapi import FastAPI, Response, HTTPException
from volsegtools.converter import MapConverter
from volsegtools.preprocessor import PreprocessorBuilder, Preprocessor
from volsegtools.downsampler import HierarchyDownsampler
from volsegtools.model.working_store import WorkingStore


def _process_volume(filepath: str, temporary_directory: str) -> Result[List[str], str]:

    volume_source = [Path(filepath)]

    overwrite_tmp = True
    rm_tmp = False
    local_store_path = Path(temporary_directory)

    if overwrite_tmp and local_store_path.exists():
        shutil.rmtree(local_store_path)

    local_store_path.mkdir(parents=True, exist_ok=True)

    working_store = WorkingStore(local_store_path)  # TODO: temporary hack

    builder = PreprocessorBuilder()
    builder.set_converter(MapConverter())
    builder.set_downsampler(HierarchyDownsampler())

    for file in volume_source:
        builder.add_volume_src_file(file)

    builder.set_output_dir(local_store_path)

    try:
        preprocessor: Preprocessor = builder.build()
        preprocessor.sync_preprocess()
    except Exception as e:
        return Err(f"{str(e)}")
    finally:
        if rm_tmp and local_store_path.exists():
            shutil.rmtree(local_store_path)

    return Ok([str(p.absolute()) for p in local_store_path.glob("*.bcif")])


# -----------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    error: str


app = FastAPI()


@app.get("/health", operation_id="health")
def health():
    return Response(status_code=200)


class VolumeRequest(BaseModel):
    filepath: str
    temporary_directory: str
    

class ProcessedVolumeResponse(BaseModel):
    output_files: List[str]
    

class ProcessVolumeError(BaseModel):
    detail: ErrorDetail


@app.post(
    "/process_volume",
    operation_id="processVolume",
    response_model=ProcessedVolumeResponse,
    responses={
        500: {"model": ProcessVolumeError, "description": "Processing failed."},
    },
)
def process_volume(request: VolumeRequest) -> ProcessedVolumeResponse:
    result = _process_volume(request.filepath, request.temporary_directory)

    if is_ok(result):
        return ProcessedVolumeResponse(output_files=result.ok_value)

    raise HTTPException(
        status_code=500,
        detail={
            "error": result.err_value,
        },
    )
