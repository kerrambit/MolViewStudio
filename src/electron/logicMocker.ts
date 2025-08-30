import { BrowserWindow } from "electron";
import { Ipc } from "./Ipc.Electron.js";

const DELAY_IN_MILISECONDS = 500;

export function pollData(window: BrowserWindow) {
    setInterval(async () => {
        Ipc.Electron.send("data", "Data.", window);
    }, DELAY_IN_MILISECONDS);
}
