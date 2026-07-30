from typing import List
from enum import Enum


class Env(Enum):
    DEV = 1
    PROD = 2


class Config:
    env: Env
    port: int
    cors: List[str]

    def __init__(self):
        self.env = Env.DEV
        self.port = 41050
        self.cors = []

    def set(self, env: str, port: int, cors: List[str]):

        env = env.strip().upper()
        if env == "PROD" or env == "PRODUCTION":
            self.env = Env.PROD
        else:
            self.env = Env.DEV

        self.port = port
        self.cors = cors


config = Config()
