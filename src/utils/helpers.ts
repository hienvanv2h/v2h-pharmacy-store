// Function to deep clone an object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  const cloned: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// Function to check if a string is a valid URL
export function isValidUrl(url: string) {
  try {
    new URL(url); // Attempt to construct a URL
    return true;
  } catch (e) {
    return false;
  }
}

//
export function getValidatedImageSrc(
  src: string | null | undefined,
  fallbackSrc: string
) {
  if (!src) return fallbackSrc;
  return isValidUrl(src) ? src : fallbackSrc;
}
