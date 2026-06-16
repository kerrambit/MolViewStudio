import { MVSData, type Snapshot } from "molstar/lib/extensions/mvs/mvs-data";
import { type DownloadAsset, type Story, type ViewMetadata } from "./types";
import { ColorT } from "molstar/lib/extensions/mvs/tree/mvs/param-types";
import { convertFileContentToUint8Array } from "./utils";
import { createMVSArchive } from "./mvs";

/**
 * Builds MVS snapshot from a single view.
 * @param view view metada
 * @param urls assets urls
 * @returns snapshot
 */
async function buildMVSSnapshot(
    view: ViewMetadata,
    urls: DownloadAsset[],
): Promise<Snapshot> {
    // Create MVS builder and get current Molstar snapshot.
    const builder = MVSData.createBuilder();

    // Add current background color into MVS.
    if (view.backgroundColor) {
        builder.canvas({
            background_color: view.backgroundColor as ColorT | undefined,
        });
    }

    // Add download nodes with assets.
    for (let i = 0; i < urls.length; ++i) {
        const downloadAsset = urls[i];
        // TODO: this logic below might be needed to seperate, and made more general, we might need "mmcif"/"map"/...?
        builder
            .download({
                url: downloadAsset.relativeUrl,
            })
            .parse({ format: "bcif" })
            .volume({ channel_id: "1" })
            .representation({
                type: "isosurface",
                relative_isovalue: 1.0,
                show_wireframe: false,
                show_faces: true,
            });
    }

    // Include camera and thumbnail.
    if (view.referenceCamera) {
        let cameraParams;
        if (view.thumbnail) {
            cameraParams = {
                position: view.referenceCamera.position as unknown as [
                    number,
                    number,
                    number,
                ],
                target: view.referenceCamera.target as unknown as [
                    number,
                    number,
                    number,
                ],
                up: view.referenceCamera.up as unknown as [
                    number,
                    number,
                    number,
                ],
                custom: {
                    thumbnail: view.thumbnail,
                },
            };
        } else {
            cameraParams = {
                position: view.referenceCamera.position as unknown as [
                    number,
                    number,
                    number,
                ],
                target: view.referenceCamera.target as unknown as [
                    number,
                    number,
                    number,
                ],
                up: view.referenceCamera.up as unknown as [
                    number,
                    number,
                    number,
                ],
            };
        }

        builder.camera(cameraParams);
    }

    // Build the snapshot.
    return builder.getSnapshot({
        title: view.title,
        description: view.description,
        description_format: view.description_format,
        key: view.key,
        linger_duration_ms: view.linger_duration_ms,
        transition_duration_ms: view.transition_duration_ms,
    });
}

/**
 * Creates a MVS from `story`.
 * @param story story
 * @returns `.mvsj` instance if there are no direct assets linked, otherwise it creates an archive (.mvsx)
 */
export async function buildMVS(story: Story): Promise<MVSData | Uint8Array> {
    // Decide if the MVS should be "multiple" or "single".
    let index: MVSData;
    if (Array.isArray(story.views)) {
        // Iterate through all views and build them into Snapshots.
        const snapshots: Snapshot[] = [];
        for (let index = 0; index < story.views.length; index++) {
            const snapshot = await buildMVSSnapshot(
                story.views[index],
                story.localAssets,
            );
            snapshot.root.children?.push();
            snapshots.push(snapshot);
        }

        // Create an index (future index.mvsj) of "multiple" kind.
        index = {
            kind: "multiple",
            metadata: story.metadata,
            snapshots,
        };
    } else {
        // Create an index (future index.mvsj) of "single" kind.
        const snapshot = await buildMVSSnapshot(story.views, story.localAssets);
        index = {
            kind: "single",
            metadata: story.metadata,
            root: snapshot.root,
        };
    }

    // No local assets present.
    if (story.localAssets.length === 0) {
        return index;
    }

    // Create archive (.mvsx).
    return createMVSArchive(index, story.localAssets);
}

/**
 * Prepares data for default single MVS from assets given as `fileData` parameter.
 * @param assets assets with global paths
 * @param processedFilename optional parameter which sets the title property of final MVS to the name of processed file
 * @returns bundle containing array buffer as the content and string extension user should use when saving this bundle
 */
export async function createDefaultMVSFromLocalFiles(
    assets: FileData[],
    processedFilename?: string,
): Promise<{
    data: string | Uint8Array<ArrayBuffer>;
    extension: "mvsx" | "mvsj";
    isBinary: boolean;
}> {
    const story: Story = {
        localAssets: transformFileDataIntoDownloadAssets(assets),
        views: [
            {
                id: crypto.randomUUID(),
                key: undefined,
                title: undefined,
                description: undefined,
                description_format: undefined,
                referenceCamera: undefined,
                backgroundColor: undefined,
                linger_duration_ms: 5000,
                transition_duration_ms: undefined,
            },
        ],
        metadata: {
            title: processedFilename,
            description: undefined,
            description_format: undefined,
            timestamp: Date(),
            version: `${MVSData.SupportedVersion}`,
        },
    };

    const data = await buildMVS(story);
    const isBinary = data instanceof Uint8Array;

    return {
        data: isBinary
            ? (data as any as Uint8Array<ArrayBuffer>)
            : JSON.stringify(data, null, 2),
        extension: isBinary ? "mvsx" : "mvsj",
        isBinary: isBinary,
    };
}

/**
 * Transform `assets` to array of relative urls (it strips the absolute path and extract only the filename) linked with the format (currently supporting only `.cif` and `.bcif`) and content.
 * @param assets assets array (it can be already in relative url form, function is idempotent)
 * @returns array of assets urls, formats and content
 */
function transformFileDataIntoDownloadAssets(
    assets: FileData[],
    prefix?: string,
): DownloadAsset[] {
    // Ensure prefix ends with a slash if it exists and starts with dot and slash, but use forward slashes only.
    const cleanPrefix = prefix
        ? `./${prefix.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "")}/`
        : "./";

    return assets.map((asset) => {
        const filenameWithExtension = asset.name;
        const relativeUrl = `${cleanPrefix}${filenameWithExtension}`;
        return {
            relativeUrl: relativeUrl,
            content: convertFileContentToUint8Array(asset.content),
        };
    });
}
