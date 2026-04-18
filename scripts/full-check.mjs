import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const smokeScript = fileURLToPath(new URL("./smoke-browser.mjs", import.meta.url));
const nextBin = path.join(path.dirname(require.resolve("next/package.json")), "dist", "bin", "next");
const argv = new Set(process.argv.slice(2));
const skipBuild = argv.has("--skip-build");
const host = process.env.SMARTWARDROBE_HOST || "127.0.0.1";
const port = Number(process.env.SMARTWARDROBE_PORT || "3000");
const appUrl = process.env.APP_URL || `http://${host}:${port}`;
const readinessUrl = `${appUrl}/api/health`;
const readinessTimeoutMs = Number(process.env.SMARTWARDROBE_READY_TIMEOUT_MS || "120000");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/c", command, ...args], {
            stdio: "inherit",
            shell: false,
            env: {
              ...process.env,
              ...options.env,
            },
          })
        : spawn(command, args, {
            stdio: "inherit",
            shell: false,
            env: {
              ...process.env,
              ...options.env,
            },
          });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} exited with ${signal ? `signal ${signal}` : `code ${code}`}`,
        ),
      );
    });

    return child;
  });
}

async function waitForApp(url, timeoutMs) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const body = await response.json().catch(() => null);
        if (!body || body.ready !== false) {
          return;
        }
        lastError = new Error(`Health endpoint returned degraded status for ${url}`);
      } else if (response.status === 503) {
        const body = await response.json().catch(() => null);
        if (body?.ready === false) {
          lastError = new Error(`Health endpoint returned degraded status for ${url}`);
        }
      }
    } catch (error) {
      lastError = error;
    }

    await delay(1000);
  }

  throw new Error(
    `Timed out waiting for ${url}${lastError ? `: ${lastError.message}` : ""}`,
  );
}

async function startApp() {
  const child = spawn(
    process.execPath,
    [nextBin, "start", "-H", host, "-p", String(port)],
    {
      stdio: "inherit",
      shell: false,
      env: process.env,
    },
  );

  return child;
}

async function main() {
  if (!skipBuild) {
    await run("npm", ["run", "build"]);
  }

  const appProcess = await startApp();
  let smokeFailed = false;

  const stopApp = async () => {
    if (appProcess.exitCode !== null || appProcess.signalCode !== null) {
      return;
    }

    appProcess.kill();
    await Promise.race([
      new Promise((resolve) => appProcess.once("exit", resolve)),
      delay(10000),
    ]);

    if (appProcess.exitCode === null && appProcess.signalCode === null) {
      appProcess.kill("SIGKILL");
    }
  };

  const cleanup = async () => {
    try {
      await stopApp();
    } catch {}
  };

  process.on("SIGINT", () => {
    cleanup().finally(() => process.exit(130));
  });
  process.on("SIGTERM", () => {
    cleanup().finally(() => process.exit(143));
  });

  try {
    await waitForApp(readinessUrl, readinessTimeoutMs);
    await run(process.execPath, [smokeScript], {
      env: {
        APP_URL: appUrl,
      },
    });
  } catch (error) {
    smokeFailed = true;
    throw error;
  } finally {
    await cleanup();
    if (smokeFailed) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
