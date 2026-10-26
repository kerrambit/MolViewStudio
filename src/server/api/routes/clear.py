#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

# TODO: this file is temporary code, that's why it contains a few code smells. However, the purpose is clear, make API endpoint so UI can safely clear potentialy huge Processing folder on request.

import os
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

# Created by the code that creates the Processing folder.
MARKER = ".volsegstudio-processing"


class CleanupRequest(BaseModel):
    path: str = Field(..., description="Full path of the directory to clear")
    remove_directory: bool = Field(
        False,
        description="Also remove the directory itself (not allowed for the Processing root)",
    )
    dry_run: bool = Field(False, description="Only report what would be deleted")


class CleanupResponse(BaseModel):
    path: str
    dry_run: bool
    files_found: int
    bytes_found: int
    files_deleted: int
    bytes_freed: int
    errors: list[str]


class PartialDeleteError(OSError):
    def __init__(self, files: int, size: int):
        super().__init__("partially deleted, some files are locked or in use")
        self.files = files
        self.size = size


def find_marked_root(target: Path) -> Path | None:
    """Walk up from target; the first folder containing the marker is the root."""
    for p in (target, *target.parents):
        if (p / MARKER).is_file():
            return p
    return None


def _scan(directory: Path, skip_top_level: str | None = None) -> tuple[int, int]:
    """Count files and total bytes under directory. Symlinks are not followed."""
    files = 0
    total = 0
    for dirpath, _dirs, filenames in os.walk(directory, followlinks=False):
        at_top = Path(dirpath) == directory
        for name in filenames:
            if at_top and name == skip_top_level:
                continue
            try:
                total += os.lstat(os.path.join(dirpath, name)).st_size
                files += 1
            except OSError:
                pass
    return files, total


def _delete_entry(entry: os.DirEntry) -> tuple[int, int]:
    """Delete one entry, return (files_deleted, bytes_freed). Raises OSError on failure."""
    if entry.is_symlink() or entry.is_file(follow_symlinks=False):
        size = entry.stat(follow_symlinks=False).st_size
        os.unlink(entry.path)  # For symlinks this removes only the link.
        return 1, size

    path = Path(entry.path)
    f_before, b_before = _scan(path)
    try:
        shutil.rmtree(path)
    except OSError:
        # Partially deleted (e.g. locked file on Windows): count what is really gone.
        f_left, b_left = _scan(path) if path.exists() else (0, 0)
        raise PartialDeleteError(f_before - f_left, b_before - b_left)
    return f_before, b_before


@router.post("/cleanup", response_model=CleanupResponse, operation_id="cleanup")
def cleanup(req: CleanupRequest):
    requested = Path(req.path)

    if requested.is_symlink():
        raise HTTPException(status_code=400, detail="Path must not be a symlink")

    try:
        target = requested.resolve(strict=True)
    except OSError:
        raise HTTPException(status_code=404, detail="Directory does not exist")

    if not target.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    # Safety: target must be inside (or be) a folder carrying the marker file!
    root = find_marked_root(target)
    if root is None:
        raise HTTPException(
            status_code=403,
            detail="Not a Processing directory (marker file missing)",
        )

    if req.remove_directory and target == root:
        raise HTTPException(
            status_code=400, detail="The Processing root itself cannot be removed"
        )

    # The marker is never counted or deleted.
    files_found, bytes_found = _scan(target, skip_top_level=MARKER)

    if req.dry_run:
        return CleanupResponse(
            path=str(target),
            dry_run=True,
            files_found=files_found,
            bytes_found=bytes_found,
            files_deleted=0,
            bytes_freed=0,
            errors=[],
        )

    errors: list[str] = []
    files_deleted = 0
    bytes_freed = 0

    for entry in os.scandir(target):
        if target == root and entry.name == MARKER:
            continue
        try:
            f, b = _delete_entry(entry)
            files_deleted += f
            bytes_freed += b
        except PartialDeleteError as e:
            files_deleted += e.files
            bytes_freed += e.size
            errors.append(f"{entry.name}: {e}")
        except OSError as e:
            errors.append(f"{entry.name}: {e}")

    if req.remove_directory and not errors:
        try:
            target.rmdir()
        except OSError as e:
            errors.append(f"{target.name}: {e}")

    return CleanupResponse(
        path=str(target),
        dry_run=False,
        files_found=files_found,
        bytes_found=bytes_found,
        files_deleted=files_deleted,
        bytes_freed=bytes_freed,
        errors=errors,
    )
