import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ processNextRenderJob: vi.fn() }));
vi.mock("./processor", () => mocks);

import { runRenderWorker } from "./worker";

beforeEach(() => {
  mocks.processNextRenderJob.mockReset();
  mocks.processNextRenderJob.mockResolvedValue({ processed: false });
});

describe("render worker lifecycle", () => {
  it("returns after one poll in once mode, even with an empty queue", async () => {
    await runRenderWorker({ once: true, workerId: "test-worker" });
    expect(mocks.processNextRenderJob).toHaveBeenCalledExactlyOnceWith("test-worker");
  });

  it("does not claim a job after shutdown has already been requested", async () => {
    await runRenderWorker({ signal: AbortSignal.abort() });
    expect(mocks.processNextRenderJob).not.toHaveBeenCalled();
  });

  it("waits for an active job on shutdown and does not poll again", async () => {
    const shutdown = new AbortController();
    let finish!: (value: { processed: boolean }) => void;
    mocks.processNextRenderJob.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const running = runRenderWorker({ signal: shutdown.signal });
    shutdown.abort();
    finish({ processed: false });
    await running;
    expect(mocks.processNextRenderJob).toHaveBeenCalledTimes(1);
  });

  it("interrupts the idle delay when shutdown is requested", async () => {
    const shutdown = new AbortController();
    const running = runRenderWorker({ signal: shutdown.signal });
    await Promise.resolve(); // Let the empty-queue result enter the idle delay.
    shutdown.abort();
    await running;
    expect(mocks.processNextRenderJob).toHaveBeenCalledTimes(1);
  });

  it("assigns distinct identities to separate workers in the same process", async () => {
    await runRenderWorker({ once: true });
    await runRenderWorker({ once: true });
    expect(mocks.processNextRenderJob.mock.calls[0][0]).not.toBe(mocks.processNextRenderJob.mock.calls[1][0]);
  });

  it("propagates failures so the entry point can close the database and exit", async () => {
    mocks.processNextRenderJob.mockRejectedValue(new Error("Database unavailable"));
    await expect(runRenderWorker({ once: true })).rejects.toThrow("Database unavailable");
  });
});
