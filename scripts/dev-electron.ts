/**
 * Development launcher for Electron.
 *
 * Instead of `package.json` running `electron .` directly, `package.json` runs this script,
 * and the script decides which flags Electron needs on this machine.
 *
 * It also sets `NODE_ENV=development` for Electron itself (via `spawn`'s `env` option),
 * so `cross-env` is not needed for this command.
 *
 * ## Why workarounds exist
 *
 * On some Linux setups Electron crashes at startup with `SIGSEGV`. The cause is the
 * Wayland code path that Chromium picks automatically. Forcing the X11 backend
 * (`--ozone-platform=x11`, which runs through XWayland) avoids it.
 * On Windows and macOS this script does nothing special and just starts Electron.
 *
 * ## Environment variables
 *
 * ### ELECTRON_WORKAROUNDS
 *
 * Controls when the Linux workaround flags are added.
 *
 * | Value            | Behavior                                                                   |
 * | ---------------- | -------------------------------------------------------------------------- |
 * | `auto` (default) | Start without the X11 flag. If Electron crashes, retry once with it.       |
 * | `force`          | Always start with the workaround flags. Skips the initial crash.           |
 * | `off`            | Never add workaround flags. Electron starts exactly as it would by itself. |
 *
 * Any other value is not validated and behaves like `auto`.
 *
 * The variable is inherited through `npm run dev`, `npm-run-all` and `wait-on`, so it
 * does not need to be wired into `package.json`.
 *
 * Recommendation: if your machine needs the X11 flag, set `force` in your shell profile
 * to avoid one crash on every start. Use `off` to see Electron's real behavior when
 * debugging.
 *
 * ### Variables that are only read, never set
 *
 * These are used to decide whether the X11 fallback makes sense:
 *
 * - `XDG_SESSION_TYPE` / `WAYLAND_DISPLAY`: tell whether the session is Wayland.
 * - `DISPLAY`: set when X11 (or XWayland) is available.
 *
 * The X11 flag is only added when the session is Wayland AND `DISPLAY` is set.
 * On a native X11 desktop there is nothing to force, and on pure Wayland without
 * XWayland forcing X11 would break startup.
 *
 * ### NODE_ENV
 *
 * Set to `development` by this script for the Electron child process. You do not
 * need to set it yourself.
 *
 * ## Other flags added on Linux
 *
 * `--no-sandbox` is added (dev only) when the `chrome-sandbox` helper in
 * `node_modules` is not root-owned with the SUID bit, which is always the case
 * for npm installs. It is never added on Windows or macOS.
 *
 * ## Extra arguments
 *
 * Anything after `--` is passed through to Electron:
 *
 * ```bash
 * npm run dev:electron -- --enable-logging
 * ```
 *
 * ## Caveat
 *
 * In `auto` mode any crash triggers the retry, including a real crash in app code
 * after it has been running for a while. If that is confusing, run with
 * `ELECTRON_WORKAROUNDS=off` to see the actual behavior.
 */

import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import electron from 'electron';

const electronBin = electron as unknown as string;

/**
 * ELECTRON_WORKAROUNDS=auto  (default) try plain, retry with X11 if Electron crashes
 * ELECTRON_WORKAROUNDS=off   never add workaround flags
 * ELECTRON_WORKAROUNDS=force always add workaround flags
 */
type Mode = 'auto' | 'off' | 'force';
const mode = (process.env.ELECTRON_WORKAROUNDS ?? 'auto') as Mode;
const passthrough = process.argv.slice(2);

const CRASH_SIGNALS = new Set(['SIGSEGV', 'SIGABRT', 'SIGILL', 'SIGBUS']);

type Result = { code: number | null; signal: NodeJS.Signals | null };

/** The `chrome-sandbox` must be root-owned with the SUID bit, which `npm installs` never set up. */
function sandboxUnavailable(): boolean {
  try {
    const s = statSync(path.join(path.dirname(electronBin), 'chrome-sandbox'));
    return !(s.uid === 0 && (s.mode & 0o4000) !== 0);
  } catch {
    return false;
  }
}

/** Force `X11` only on a `Wayland` session where `XWayland` is available (DISPLAY is set). */
function wantsX11Fallback(): boolean {
  const onWayland =
    process.env.XDG_SESSION_TYPE === 'wayland' || Boolean(process.env.WAYLAND_DISPLAY);
  return onWayland && Boolean(process.env.DISPLAY);
}

function run(extraArgs: string[]): Promise<Result> {
  return new Promise((resolve) => {
    const child = spawn(electronBin, ['.', ...extraArgs, ...passthrough], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    });
    for (const sig of ['SIGINT', 'SIGTERM'] as const) {
      process.on(sig, () => child.kill(sig));
    }
    child.on('exit', (code, signal) => resolve({ code, signal }));
  });
}

function crashed(r: Result): boolean {
  return (r.signal !== null && CRASH_SIGNALS.has(r.signal)) || r.code === 139 || r.code === 134;
}

async function main() {
  if (process.platform !== 'linux' || mode === 'off') {
    const r = await run([]);
    process.exit(r.code ?? 0);
  }

  const base = sandboxUnavailable() ? ['--no-sandbox'] : [];
  const x11 = wantsX11Fallback() ? ['--ozone-platform=x11'] : [];

  let result: Result;
  if (mode === 'force') {
    console.log(`[dev-electron] forcing: ${[...base, ...x11].join(' ')}`);
    result = await run([...base, ...x11]);
  } else {
    result = await run(base);
    if (crashed(result) && x11.length > 0) {
      console.warn(
        `[dev-electron] Electron crashed (${result.signal ?? result.code}), retrying with --ozone-platform=x11`,
      );
      result = await run([...base, ...x11]);
    }
  }
  process.exit(result.code ?? (result.signal ? 1 : 0));
}

void main();