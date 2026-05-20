export type ValidationResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      code: "missingDomainName" | "invalidDomainName";
      message: string;
    };

const ionDomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ion$/;

export function validateIonDomainName(value: string | null): ValidationResult {
  if (!value) {
    return {
      ok: false,
      code: "missingDomainName",
      message: "Query parameter `name` is required.",
    };
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.length > 72 || !ionDomainPattern.test(normalized)) {
    return {
      ok: false,
      code: "invalidDomainName",
      message: "Domain name must be a valid lowercase .ion label.",
    };
  }

  return {
    ok: true,
    value: normalized,
  };
}
