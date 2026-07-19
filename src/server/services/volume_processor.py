from typing import List
import shutil
from pathlib import Path
from result import Ok, Err, Result

from volsegtools.converter import MapConverter
from volsegtools.preprocessor import PreprocessorBuilder, Preprocessor
from volsegtools.downsampler import HierarchyDownsampler
from volsegtools.model.working_store import WorkingStore

class VolumeProcessor:
    
    @staticmethod
    def process_volume(filepath: str, temporary_directory: str) -> Result[List[str], str]:

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