const EXPECTED_ENTRIES_PREFIX = "expected_entries_";
const LEGACY_EXPECTED_ENTRIES_KEY = /^expected_entries_\d+$/;

function getNamespacePrefix(namespace: string) {
  return `${EXPECTED_ENTRIES_PREFIX}${namespace.length}:${namespace}_`;
}

export function getUserExpectedEntriesNamespace(userId: string) {
  return `user:${userId}`;
}

export function getExpectedEntriesStorageKey(namespace: string, year: number) {
  return `${getNamespacePrefix(namespace)}${year}`;
}

export function clearExpectedEntriesStorage(storage: Storage, namespace: string) {
  const namespacePrefix = getNamespacePrefix(namespace);
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && (key.startsWith(namespacePrefix) || LEGACY_EXPECTED_ENTRIES_KEY.test(key))) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
}
