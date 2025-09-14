import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { StructureElement } from "molstar/lib/mol-model/structure";
import { ButtonsType } from "molstar/lib/mol-util/input/input-observer";
import { Asset } from "molstar/lib/mol-util/assets";
import { PluginState } from "molstar/lib/mol-plugin/state";

interface MolstarProps {
    showControls: boolean;
    isExpanded: boolean;
}

let molstar: PluginUIContext | undefined;

export async function initMolstar(
    container: HTMLDivElement,
    props: MolstarProps
) {
    if (molstar) return molstar;

    molstar = await createPluginUI({
        target: container,
        render: renderReact18,
        spec: {
            layout: {
                initial: {
                    regionState: {
                        bottom: "hidden",
                        left: "hidden",
                        right: "hidden",
                        top: "hidden",
                    },
                    showControls: props.showControls,
                    isExpanded: props.isExpanded,
                },
            },
            behaviors: [...DefaultPluginUISpec().behaviors],
        },
    });

    molstar.behaviors.interaction.click.subscribe(
        ({ current, button /*, modifiers*/ }) => {
            if (!current.loci) return;

            if (button === ButtonsType.Flag.Secondary) {
            }

            if (StructureElement.Loci.is(current.loci)) {
                const location = StructureElement.Loci.getFirstLocation(
                    current.loci
                );
                if (location) {
                    const element = location.unit.model.atomicHierarchy.atoms;
                    const name = element.type_symbol.value(0);
                    console.log(`Clicked on element: ${name}.`);
                }
            }
        }
    );

    // molstar.behaviors.interaction.hover.subscribe(({ current }) => {});

    if (snapshot) {
        molstar.state.setSnapshot(snapshot);
    }

    return molstar;
}

export function getSnapshot() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    return molstar.state.getSnapshot();
}

export function disposeMolstar() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    molstar?.dispose();
    molstar = undefined;
}

export async function clearViewer() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    await molstar.clear();
}

export async function loadDefaultPbdStructure() {
    if (!molstar) throw new Error("Molstar is not initialized!");

    await clearViewer();

    const data = await molstar.builders.data.download(
        { url: "https://files.rcsb.org/download/3PTB.pdb" },
        { state: { isGhost: true } }
    );

    const trajectory = await molstar.builders.structure.parseTrajectory(
        data,
        "pdb"
    );
    const preset = await molstar.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default"
    );

    return preset;
}

export async function loadStructureFromFile(fileData: FileData | null) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    if (!fileData) return false;

    await molstar.clear();

    const file = new File([fileData.content], fileData.name);
    const assetFile = Asset.File(file);

    try {
        const fileResult = await molstar.builders.data.readFile({
            file: assetFile,
            isBinary: fileData.binary,
        });

        const trajectory = await molstar.builders.structure.parseTrajectory(
            fileResult.data,
            fileData.extension as any
        );

        await molstar.builders.structure.hierarchy.applyPreset(
            trajectory,
            "default"
        );
    } catch (error) {
        return false; // TODO: log error
    }

    return true;
}
