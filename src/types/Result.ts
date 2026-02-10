type Success<T> = {
    success: true;
    value: T;
};

type Failure = {
    success: false;
    error: Error;
};

export type Result<T> = Success<T> | Failure;
