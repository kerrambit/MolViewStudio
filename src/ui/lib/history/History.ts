/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

export class History<T> {
    private readonly past: Readonly<T[]>;
    private readonly present: T;
    private readonly future: Readonly<T[]>;

    private constructor(
        past: Readonly<T[]>,
        present: T,
        future: Readonly<T[]>,
    ) {
        this.past = past;
        this.present = present;
        this.future = future;
    }

    public static initialize<T>(initial: T): History<T> {
        return new History<T>([], initial, []);
    }

    public current(): T {
        return this.present;
    }

    public canUndo(): boolean {
        return this.past.length > 0;
    }

    public canRedo(): boolean {
        return this.future.length > 0;
    }

    add(next: T): History<T> {
        return new History<T>([...this.past, this.present], next, []);
    }

    undo(): History<T> {
        if (!this.canUndo()) return this;

        const prev = this.past[this.past.length - 1];
        return new History<T>(this.past.slice(0, -1), prev, [
            this.present,
            ...this.future,
        ]);
    }

    redo(): History<T> {
        if (!this.canRedo()) return this;

        const next = this.future[0];
        return new History<T>(
            [...this.past, this.present],
            next,
            this.future.slice(1),
        );
    }

    toString(): string {
        const pastLabels = this.past.map((_, i) => `#${i}`);
        const presentLabel = `[#${this.past.length}]`;
        const futureStart = this.past.length + 1;
        const futureLabels = this.future.map((_, i) => `#${futureStart + i}`);

        return [...pastLabels, presentLabel, ...futureLabels].join(" -> ");
    }

    public getTimeline(): { node: T; isActive: boolean }[] {
        return [
            ...this.past.map((node) => ({ node, isActive: false })),
            { node: this.present, isActive: true },
            ...this.future.map((node) => ({ node, isActive: false })),
        ];
    }
}
