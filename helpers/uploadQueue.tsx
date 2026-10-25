// A small bounded-concurrency work queue used to upload slide thumbnails
// while the next pages are still being rendered.
//
// Design notes:
//  - Work starts as soon as it is pushed, up to `concurrency` jobs at once.
//  - push() applies backpressure: if the queue already holds `maxPending`
//    waiting items it returns a promise that resolves only when there is room,
//    so a fast renderer can't pile hundreds of decoded images into memory
//    ahead of a slow connection.
//  - The first failure aborts the shared signal (cancelling in-flight
//    requests), drops anything not yet started, and makes both push() and
//    finish() reject with that error.
//  - cancel() and finish() only resolve once every in-flight job has actually
//    settled. That matters for rollback: deleting a half-finished upload while
//    a request is still in flight could let that request land afterwards and
//    leave an orphaned file.
//
// No imports on purpose, so the logic can be tested in isolation.

export interface UploadQueue<T> {
  /** Enqueue an item. Resolves when there is room; rejects if the queue has failed. */
  push(item: T): Promise<void>;
  /** Resolves when everything pushed has completed; rejects with the first failure. */
  finish(): Promise<void>;
  /** Stop starting new work, abort in-flight work, and wait for it to settle. Never rejects. */
  cancel(): Promise<void>;
}

interface Options<T> {
  concurrency: number;
  /** Max items allowed to wait (not counting those running) before push() blocks. */
  maxPending?: number;
  worker: (item: T, signal: AbortSignal) => Promise<void>;
}

export function createUploadQueue<T>({
  concurrency,
  maxPending = concurrency * 2,
  worker,
}: Options<T>): UploadQueue<T> {
  const controller = new AbortController();
  const pending: T[] = [];
  let active = 0;
  let stopped = false;
  let failure: { error: unknown } | null = null;

  let idleWaiters: Array<() => void> = [];
  let spaceWaiters: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

  const isIdle = () => active === 0 && (pending.length === 0 || stopped);

  const notifyIdle = () => {
    if (!isIdle()) return;
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach((resolve) => resolve());
  };

  const notifySpace = () => {
    while (spaceWaiters.length > 0 && pending.length <= maxPending) {
      spaceWaiters.shift()!.resolve();
    }
  };

  const fail = (error: unknown) => {
    if (failure) return;
    failure = { error };
    stopped = true;
    pending.length = 0;
    controller.abort();
    const waiters = spaceWaiters;
    spaceWaiters = [];
    waiters.forEach((w) => w.reject(error));
  };

  const pump = () => {
    while (!stopped && active < concurrency && pending.length > 0) {
      const item = pending.shift()!;
      active += 1;
      worker(item, controller.signal)
        .catch((error) => fail(error))
        .finally(() => {
          active -= 1;
          pump();
          notifyIdle();
        });
    }
    notifySpace();
    notifyIdle();
  };

  const whenIdle = () =>
    new Promise<void>((resolve) => {
      if (isIdle()) resolve();
      else idleWaiters.push(resolve);
    });

  return {
    push(item) {
      if (failure) return Promise.reject(failure.error);
      if (stopped) return Promise.resolve();
      pending.push(item);
      pump();
      if (pending.length <= maxPending) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        spaceWaiters.push({ resolve, reject });
      });
    },

    async finish() {
      await whenIdle();
      if (failure) throw failure.error;
    },

    async cancel() {
      stopped = true;
      pending.length = 0;
      controller.abort();
      const waiters = spaceWaiters;
      spaceWaiters = [];
      waiters.forEach((w) => w.resolve());
      await whenIdle();
    },
  };
}
