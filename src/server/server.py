from typing import List
from pydantic import BaseModel  # type: ignore
import os
import shutil
from pathlib import Path
from result import Ok, Err, Result, is_ok  # type: ignore
from fastapi import FastAPI, Response, HTTPException  # type: ignore
from volsegtools.converter import MapConverter  # type: ignore
from volsegtools.preprocessor import PreprocessorBuilder, Preprocessor  # type: ignore
from volsegtools.downsampler import HierarchyDownsampler  # type: ignore
from volsegtools.model.working_store import WorkingStore  # type: ignore


def _process_volume(filepath: str, temporary_directory: str) -> Result[List[str], str]:

    volume_source = [Path(filepath)]

    overwrite_tmp = True
    rm_tmp = False
    local_store_path = Path(temporary_directory)

    if overwrite_tmp and local_store_path.exists():
        shutil.rmtree(local_store_path)

    local_store_path.mkdir(parents=True, exist_ok=True)

    original_cwd = (
        os.getcwd()
    )  # TODO: this is a fix before releasing of volsegtools 0.0.3
    os.chdir(
        temporary_directory
    )  # TODO: this is a fix before releasing of volsegtools 0.0.3

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
        os.chdir(
            original_cwd
        )  # TODO: this is a fix before releasing of volsegtools 0.0.3
        if rm_tmp and local_store_path.exists():
            shutil.rmtree(local_store_path)

    return Ok([str(p.absolute()) for p in local_store_path.glob("*.bcif")])


# -----------------------------------------------------------------------------


app = FastAPI()


@app.get("/")
def root():
    return health()


@app.get("/health")
def health():
    return Response(status_code=200)


class VolumeRequest(BaseModel):
    filepath: str
    temporary_directory: str


@app.post("/process_volume")
def process_volume(request: VolumeRequest):
    result = _process_volume(request.filepath, request.temporary_directory)

    if is_ok(result):
        return {"output_files": result.ok_value}

    raise HTTPException(
        status_code=500,
        detail={
            "error": result.err_value,
        },
    )
