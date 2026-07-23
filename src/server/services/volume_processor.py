import enum
from typing import List
import shutil
from pathlib import Path
from result import Ok, Err, Result

import volsegtools

class Preprocessor:
    OVERWRITE_TMP = True
    RM_TMP = False
    
    class SerializerKind(enum.StrEnum):
        BCIF = "bcif"
        MRC = "mrc"
        OBJ = "obj"
        PLY = "ply"
        STL = "stl"


    @staticmethod
    def get_serializer(kind: SerializerKind):
        match kind:
            case Preprocessor.SerializerKind.BCIF:
                return volsegtools.BCIFSerializer()
            case Preprocessor.SerializerKind.MRC:
                return volsegtools.MRCSerializer()
            case Preprocessor.SerializerKind.OBJ:
                return volsegtools.OBJSerializer()
            case Preprocessor.SerializerKind.PLY:
                return volsegtools.PLYSerializer()
            case Preprocessor.SerializerKind.STL:
                return volsegtools.STLSerializer()
            case _:
                raise RuntimeError("Unknown kind encountered")
    
    
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
    
    
    @staticmethod
    def get_downsampling_strategy(kind: DownsamplignAlgorithmKind):
        match kind:
            case Preprocessor.DownsamplignAlgorithmKind.NEAREST_NEIGHBOR:
                return volsegtools.NearestNeighborDownsamplingStrategy()
            case Preprocessor.DownsamplignAlgorithmKind.MAX:
                return volsegtools.MaxPoolingStrategy()
            case Preprocessor.DownsamplignAlgorithmKind.MIN:
                return volsegtools.MinPoolingStrategy()
            case Preprocessor.DownsamplignAlgorithmKind.AVG:
                return volsegtools.AveragePoolingStrategy()
            case Preprocessor.DownsamplignAlgorithmKind.TRILINEAR:
                return volsegtools.TrilinearInterpolation()
            case Preprocessor.DownsamplignAlgorithmKind.TRICUBIC:
                return volsegtools.TricubicInterpolation()
            case Preprocessor.DownsamplignAlgorithmKind.TRIQUINTIC:
                return volsegtools.TriquinticInterpolation()
            case Preprocessor.DownsamplignAlgorithmKind.TRIQUINTIC_NO_SMOOTH:
                return volsegtools.TriquinticInterpolation()
            case Preprocessor.DownsamplignAlgorithmKind.SMOOTHING:
                return volsegtools.HierarchyDownsamplingStrategy()
            case Preprocessor.DownsamplignAlgorithmKind.STRIDED_SMOOTHING:
                return volsegtools.StridedSmoothing(volsegtools.Gaussian3DKernel(5, 1))
            case Preprocessor.DownsamplignAlgorithmKind.SEPARATED_SMOOTHING:
                return volsegtools.SeparableSmoothing(5, 1)
            case Preprocessor.DownsamplignAlgorithmKind.NULL:
                return volsegtools.NullDownsamplingStrategy()
            case _:
                return volsegtools.NullDownsamplingStrategy()
            
            
    class BundlingKind(enum.StrEnum):
        NULL = "null"
        MVXS = "mvsx"
        RESOLUTION_ZIP = "resolution_zip"
        ZIP = "zip"
    
    
    @staticmethod
    def process_volume(filepath: str, temporary_directory: str) -> Result[List[str], str]:

        volume_source = [Path(filepath)]
        strategy = "tricubic"
        volume_serializer = "mrc"
        segmentation_mask_serializer = "mrc"
        segmentation_volume_serializer = "mrc"
        segmentation_mesh_serializer = "mrc"
        bundling_approach = "null"

        local_store_path = (Path(temporary_directory) / "volsegtools_workdir")
        if Preprocessor.OVERWRITE_TMP and local_store_path.exists():
            shutil.rmtree(local_store_path)
            
        output_path = Path(temporary_directory) / "volsegtools_output"

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
            .set_downsampling_strategy(Preprocessor.get_downsampling_strategy(strategy))
            .set_serializer(volsegtools.DataKind.VOLUME, Preprocessor.get_serializer(volume_serializer))
            .set_serializer(
                volsegtools.DataKind.SEGMENTATION_MASK, Preprocessor.get_serializer(segmentation_mask_serializer)
            )
            .set_serializer(
                volsegtools.DataKind.SEGMENTATION_VOLUME, Preprocessor.get_serializer(segmentation_volume_serializer)
            )
            .set_serializer(
                volsegtools.DataKind.SEGMENTATION_MESH, Preprocessor.get_serializer(segmentation_mesh_serializer)
            )
            .set_output_dir(output_path)
        )

        try:
            builder.set_work_dir(local_store_path)
        except RuntimeError as err:
            return Err(str(err))

        match bundling_approach:
            case Preprocessor.BundlingKind.MVXS:
                builder.set_bundler(volsegtools.MVSXBundler())
            case Preprocessor.BundlingKind.RESOLUTION_ZIP:
                builder.set_bundler(volsegtools.ResolutionZipBundler())
            case Preprocessor.BundlingKind.ZIP:
                builder.set_bundler(volsegtools.ZipBundler())

        if strategy == Preprocessor.DownsamplignAlgorithmKind.TRIQUINTIC:
            builder.add_post_process_step(volsegtools.SmoothingStep())

        def update_status(state):
            print(
                ">>> Processing... {} ".format(
                    state.current_stage,
                )
            )

        output_files: List[str] = []
        try:
            pipeline: volsegtools.ProcessingPipeline = builder.build()
            pipeline.add_state_change_callback(update_status)
            result = pipeline.sync_process(volumes=volume_source, segmentations=[])
            output_files = list(map(str, result))
            volsegtools.Timer.pop_stage()
        except volsegtools.UnsupportedCompressionError as err:
            return Err(str(err))
        finally:
            if Preprocessor.RM_TMP and local_store_path.exists():
                shutil.rmtree(local_store_path)

        return Ok(output_files)
