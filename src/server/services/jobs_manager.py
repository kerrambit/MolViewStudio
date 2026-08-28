#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

import asyncio
from typing import List, Optional
from uuid import uuid4

from server.models.volume import ProcessVolumeProgressMessage


class ProcessVolumeJob:
    def __init__(self):
        self.id: str = str(uuid4())
        self.queue: asyncio.Queue[ProcessVolumeProgressMessage] = asyncio.Queue()
        self.result: Optional[List[str]] = None
        self.error: Optional[str] = None
        self.done: bool = False


class JobsManager:
    def __init__(self):
        self.jobs: dict[str, ProcessVolumeJob] = {}

    def set_job(self, id: str, job: ProcessVolumeJob):
        self.jobs[id] = job

    def get_job(self, id: str) -> ProcessVolumeJob | None:
        return self.jobs.get(id)

    def remove_job(self, id: str):
        self.jobs.pop(id, None)


__instance = JobsManager()


def get_instance():
    return __instance
