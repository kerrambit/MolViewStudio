import { useNavigate } from "react-router-dom";
import { useRegime, type Regime } from "../services/RegimeProvider";
import {
    MVSFilters,
    StructuralFilters,
    VolumeFilters,
} from "../../types/fileFilters";
import { loggerUi } from "../utils/loggerUi";
import { pushErrorNotification } from "../services/NotificationService";

export function useFileManagement() {
    const navigate = useNavigate();
    const { setRegime } = useRegime();

    const loadAndHandleFile = async (regimeKind: "processing" | "viewing") => {
        window.electron
            .openFileExplorer(
                false,
                regimeKind === "processing"
                    ? [VolumeFilters]
                    : [MVSFilters, StructuralFilters],
            )
            .then((fileData) => {
                if (!(fileData instanceof Error)) {
                    if (fileData.length > 0) {
                        loggerUi.info(
                            `File <${fileData[0].path}> was selected.`,
                        );

                        let regime: Regime;
                        if (regimeKind === "processing") {
                            regime = {
                                kind: "processing",
                                fileToProcess: fileData[0],
                            };
                        } else {
                            regime = {
                                kind: "staging",
                                fileToView: fileData[0],
                            };
                        }

                        setRegime(regime);
                        navigate("/viewer");
                    }
                } else {
                    loggerUi.error(`Error occured: <${fileData.message}>!`);
                    pushErrorNotification(
                        `Error occured! Details: {${fileData.message}}.`,
                    );
                }
            })
            .catch((error) => {
                pushErrorNotification(`Error occured! Details: {${error}}.`);
                loggerUi.error(`Error occured: <${error}>!`);
            });
    };

    return { loadAndHandleFile };
}
