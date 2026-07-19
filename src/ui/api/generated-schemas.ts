import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const VolumeRequest = z
  .object({ filepath: z.string(), temporary_directory: z.string() })
  .passthrough();
const ProcessedVolumeResponse = z
  .object({ output_files: z.array(z.string()) })
  .passthrough();
const ValidationError = z
  .object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string(),
    input: z.unknown().optional(),
    ctx: z.object({}).partial().passthrough().optional(),
  })
  .passthrough();
const HTTPValidationError = z
  .object({ detail: z.array(ValidationError) })
  .partial()
  .passthrough();
const ErrorDetail = z.object({ error: z.string() }).passthrough();
const ProcessVolumeError = z.object({ detail: ErrorDetail }).passthrough();

export const schemas = {
  VolumeRequest,
  ProcessedVolumeResponse,
  ValidationError,
  HTTPValidationError,
  ErrorDetail,
  ProcessVolumeError,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/health",
    alias: "health",
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "post",
    path: "/process_volume",
    alias: "processVolume",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VolumeRequest,
      },
    ],
    response: ProcessedVolumeResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
      {
        status: 500,
        description: `Processing failed.`,
        schema: ProcessVolumeError,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
