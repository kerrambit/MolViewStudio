import enum
from pydantic import BaseModel
from typing import List, Optional

from server.core.errors import ErrorDetail


class DownsamplignAlgorithmKind(enum.StrEnum):
    NEAREST_NEIGHBOR = "nearest"
    MAX = "max"
    MIN = "min"
    AVG = "avg"
    TRILINEAR = "trilinear"
    TRICUBIC = "tricubic"
    TRIQUINTIC = "triquintic"
    TRIQUINTIC_NO_SMOOTH = "triquintic_no_smooth"
    SMOOTHING = "smoothing"
    STRIDED_SMOOTHING = "strided_smoothing"
    SEPARATED_SMOOTHING = "separated_smoothing"
    NULL = "null"


class SerializerKind(enum.StrEnum):
    BCIF = "bcif"
    MRC = "mrc"
    OBJ = "obj"
    PLY = "ply"
    STL = "stl"


class BundlingKind(enum.StrEnum):
    NULL = "null"
    MVXS = "mvsx"
    RESOLUTION_ZIP = "resolution_zip"
    ZIP = "zip"


class ProcessVolumeRequest(BaseModel):
    temporary_directory: str
    volume_filepaths: List[str]
    segmentations_filepaths: List[str]
    downsampling_strategy: DownsamplignAlgorithmKind
    volume_serializer: SerializerKind
    segmentation_mask_serializer: SerializerKind
    segmentation_volume_serializer: SerializerKind
    segmentation_mesh_serializer: SerializerKind
    bundling_approach: BundlingKind


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
