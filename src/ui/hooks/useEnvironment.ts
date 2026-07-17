import { useState } from "react";

export function useEnvironment() {
    const [env] = useState<Environment>(window.electron.requestEnvironment());

    return env;
}
