/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

type Success<T> = {
    success: true;
    value: T;
};

type Failure = {
    success: false;
    error: Error;
};

export type Result<T> = Success<T> | Failure;
