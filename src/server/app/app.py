#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

from fastapi import FastAPI

from server.api.routes import health, process_volume

app = FastAPI()
app.include_router(health.router)
app.include_router(process_volume.router)
