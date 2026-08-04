import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOST_SUFFIXES = [".internal", ".lan", ".local", ".localhost", ".home"];

function normalizeHostname(hostname: string) {
  return hostname.toLocaleLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
}

function isPublicIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second, third] = parts;

  if (first === 0 || first === 10 || first === 127 || first >= 224) return false;
  if (first === 100 && second >= 64 && second <= 127) return false;
  if (first === 169 && second === 254) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 168) return false;
  if (first === 192 && second === 0 && (third === 0 || third === 2)) return false;
  if (first === 198 && (second === 18 || second === 19)) return false;
  if (first === 198 && second === 51 && third === 100) return false;
  if (first === 203 && second === 0 && third === 113) return false;

  return true;
}

function extractMappedIpv4(address: string) {
  const normalized = address.toLocaleLowerCase();
  if (!normalized.startsWith("::ffff:")) return null;

  const tail = normalized.slice("::ffff:".length);
  if (tail.includes(".")) return tail;

  const [high, low] = tail.split(":");
  if (!high || !low) return null;

  const highValue = Number.parseInt(high, 16);
  const lowValue = Number.parseInt(low, 16);
  if (!Number.isFinite(highValue) || !Number.isFinite(lowValue)) return null;

  return [highValue >> 8, highValue & 255, lowValue >> 8, lowValue & 255].join(".");
}

function isPublicIpv6(address: string) {
  const normalized = normalizeHostname(address).split("%")[0];
  const mappedIpv4 = extractMappedIpv4(normalized);
  if (mappedIpv4) return isPublicIpv4(mappedIpv4);

  if (normalized === "::" || normalized === "::1") return false;
  if (/^f[cd]/.test(normalized)) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (/^ff/.test(normalized)) return false;
  if (normalized.startsWith("2001:db8:")) return false;

  return true;
}

export function isPublicAddress(address: string) {
  const version = isIP(normalizeHostname(address));
  if (version === 4) return isPublicIpv4(normalizeHostname(address));
  if (version === 6) return isPublicIpv6(address);
  return false;
}

export function normalizeRecipeImportUrl(value: string) {
  const input = value.trim();
  if (!input || input.length > 2_048) {
    throw new Error("Enter a valid recipe URL.");
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  const parsedUrl = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("URLs with credentials are not supported.");
  }

  if (parsedUrl.port && !["80", "443"].includes(parsedUrl.port)) {
    throw new Error("URLs with custom ports are not supported.");
  }

  parsedUrl.hash = "";
  return parsedUrl;
}

export async function assertPublicRecipeUrl(url: URL) {
  const hostname = normalizeHostname(url.hostname);
  const ipVersion = isIP(hostname);
  const isBlockedHostname =
    hostname === "localhost" ||
    (!ipVersion && !hostname.includes(".")) ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));

  if (isBlockedHostname) {
    throw new Error("Private network URLs are not supported.");
  }

  if (ipVersion) {
    if (!isPublicAddress(hostname)) {
      throw new Error("Private network URLs are not supported.");
    }
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("This host does not resolve to a public address.");
  }
}
