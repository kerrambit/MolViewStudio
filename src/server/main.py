#
# Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
#
# @author Marek Eibel
#

import uvicorn
import argparse
from fastapi.middleware.cors import CORSMiddleware

from server.app.app import app
from server.app.config import config, Config


def get_cors_origins(settings: Config):
    origins = ["file://", f"http://localhost:{settings.port}"] + settings.cors
    return origins


def main():
    parser = argparse.ArgumentParser(description="MolView Studio Server")

    parser.add_argument(
        "--host", default="localhost", help="Host to bind to (default: localhost)"
    )
    parser.add_argument(
        "--port", type=int, default=41050, help="Port to bind to (default: 41050)"
    )
    parser.add_argument(
        "--env",
        type=str,
        default="dev",
        help="Run server in given mode: development or production",
    )
    parser.add_argument(
        "--cors",
        nargs="*",
        default=[],
        help="Allowed origins for CORS (space-separated)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=False,
        help="Enable auto-reload for development",
    )

    args = parser.parse_args()

    config.set(args.env, args.port, args.cors)
    reload = args.reload if args.env == "dev" else False

    print(
        f">>> Starting MolView Studio Server on <{args.host}:{args.port}> with log level set to <info>."
    )
    print(
        f">>> Other settings: environment: <{config.env}>, CORS: <{config.cors}>, reloading: {reload}."
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(config),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    uvicorn.run(app, host=args.host, port=args.port, reload=reload, log_level="info")


if __name__ == "__main__":
    main()
