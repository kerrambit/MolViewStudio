import uvicorn  # type: ignore
import argparse
from fastapi.middleware.cors import CORSMiddleware  # type: ignore

from server import app
from settings import settings, Settings


def get_cors_origins(settings: Settings):
    origins = ["file://", f"http://localhost:{settings.port}"] + settings.cors
    return origins


def main():
    parser = argparse.ArgumentParser(description="Mol* App Server")

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

    settings.set(args.env, args.port, args.cors)
    reload = args.reload if args.env == "dev" else False

    print(
        f">>> Starting Mol* App Server on <{args.host}:{args.port}> with log level set to <info>."
    )
    print(
        f">>> Other settings: environment: <{settings.env}>, CORS: <{settings.cors}>, reloading: {reload}."
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(settings),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    uvicorn.run(app, host=args.host, port=args.port, reload=reload, log_level="info")


if __name__ == "__main__":
    main()
