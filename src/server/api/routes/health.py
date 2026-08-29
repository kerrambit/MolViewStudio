#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

from fastapi import APIRouter, Response

router = APIRouter()


@router.get("/health", operation_id="health")
def health():
    return Response(status_code=200)
