import { assertEquals } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { DebouncedTask } from "./debounced-task.ts";

Deno.test("DebouncedTask", async (t) => {
  await t.step("run() returns initialResult with no schedule()", async () => {
    const task = spy((): string => "result");
    const debounced = new DebouncedTask(task, null);

    assertEquals(await debounced.run(), null);
    assertSpyCalls(task, 0);
  });

  await t.step("run() invokes task and settles", async () => {
    const task = spy((): string => "result");
    const debounced = new DebouncedTask(task, null);

    debounced.schedule();
    assertEquals(await debounced.run(), "result");
    assertSpyCalls(task, 1);
    assertEquals(debounced.lastResult, "result");
    assertEquals(debounced.pending, false);
  });

  await t.step(
    "concurrent run() calls for the same generation invoke task once",
    async () => {
      const task = spy(
        (): Promise<string> =>
          new Promise((resolve) => setTimeout(() => resolve("result"), 10)),
      );
      const debounced = new DebouncedTask(task, null);

      debounced.schedule();
      const [r1, r2] = await Promise.all([debounced.run(), debounced.run()]);

      assertEquals(r1, "result");
      assertEquals(r2, "result");
      assertSpyCalls(task, 1);
    },
  );

  await t.step(
    "schedule() while a run is in flight supersedes it — both resolve to the newer result",
    async () => {
      let call = 0;
      const task = (): Promise<string> => {
        call++;
        const value = call === 1 ? "first" : "second";
        return new Promise((resolve) => setTimeout(() => resolve(value), 10));
      };
      const debounced = new DebouncedTask(task, null);

      debounced.schedule();
      const firstRun = debounced.run();

      debounced.schedule();
      const secondRun = debounced.run();

      const [r1, r2] = await Promise.all([firstRun, secondRun]);

      assertEquals(r1, "second");
      assertEquals(r2, "second");
      assertEquals(debounced.lastResult, "second");
    },
  );

  await t.step("settle() bypasses task and resolves waiters", async () => {
    const task = spy((): string => "result");
    const debounced = new DebouncedTask(task, null);

    debounced.schedule();
    const waiter = debounced.wait();

    debounced.settle("bypassed");

    assertEquals(await waiter, "bypassed");
    assertEquals(debounced.lastResult, "bypassed");
    assertEquals(debounced.pending, false);
    assertSpyCalls(task, 0);
  });

  await t.step(
    "settle() supersedes an already in-flight run — both resolve to the settled value",
    async () => {
      const task = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve("stale"), 10));
      const debounced = new DebouncedTask(task, null);

      debounced.schedule();
      const run = debounced.run();

      debounced.settle("fresh");

      assertEquals(await run, "fresh");
      assertEquals(debounced.lastResult, "fresh");
    },
  );

  await t.step(
    "wait() resolves immediately when nothing is pending",
    async () => {
      const debounced = new DebouncedTask<string | null>(() => "result", null);
      assertEquals(await debounced.wait(), null);
    },
  );

  await t.step(
    "debounces rapid schedule() calls into a single run",
    async () => {
      const task = spy((): string => "result");
      const debounced = new DebouncedTask(task, null, { delayMs: 20 });

      debounced.schedule();
      debounced.schedule();
      debounced.schedule();

      await new Promise((resolve) => setTimeout(resolve, 40));

      assertSpyCalls(task, 1);
    },
  );

  await t.step("cancel() prevents the debounced run from firing", async () => {
    const task = spy((): string => "result");
    const debounced = new DebouncedTask(task, null, { delayMs: 10 });

    debounced.schedule();
    debounced.cancel();

    await new Promise((resolve) => setTimeout(resolve, 20));

    assertSpyCalls(task, 0);
  });

  await t.step(
    "flush() runs the task immediately, bypassing the debounce delay",
    async () => {
      const task = spy((): string => "result");
      const debounced = new DebouncedTask(task, null, { delayMs: 10_000 });

      debounced.schedule();
      assertEquals(await debounced.flush(), "result");
      assertSpyCalls(task, 1);
      assertEquals(debounced.pending, false);
    },
  );

  await t.step(
    "flush() is a no-op when nothing is scheduled",
    async () => {
      const task = spy((): string => "result");
      const debounced = new DebouncedTask(task, null);

      assertEquals(await debounced.flush(), null);
      assertSpyCalls(task, 0);
    },
  );

  await t.step(
    "forceRun() runs again even though the current generation already settled",
    async () => {
      const task = spy((): string => "result");
      const debounced = new DebouncedTask(task, null);

      debounced.schedule();
      await debounced.run();
      assertSpyCalls(task, 1);

      // Unlike run(), which would just return the cached "result" again.
      assertEquals(await debounced.forceRun(), "result");
      assertSpyCalls(task, 2);
    },
  );

  await t.step(
    "forceRun() still respects delayMs, unlike flush()",
    async () => {
      const task = spy((): string => "result");
      const debounced = new DebouncedTask(task, null, { delayMs: 10_000 });

      debounced.schedule();
      await debounced.flush(); // Settle the first generation immediately.
      assertSpyCalls(task, 1);

      const forced = debounced.forceRun();
      assertEquals(debounced.pending, true);
      assertSpyCalls(task, 1); // Not invoked yet — still debouncing.

      await debounced.flush(); // Bypass the delay to observe the outcome.
      assertEquals(await forced, "result");
      assertSpyCalls(task, 2);
    },
  );

  await t.step(
    "onSettled fires once per real completion, not on joins",
    async () => {
      const onSettled = spy();
      const task = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve("result"), 10));
      const debounced = new DebouncedTask(task, null, { onSettled });

      debounced.schedule();
      await Promise.all([debounced.run(), debounced.run(), debounced.run()]);

      assertSpyCalls(onSettled, 1);
    },
  );

  await t.step(
    "onPending fires only once per false->true transition",
    async () => {
      let pendingCalls = 0;
      const task = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve("result"), 10));
      const debounced = new DebouncedTask(task, null, {
        onPending: () => pendingCalls++,
      });

      debounced.schedule();
      debounced.schedule(); // Already pending; should not fire again.
      await debounced.run();

      assertEquals(pendingCalls, 1);
    },
  );

  await t.step(
    "onSettled reports wasPending=true when a scheduled run completes",
    async () => {
      const settledCalls: Array<[string | null, boolean]> = [];
      const task = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve("result"), 10));
      const debounced = new DebouncedTask(task, null, {
        onSettled: (result, wasPending) =>
          settledCalls.push([result, wasPending]),
      });

      debounced.schedule();
      await debounced.run();

      assertEquals(settledCalls, [["result", true]]);
    },
  );

  await t.step(
    "onSettled reports wasPending=false when settle() bypasses an idle task",
    () => {
      const settledCalls: Array<[string, boolean]> = [];
      const debounced = new DebouncedTask<string>(() => "unused", "initial", {
        onSettled: (result, wasPending) =>
          settledCalls.push([result, wasPending]),
      });

      debounced.settle("bypassed"); // Never scheduled -> wasn't pending.

      assertEquals(settledCalls, [["bypassed", false]]);
    },
  );

  await t.step(
    "isAborted passed to task reflects supersession mid-flight",
    async () => {
      const abortedStates: boolean[] = [];
      const task = (isAborted: () => boolean): Promise<string> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            abortedStates.push(isAborted());
            resolve("result");
          }, 10);
        });
      };
      const debounced = new DebouncedTask(task, null);

      debounced.schedule();
      const firstRun = debounced.run();

      // Supersede before the first run's task settles.
      debounced.schedule();
      const secondRun = debounced.run();

      const [r1, r2] = await Promise.all([firstRun, secondRun]);

      // The superseded (first) invocation observes isAborted() === true;
      // the winning (second) invocation observes false. Both calls still
      // resolve to the winning result.
      assertEquals(abortedStates, [true, false]);
      assertEquals(r1, "result");
      assertEquals(r2, "result");
    },
  );
});
