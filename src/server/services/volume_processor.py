#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

import asyncio
import shutil
from pathlib import Path
from typing import List

import volsegtools

from server.models.volume import (
    DownsamplignAlgorithmKind,
    ProcessVolumeProgressMessage,
    SerializerKind,
    BundlingKind,
)
from server.services.jobs_manager import ProcessVolumeJob


class Preprocessor:
    OVERWRITE_TMP = True
    RM_TMP = False

    @staticmethod
    def get_serializer(kind: SerializerKind):
        match kind:
            case SerializerKind.BCIF:
                return volsegtools.BCIFSerializer()
            case SerializerKind.MRC:
                return volsegtools.MRCSerializer()
            case SerializerKind.OBJ:
                return volsegtools.OBJSerializer()
            case SerializerKind.PLY:
                return volsegtools.PLYSerializer()
            case SerializerKind.STL:
                return volsegtools.STLSerializer()
            case _:
                raise RuntimeError("Unknown kind encountered")

    @staticmethod
    def get_downsampling_strategy(kind: DownsamplignAlgorithmKind):
        match kind:
            case DownsamplignAlgorithmKind.NEAREST_NEIGHBOR:
                return volsegtools.NearestNeighbor()
            case DownsamplignAlgorithmKind.MAX:
                return volsegtools.MaxPooling()
            case DownsamplignAlgorithmKind.MIN:
                return volsegtools.MinPooling()
            case DownsamplignAlgorithmKind.AVG:
                return volsegtools.AveragePooling()
            case DownsamplignAlgorithmKind.TRILINEAR:
                return volsegtools.TrilinearInterpolation()
            case DownsamplignAlgorithmKind.TRICUBIC:
                return volsegtools.TricubicInterpolation()
            case DownsamplignAlgorithmKind.TRIQUINTIC:
                return volsegtools.TriquinticInterpolation()
            case DownsamplignAlgorithmKind.TRIQUINTIC_NO_SMOOTH:
                return volsegtools.TriquinticInterpolation()
            case DownsamplignAlgorithmKind.SMOOTHING:
                return volsegtools.Smoothing()
            case DownsamplignAlgorithmKind.STRIDED_SMOOTHING:
                return volsegtools.StridedSmoothing(volsegtools.Gaussian3DKernel(5, 1))
            case DownsamplignAlgorithmKind.SEPARATED_SMOOTHING:
                return volsegtools.SeparatedSmoothing(5, 1)
            case DownsamplignAlgorithmKind.NULL:
                return volsegtools.Null()
            case _:
                return volsegtools.Null()

    @staticmethod
    async def process_volume(
        job: ProcessVolumeJob,
        temporary_directory: str,
        volume_filepaths: List[str],
        downsampling_strategy: DownsamplignAlgorithmKind,
        volume_serializer: SerializerKind,
        segmentations_filepaths: List[str],
        segmentation_mask_serializer: SerializerKind,
        segmentation_volume_serializer: SerializerKind,
        segmentation_mesh_serializer: SerializerKind,
        bundling_approach: BundlingKind,
    ):
        local_store_path = Path(temporary_directory) / job.id / "RawData"
        output_path = Path(temporary_directory) / job.id / "Output"

        try:
            volume_source: List[Path] = [Path(path) for path in volume_filepaths]
            segmentation_source: List[Path] = [
                Path(path) for path in segmentations_filepaths
            ]

            if Preprocessor.OVERWRITE_TMP and local_store_path.exists():
                shutil.rmtree(local_store_path, ignore_errors=True)

            local_store_path.mkdir(parents=True, exist_ok=True)
            output_path.mkdir(parents=True, exist_ok=True)

            builder = volsegtools.create_builder()
            (
                builder.add_volume_converter(volsegtools.MRCConverter())
                .add_volume_converter(volsegtools.TIFFConverter())
                .add_volume_converter(volsegtools.NGFFConverter())
                .add_volume_converter(volsegtools.ImarisConverter())
                .add_volume_converter(volsegtools.CIFConverter())
                .add_segmentation_converter(volsegtools.MeshConverter())
                .add_segmentation_converter(volsegtools.NiiConverter())
                .add_segmentation_converter(volsegtools.MRCConverter())
                .add_segmentation_converter(volsegtools.SFFConverter())
                .add_segmentation_converter(volsegtools.VRMLConverter())
                .add_segmentation_converter(volsegtools.CIFConverter())
                .set_downsampling_strategy(
                    Preprocessor.get_downsampling_strategy(downsampling_strategy)
                )
                .set_serializer(
                    volsegtools.DataKind.VOLUME,
                    Preprocessor.get_serializer(volume_serializer),
                )
                .set_serializer(
                    volsegtools.DataKind.SEGMENTATION_MASK,
                    Preprocessor.get_serializer(segmentation_mask_serializer),
                )
                .set_serializer(
                    volsegtools.DataKind.SEGMENTATION_VOLUME,
                    Preprocessor.get_serializer(segmentation_volume_serializer),
                )
                .set_serializer(
                    volsegtools.DataKind.SEGMENTATION_MESH,
                    Preprocessor.get_serializer(segmentation_mesh_serializer),
                )
                .set_output_dir(output_path)
            )

            builder.set_work_dir(local_store_path)

            match bundling_approach:
                case BundlingKind.MVXS:
                    builder.set_bundler(volsegtools.MVSXBundler())
                case BundlingKind.RESOLUTION_ZIP:
                    builder.set_bundler(volsegtools.ResolutionZipBundler())
                case BundlingKind.ZIP:
                    builder.set_bundler(volsegtools.ZipBundler())

            if downsampling_strategy == DownsamplignAlgorithmKind.TRIQUINTIC:
                builder.add_post_process_step(volsegtools.SmoothingStep())

            loop = asyncio.get_event_loop()

            def update_status(state):
                loop.call_soon_threadsafe(
                    job.queue.put_nowait,
                    ProcessVolumeProgressMessage(stage=state.stage),
                )

            def run_pipeline_blocking():
                pipeline: volsegtools.ProcessingPipeline = builder.build()
                pipeline.add_state_change_callback(update_status)
                return pipeline.sync_process(
                    volumes=volume_source, segmentations=segmentation_source
                )

            result = await loop.run_in_executor(None, run_pipeline_blocking)
            job.result = list(map(str, result))

        except Exception as err:
            job.error = str(err)

        finally:
            try:
                volsegtools.Timer.pop_stage()
            except Exception as e:
                print(f"Timer pop warning: {e}")

            if Preprocessor.RM_TMP and local_store_path.exists():
                shutil.rmtree(local_store_path, ignore_errors=True)

            job.done = True

            await job.queue.put(
                ProcessVolumeProgressMessage(
                    stage="done", error=job.error, result=job.result
                )
            )
ob.result
                )
            )
