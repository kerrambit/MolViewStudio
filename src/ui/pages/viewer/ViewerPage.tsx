/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ViewerEditor } from "../../features/viewer/components/ViewerEditor";

import "./ViewerPage.css";

export default function ViewerPage() {
    return (
        <div className="viewer">
            <ViewerEditor />
        </div>
    );
}
