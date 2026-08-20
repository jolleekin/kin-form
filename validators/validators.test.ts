import { assertEquals } from "@std/assert";
import {
  FieldApi,
  type ValidationError,
  type Validator,
} from "@kintools/form-core";
import {
  email,
  max,
  maxFileSize,
  maxLength,
  min,
  minLength,
  password,
  pattern,
  required,
  url,
} from "./validators.ts";

function fieldWith<TValue>(
  initialValue: TValue,
  validators: Validator<TValue>[],
): FieldApi<TValue> {
  return new FieldApi<TValue>(null, "", { initialValue, validators });
}

async function errorFor<TValue>(
  initialValue: TValue,
  validators: Validator<TValue>[],
): Promise<ValidationError> {
  const field = fieldWith(initialValue, validators);
  await field.validate();
  return field.error;
}

Deno.test("required", async (t) => {
  await t.step("flags null/undefined/blank/empty array", async () => {
    assertEquals(await errorFor("", [required()]), "required");
    assertEquals(await errorFor("  ", [required()]), "required");
    assertEquals(
      await errorFor<string[]>([], [required()]),
      "required",
    );
  });

  await t.step("passes a present value", async () => {
    assertEquals(await errorFor("hi", [required()]), null);
  });

  await t.step("supports a custom message", async () => {
    assertEquals(
      await errorFor("", [required("Please fill this in")]),
      "Please fill this in",
    );
  });
});

Deno.test("minLength / maxLength", async (t) => {
  await t.step("minLength flags a too-short string", async () => {
    assertEquals(
      await errorFor("ab", [minLength(3)]),
      "minLength",
    );
    assertEquals(await errorFor("abc", [minLength(3)]), null);
  });

  await t.step("maxLength flags a too-long array", async () => {
    assertEquals(
      await errorFor([1, 2, 3], [maxLength(2, "Too many")]),
      "Too many",
    );
    assertEquals(await errorFor([1, 2], [maxLength(2)]), null);
  });
});

Deno.test("min / max", async (t) => {
  await t.step("min flags a too-small number", async () => {
    assertEquals(
      await errorFor(1, [min(5)]),
      "min",
    );
    assertEquals(await errorFor(5, [min(5)]), null);
  });

  await t.step("max flags a too-large number", async () => {
    assertEquals(
      await errorFor(10, [max(5, "Too big")]),
      "Too big",
    );
    assertEquals(await errorFor(5, [max(5)]), null);
  });
});

Deno.test("url", async (t) => {
  await t.step("flags an invalid URL", async () => {
    assertEquals(
      await errorFor("not a url", [url()]),
      "url",
    );
  });

  await t.step("passes a valid URL", async () => {
    assertEquals(
      await errorFor("https://example.com", [url()]),
      null,
    );
  });

  await t.step("passes an empty value through", async () => {
    assertEquals(await errorFor("", [url()]), null);
  });
});

Deno.test("email", async (t) => {
  await t.step("flags an invalid email", async () => {
    assertEquals(
      await errorFor("not-an-email", [email()]),
      "email",
    );
  });

  await t.step("passes a valid email", async () => {
    assertEquals(
      await errorFor("user@example.com", [email()]),
      null,
    );
  });

  await t.step("passes an empty value through", async () => {
    assertEquals(await errorFor("", [email()]), null);
  });
});

Deno.test("pattern", async (t) => {
  await t.step("flags a non-matching string", async () => {
    assertEquals(
      await errorFor("abc", [pattern(/^\d+$/, "Digits only")]),
      "Digits only",
    );
  });

  await t.step("passes a matching string", async () => {
    assertEquals(
      await errorFor("123", [pattern(/^\d+$/)]),
      null,
    );
  });

  await t.step("passes an empty value through", async () => {
    assertEquals(await errorFor("", [pattern(/^\d+$/)]), null);
  });
});

Deno.test("password", async (t) => {
  const strict = {
    minLength: 8,
    maxLength: 20,
    digit: true,
    upper: true,
    lower: true,
    symbol: true,
  };

  await t.step("passes a value meeting every enabled rule", async () => {
    assertEquals(
      await errorFor("Abcdefg1!", [password(strict)]),
      null,
    );
  });

  await t.step("flags a value shorter than minLength", async () => {
    assertEquals(
      await errorFor("Ab1!", [password(strict)]),
      "password",
    );
  });

  await t.step("flags a value longer than maxLength", async () => {
    assertEquals(
      await errorFor("Abcdefg1!".repeat(3), [password(strict)]),
      "password",
    );
  });

  await t.step("flags a missing required character class", async () => {
    assertEquals(
      await errorFor("abcdefg1!", [password(strict)]), // No uppercase.
      "password",
    );
    assertEquals(
      await errorFor("ABCDEFG1!", [password(strict)]), // No lowercase.
      "password",
    );
    assertEquals(
      await errorFor("Abcdefgh!", [password(strict)]), // No digit.
      "password",
    );
    assertEquals(
      await errorFor("Abcdefg12", [password(strict)]), // No symbol.
      "password",
    );
  });

  await t.step("ignores disabled rules", async () => {
    assertEquals(
      await errorFor("abcdefgh", [password({ minLength: 6 })]),
      null,
    );
  });

  await t.step("passes an empty value through", async () => {
    assertEquals(await errorFor("", [password(strict)]), null);
  });

  await t.step("supports a custom message", async () => {
    assertEquals(
      await errorFor("weak", [password(strict, "Too weak")]),
      "Too weak",
    );
  });
});

Deno.test("maxFileSize", async (t) => {
  await t.step("flags a file that's too large", async () => {
    const file = new File([new Uint8Array(10)], "big.bin");
    assertEquals(
      await errorFor<File | null>(file, [maxFileSize(5)]),
      "maxFileSize",
    );
  });

  await t.step("passes a small enough file", async () => {
    const file = new File([new Uint8Array(2)], "small.bin");
    assertEquals(
      await errorFor<File | null>(file, [maxFileSize(5)]),
      null,
    );
  });

  await t.step("passes a missing file through", async () => {
    assertEquals(
      await errorFor<File | null>(null, [maxFileSize(5)]),
      null,
    );
  });
});
