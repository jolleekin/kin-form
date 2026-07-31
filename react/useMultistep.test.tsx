import "./_test-setup.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { act, cleanup, renderHook } from "@testing-library/react";
import { FormApi } from "@kin-form/core";
import { useMultistep } from "./useMultistep.ts";

type Wizard = {
  account: { email: string };
  profile: { name: string };
};

Deno.test("useMultistep", async (t) => {
  await t.step(
    "starts on step 0 (or initialStep) with the matching group",
    () => {
      try {
        const form = new FormApi<Wizard>({
          initialValue: {
            account: { email: "" },
            profile: { name: "" },
          },
        });

        const { result } = renderHook(() =>
          useMultistep(form, ["account", "profile"])
        );

        assertEquals(result.current.stepIndex, 0);
        assertEquals(result.current.stepName, "account");
        assertEquals(result.current.isFirstStep, true);
        assertEquals(result.current.isLastStep, false);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "next() blocks and touches the group when the current step is invalid",
    async () => {
      try {
        const form = new FormApi<Wizard>({
          initialValue: {
            account: { email: "" },
            profile: { name: "" },
          },
        });

        const { result } = renderHook(() =>
          useMultistep(form, ["account", "profile"])
        );

        form.field("account").field("email", {
          validators: [(f) => (f.value ? null : "Required")],
        });

        let advanced = true;
        await act(async () => {
          advanced = await result.current.next();
        });

        assertEquals(advanced, false);
        assertEquals(result.current.stepIndex, 0);
        assertEquals(form.field("account").touched, true);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "next() advances to the next step once the current one is valid",
    async () => {
      try {
        const form = new FormApi<Wizard>({
          initialValue: {
            account: { email: "a@b.com" },
            profile: { name: "" },
          },
        });

        const { result } = renderHook(() =>
          useMultistep(form, ["account", "profile"])
        );

        form.field("account").field("email", {
          validators: [(f) => (f.value ? null : "Required")],
        });

        let advanced = false;
        await act(async () => {
          advanced = await result.current.next();
        });

        assertEquals(advanced, true);
        assertEquals(result.current.stepIndex, 1);
        assertEquals(result.current.stepName, "profile");
        assertEquals(result.current.isLastStep, true);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("onBeforeNext returning false cancels the advance", async () => {
    try {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "a@b.com" },
          profile: { name: "" },
        },
      });

      const { result } = renderHook(() =>
        useMultistep(form, ["account", "profile"], {
          onBeforeNext: () => false,
        })
      );

      let advanced = true;
      await act(async () => {
        advanced = await result.current.next();
      });

      assertEquals(advanced, false);
      assertEquals(result.current.stepIndex, 0);
    } finally {
      cleanup();
    }
  });

  await t.step(
    "onBeforeNext returning a step name redirects next() there",
    async () => {
      try {
        const form = new FormApi<Wizard>({
          initialValue: {
            account: { email: "a@b.com" },
            profile: { name: "" },
          },
        });

        const { result } = renderHook(() =>
          useMultistep(form, ["account", "profile", null], {
            onBeforeNext: () => null,
          })
        );

        await act(async () => {
          await result.current.next();
        });

        assertEquals(result.current.stepIndex, 2);
        assertEquals(result.current.stepName, null);
        assertEquals(result.current.stepField, null);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("back()/jump() navigate without validating", () => {
    try {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "" },
          profile: { name: "" },
        },
      });

      const { result } = renderHook(() =>
        useMultistep(form, ["account", "profile"])
      );

      act(() => {
        result.current.jump("profile");
      });
      assertEquals(result.current.stepIndex, 1);

      act(() => {
        result.current.back();
      });
      assertEquals(result.current.stepIndex, 0);

      // Out-of-range numeric jumps throw instead of clamping.
      assertThrows(() => {
        act(() => {
          result.current.jump(99);
        });
      });
      assertEquals(result.current.stepIndex, 0);

      // Unknown step names throw too.
      assertThrows(() => {
        act(() => {
          // @ts-expect-error testing an invalid step name at runtime
          result.current.jump("nonexistent");
        });
      });
    } finally {
      cleanup();
    }
  });

  await t.step(
    "onStepChanged fires with prevStepIndex/stepIndex on every navigation",
    () => {
      try {
        const form = new FormApi<Wizard>({
          initialValue: {
            account: { email: "" },
            profile: { name: "" },
          },
        });

        const calls: Array<{ prevStepIndex: number; stepIndex: number }> = [];

        const { result } = renderHook(() =>
          useMultistep(form, ["account", "profile"], {
            onStepChanged: ({ prevStepIndex, stepIndex }) => {
              calls.push({ prevStepIndex, stepIndex });
            },
          })
        );

        act(() => {
          result.current.jump(1);
        });

        assertEquals(calls, [{ prevStepIndex: 0, stepIndex: 1 }]);
      } finally {
        cleanup();
      }
    },
  );
});
