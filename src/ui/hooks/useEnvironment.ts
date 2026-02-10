import { useState } from "react";

export function useEnvironment() {
    const [env, _] = useState<Environment>(
        window.electron.requestEnvironment(),
    );

    return env;
}
