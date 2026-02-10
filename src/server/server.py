from pathlib import Path
from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect, responses  # type: ignore
from result import Ok, Err, Result, is_ok, is_err  # type: ignore
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel  # type: ignore
from typing import Dict
import uuid
from settings import Settings, settings, Env
import json
import shutil

from volsegtools.converter import MapConverter  # type: ignore
from volsegtools.preprocessor import (  # type: ignore
    PreprocessorBuilder,
    Preprocessor,
)
from volsegtools.downsampler import (  # type: ignore
    HierarchyDownsampler,
)
from volsegtools.model.working_store import WorkingStore  # type: ignore

# -------------------------------------


class Blob(BaseModel):
    data: str


# -------------------------------------

disk: Dict[str, Blob] = {}
connections = {}
progress_store = {}

# -------------------------------------


class DownsampledChannels(BaseModel):
    count: int
    method: str


async def _downsample(id: str) -> Result[DownsampledChannels, str]:
    # Here I can call something like molstar.downsample(...). The crucial thing is it needs to return somehow progress.
    for i in range(0, 101):
        await asyncio.sleep(0.1)
        a = np.arange(15).reshape(3, 5)  # Having numpy imported as well.
        progress_store[id] = {"progress": i, "status": f"Processing step {i}"}
        if id in connections:
            await connections[id].send_json(
                {"progress": i, "status": f"Processing step {i}"}
            )
    answer = DownsampledChannels(count=42, method="GPU")
    return Ok(answer)


def write_blob_to_disk(id: str, blob: Blob) -> Result[None, str]:
    disk[id] = blob
    time.sleep(1.5)
    return Ok(None)


def get_blob_from_disk(id: str) -> Result[Blob, str]:
    result = disk.get(id)
    time.sleep(1.5)
    if result is None:
        return Err(f"Blob `{id}` was not found!")
    return Ok(result)


def _process_volume(filepath: str, temporary_directory: str) -> str:

    volume_source = [Path(filepath)]

    overwrite_tmp = True
    rm_tmp = False

    local_store_path = Path(temporary_directory) / "volsegtools_tmp"
    if overwrite_tmp and local_store_path.exists():
        shutil.rmtree(local_store_path)

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
    finally:
        if rm_tmp and local_store_path.exists():
            shutil.rmtree(local_store_path)

    bcif_files = [str(p.absolute()) for p in local_store_path.glob("*.bcif")]
    return json.dumps(bcif_files)


# -------------------------------------

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Mol* App Server is running."}


@app.get("/health")
def health():
    return Response(status_code=200)


@app.put("/downsample/{id}")
async def start_downsample(id: str):

    if id in progress_store and progress_store[id]["progress"] < 100:
        return responses.JSONResponse(
            status_code=201,
            content={
                "message": f"Downsampling started. Track progress at /get_downsample_status/{id}."
            },
        )

    if id in progress_store:
        return responses.JSONResponse(
            status_code=200,
            content={
                "message": f"Downsampling finished, to see results, use /get_downsample_status/{id}. To downsample this blob again, use /restart_downsample/{id} and then /downsample{id}.",
            },
        )

    progress_store[id] = {"progress": 0, "status": "Started"}

    async def run():
        result = await _downsample(id)
        if is_ok(result):
            progress_store[id] = {
                "progress": 100,
                "status": "Completed",
                "count": result.unwrap().count,
                "method": result.unwrap().method,
            }
        else:
            progress_store[id] = {
                "progress": 0,
                "status": f"Failed: {result.unwrap_err()}",
            }
        connections.pop(id, None)

    asyncio.create_task(run())
    return responses.JSONResponse(
        status_code=201,
        content={
            "message": f"Downsampling started. Track progress at /get_downsample_status/{id}"
        },
    )


@app.get("/get_downsample_status/{id}")
async def get_downsample_status(id: str):
    return progress_store.get(id, {"progress": 0, "status": "Not started"})


@app.websocket("/ws/progress/{id}")
async def websocket_progress(websocket: WebSocket, id: str):
    await websocket.accept()
    connections[id] = websocket
    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    except asyncio.CancelledError:
        pass
    finally:
        connections.pop(id, None)


class PostBlobInput(BaseModel):
    blob: Blob


@app.post("/create_blob")
async def create_blob(input: PostBlobInput):
    id = str(uuid.uuid5(uuid.NAMESPACE_X500, "Mol* App Server"))
    loop = asyncio.get_running_loop()
    result: Result[None, str] = await loop.run_in_executor(
        None, write_blob_to_disk, id, input.blob
    )
    if is_ok(result):
        return {"success": "true", "id": id}
    else:
        return {"success": "false", "message": result.err_value}


@app.get("/get_blob/{id}")
async def get_blob(id: str):
    loop = asyncio.get_running_loop()
    result: Result[Blob, str] = await loop.run_in_executor(None, get_blob_from_disk, id)
    if is_ok(result):
        return {
            "success": "true",
            "length": len(result.ok_value.data),
            "raw": result.ok_value.data,
        }
    else:
        return {"success": "false", "message": result.err_value}


class VolumeRequest(BaseModel):
    filepath: str
    temporary_directory: str


@app.post("/process_volume")
def process_volume(request: VolumeRequest):
    print("Process volume...")
    print(f"Filepath: {request.filepath}")
    print(f"Temp Dir: {request.temporary_directory}")
    output = _process_volume(request.filepath, request.temporary_directory)
    print("Volume has been processed.")
    return {"output_files": output}
