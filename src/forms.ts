import Schema from "@deepseek-ai/schemastery";
import type { SchemaFormSourceV1, SchemaFormValidationV1 } from "@cordisx/protocol/schema-form/v1";
import { copy } from "./locales.js";
import { platformLabel } from "./presentation.js";

export type ChannelPlatform = "simulator" | "feishu" | "lark";

/** Normalize optional Standard Schema issue paths for the strict public form contract. */
function hostSchema(schema: Schema): SchemaFormSourceV1 {
  const validation = schema["~standard"];
  const normalize = (result: Awaited<ReturnType<typeof validation.validate>>): SchemaFormValidationV1 =>
    result.issues
      ? {
        issues: result.issues.map(issue => ({
          message: issue.message,
          ...(issue.path === undefined ? {} : { path: issue.path }),
        })),
      }
      : { value: result.value };
  return {
    ...schema,
    "~standard": {
      version: 1,
      vendor: "schemastery",
      validate: input => {
        const result = validation.validate(input);
        return result instanceof Promise ? result.then(normalize) : normalize(result);
      },
    },
  };
}

function displayName(locale: string) {
  return Schema.string().required().pattern(/\S/u)
    .extra("extra", { label: copy(locale, "create.name"), cordisxForm: { icon: "host:tags" } });
}

const groupMode = (locale: string) =>
  Schema.union(
    (["none", "mentions", "all"] as const).map(mode =>
      Schema.const(mode).extra("extra", { label: copy(locale, `groups.${mode}`) })
    ),
  ).required().role("radio").extra("extra", {
    label: copy(locale, "create.groups"),
    cordisxForm: { icon: "host:files" },
  }).description(copy(locale, "create.groups.help"));

export function configurationSchema(locale: string, reception = false) {
  return hostSchema(
    Schema.object({ displayName: displayName(locale), ...(reception ? { groupMode: groupMode(locale) } : {}) }),
  );
}

export function createSchema(locale: string, platforms: readonly ChannelPlatform[]) {
  return hostSchema(Schema.object({
    platform: Schema.union(
      platforms.map(platform => Schema.const(platform).extra("extra", { label: platformLabel(locale, platform) })),
    ).required().role("radio").extra("extra", {
      label: copy(locale, "create.platform"),
      cordisxForm: { icon: "host:palette" },
    }),
    displayName: displayName(locale),
    groupMode: groupMode(locale),
  }));
}
