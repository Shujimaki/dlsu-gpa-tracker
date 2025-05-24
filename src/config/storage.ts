/**
 * Store data in sessionStorage
 * @param key Storage key
 * @param data Data to store
 */
export function storeSessionData(key: string, data: unknown): void {
  try {
    const serializedData = JSON.stringify(data);
    sessionStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
  }
}

/**
 * Load data from sessionStorage
 * @param key Storage key
 * @returns The stored data or null if not found
 */
export function loadSessionData(key: string): unknown | null {
  try {
    const serializedData = sessionStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return null;
  }
}

/**
 * Remove data from sessionStorage
 * @param key Storage key
 */
export function removeSessionData(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
} 