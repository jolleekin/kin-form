import "./_test-setup.ts";
import { assertEquals, assertThrows } from "@std/assert";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { FormApi } from "@kintools/form-core";
import { MultistepController } from "./MultistepController.ts";

class TestHost implements ReactiveControllerHost {
  readonly updateComplete: Promise<boolean> = Promise.resolve(true);
  readonly controllers: ReactiveController[] = [];
  updateCount = 0;

  addController(controller: ReactiveController): void {
    this.controllers.push(controller);
  }

  removeController(controller: ReactiveController): void {
    const index = this.controllers.indexOf(controller);
    if (index >= 0) this.controllers.splice(index, 1);
  }

  requestUpdate(): void {
    this.updateCount++;
    for (const controller of this.controllers) controller.hostUpdate?.();
  }
}

type Wizard = {
  account: { email: string };
  profile: { name: string };
};

Deno.test("MultistepController", async (t) => {
  await t.step(
    "starts on step 0 (or initialStep) with the matching group",
    () => {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "" },
          profile: { name: "" },
        },
      });

      const step = new MultistepController(new TestHost(), form, [
        "account",
        "profile",
      ]);

      assertEquals(step.stepIndex, 0);
      assertEquals(step.stepName, "account");
      assertEquals(step.isFirstStep, true);
      assertEquals(step.isLastStep, false);
    },
  );

  await t.step(
    "next() blocks and touches the group when the current step is invalid",
    async () => {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "" },
          profile: { name: "" },
        },
      });

      const step = new MultistepController(new TestHost(), form, [
        "account",
        "profile",
      ]);

      form.field("account").field("email", {
        validators: [(f) => (f.value ? null : "Required")],
      });

      const advanced = await step.next();

      assertEquals(advanced, false);
      assertEquals(step.stepIndex, 0);
      assertEquals(form.field("account").touched, true);
    },
  );

  await t.step(
    "next() advances to the next step once the current one is valid",
    async () => {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "a@b.com" },
          profile: { name: "" },
        },
      });

      const step = new MultistepController(new TestHost(), form, [
        "account",
        "profile",
      ]);

      form.field("account").field("email", {
        validators: [(f) => (f.value ? null : "Required")],
      });

      const advanced = await step.next();

      assertEquals(advanced, true);
      assertEquals(step.stepIndex, 1);
      assertEquals(step.stepName, "profile");
      assertEquals(step.isLastStep, true);
    },
  );

  await t.step("onBeforeNext returning false cancels the advance", async () => {
    const form = new FormApi<Wizard>({
      initialValue: {
        account: { email: "a@b.com" },
        profile: { name: "" },
      },
    });

    const step = new MultistepController(new TestHost(), form, [
      "account",
      "profile",
    ], {
      onBeforeNext: () => false,
    });

    const advanced = await step.next();

    assertEquals(advanced, false);
    assertEquals(step.stepIndex, 0);
  });

  await t.step(
    "onBeforeNext returning a step name redirects next() there",
    async () => {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "a@b.com" },
          profile: { name: "" },
        },
      });

      const step = new MultistepController(new TestHost(), form, [
        "account",
        "profile",
        null,
      ], {
        onBeforeNext: () => null,
      });

      await step.next();

      assertEquals(step.stepIndex, 2);
      assertEquals(step.stepName, null);
      assertEquals(step.stepField, null);
    },
  );

  await t.step("back()/jump() navigate without validating", () => {
    const form = new FormApi<Wizard>({
      initialValue: {
        account: { email: "" },
        profile: { name: "" },
      },
    });

    const step = new MultistepController(new TestHost(), form, [
      "account",
      "profile",
    ]);

    step.jump("profile");
    assertEquals(step.stepIndex, 1);

    step.back();
    assertEquals(step.stepIndex, 0);

    // Out-of-range numeric jumps throw instead of clamping.
    assertThrows(() => step.jump(99));
    assertEquals(step.stepIndex, 0);

    // Unknown step names throw too.
    assertThrows(() => {
      // @ts-expect-error testing an invalid step name at runtime
      step.jump("nonexistent");
    });
  });

  await t.step(
    "onStepChanged fires with prevStepIndex/stepIndex on every navigation",
    () => {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "" },
          profile: { name: "" },
        },
      });

      const calls: Array<{ prevStepIndex: number; stepIndex: number }> = [];

      const step = new MultistepController(new TestHost(), form, [
        "account",
        "profile",
      ], {
        onStepChanged: ({ prevStepIndex, stepIndex }) => {
          calls.push({ prevStepIndex, stepIndex });
        },
      });

      step.jump(1);

      assertEquals(calls, [{ prevStepIndex: 0, stepIndex: 1 }]);
    },
  );

  await t.step("requests a host update on navigation", () => {
    const form = new FormApi<Wizard>({
      initialValue: {
        account: { email: "" },
        profile: { name: "" },
      },
    });

    const host = new TestHost();
    const step = new MultistepController(host, form, ["account", "profile"]);

    host.updateCount = 0;
    step.jump(1);
    assertEquals(host.updateCount, 1);
  });

  await t.step(
    "requests a host update when the current step's field flips invalid/validating",
    async () => {
      const form = new FormApi<Wizard>({
        initialValue: {
          account: { email: "" },
          profile: { name: "" },
        },
      });

      const host = new TestHost();
      const step = new MultistepController(host, form, ["account", "profile"]);
      host.controllers[0].hostConnected?.();

      const email = form.field("account").field("email", {
        validators: [(f) => (f.value ? null : "Required")],
      });
      await email.waitForValidation(); // Settles the initial `invalid: true`.

      host.updateCount = 0;
      email.value = "a@b.com";
      await email.waitForValidation();
      assertEquals(host.updateCount, 1);

      // Moving to a step without a field stops watching `email`.
      step.jump(1);
      host.updateCount = 0;
      email.value = "";
      await email.waitForValidation();
      assertEquals(host.updateCount, 0);
    },
  );

  await t.step("hostDisconnected unsubscribes", () => {
    const form = new FormApi<Wizard>({
      initialValue: {
        account: { email: "" },
        profile: { name: "" },
      },
    });

    const host = new TestHost();
    new MultistepController(host, form, ["account", "profile"]);
    host.controllers[0].hostConnected?.();
    host.controllers[0].hostDisconnected?.();

    host.updateCount = 0;
    form.field("account").field("email", {
      validators: [(f) => (f.value ? null : "Required")],
    }).value = "a@b.com";
    assertEquals(host.updateCount, 0);
  });
});
