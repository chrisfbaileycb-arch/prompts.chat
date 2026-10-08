import type { getConfig } from "@/lib/config";

const GENERIC_PROVIDER_ENV_MAP: Record<string, { nameVar: string; logoVar: string }> = {
  oidc: { nameVar: "AUTH_OIDC_NAME", logoVar: "AUTH_OIDC_LOGO" },
  oauth: { nameVar: "AUTH_OAUTH_NAME", logoVar: "AUTH_OAUTH_LOGO" },
};

export interface ProviderMetadata {
  displayNames: Record<string, string>;
  logos: Record<string, string>;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getProviderMetadata(providerIds: string[]): ProviderMetadata {
  const displayNames: Record<string, string> = {};
  const logos: Record<string, string> = {};

  for (const id of providerIds) {
    const envMapping = GENERIC_PROVIDER_ENV_MAP[id];
    if (envMapping) {
      const name = process.env[envMapping.nameVar];
      const logo = process.env[envMapping.logoVar];
      if (name) {
        displayNames[id] = name;
      }
      if (logo && isSafeUrl(logo)) {
        logos[id] = logo;
      }
    }
  }

  return { displayNames, logos };
}

export function getConfiguredProviderIds(config: Awaited<ReturnType<typeof getConfig>>): string[] {
  if (config.auth.providers && config.auth.providers.length > 0) {
    return config.auth.providers;
  }
  if (config.auth.provider && typeof config.auth.provider === "string") {
    return [config.auth.provider];
  }
  return ["credentials"];
}
