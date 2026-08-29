#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    error: str
