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
