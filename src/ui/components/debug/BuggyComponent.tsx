/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";

/**
 * Dev-only component to simulate error.
 */
const BuggyComponent = () => {
    const [crash, setCrash] = useState(false);

    if (crash) {
        throw new Error("I crashed deliberately!");
    }

    return (
        <button onClick={() => setCrash(true)}>
            Click me to simulate a crash!
        </button>
    );
};

export default BuggyComponent;
