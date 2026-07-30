import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const DownsamplignAlgorithmKind = z.enum([
  "nearest",
  "max",
  "min",
  "avg",
  "trilinear",
  "tricubic",
  "triquintic",
  "triquintic_no_smooth",
  "smoothing",
  "strided_smoothing",
  "separated_smoothing",
  "null",
]);
const SerializerKind = z.enum(["bcif", "mrc", "obj", "ply", "stl"]);
const BundlingKind = z.enum(["null", "mvsx", "resolution_zip", "zip"]);
const ProcessVolumeRequest = z
  .object({
    temporary_directory: z.string(),
    volume_filepaths: z.array(z.string()),
    segmentations_filepaths: z.array(z.string()),
    downsampling_strategy: DownsamplignAlgorithmKind,
    volume_serializer: SerializerKind,
    segmentation_mask_serializer: SerializerKind,
    segmentation_volume_serializer: SerializerKind,
    segmentation_mesh_serializer: SerializerKind,
    bundling_approach: BundlingKind,
  })
  .passthrough();
const ProcessVolumeResponse = z
  .object({
    job_id: z.string(),
    websocket_url: z.string(),
    result_url: z.string(),
  })
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
const ProcessedVolumeResponseStatus = z.enum(["finished", "pending"]);
const ProcessedVolumeResponse = z
  .object({
    status: ProcessedVolumeResponseStatus,
    output_files: z.array(z.string()),
  })
  .passthrough();
const ErrorDetail = z.object({ error: z.string() }).passthrough();
const ProcessVolumeError = z.object({ detail: ErrorDetail }).passthrough();

export const schemas = {
  DownsamplignAlgorithmKind,
  SerializerKind,
  BundlingKind,
  ProcessVolumeRequest,
  ProcessVolumeResponse,
  ValidationError,
  HTTPValidationError,
  ProcessedVolumeResponseStatus,
  ProcessedVolumeResponse,
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
        schema: ProcessVolumeRequest,
      },
    ],
    response: ProcessVolumeResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/process_volume/:job_id/result",
    alias: "getProcessedVolumeResult",
    requestFormat: "json",
    parameters: [
      {
        name: "job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProcessedVolumeResponse,
    errors: [
      {
        status: 404,
        description: `Job was not found!`,
        schema: ProcessVolumeError,
      },
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
      {
        status: 500,
        description: `Processing failed!`,
        schema: ProcessVolumeError,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
