/* eslint-disable promise/prefer-await-to-callbacks */
import * as React from "react";

const LOCAL_STORAGE_CHANGE_EVENT = "srdl-local-storage-change";
const MISSING_LOCAL_STORAGE_VALUE = "__srdl_local_storage_missing__";

interface LocalStorageChangeEventDetail {
  key: string;
}

export type LocalStorageSetter<T> = T | ((previousValue: T) => T);

export interface LocalStorageOptions<T> {
  defaultValue: T | (() => T);
  serializer?: (value: T) => string;
  deserializer?: (rawValue: string) => T;
}

const resolveDefaultValue = <T>(defaultValue: LocalStorageOptions<T>["defaultValue"]): T =>
  typeof defaultValue === "function" ? (defaultValue as () => T)() : defaultValue;

const getSerializer = <T>(serializer?: (value: T) => string) => serializer ?? JSON.stringify;

const getDeserializer = <T>(deserializer?: (rawValue: string) => T) =>
  deserializer ?? ((rawValue: string) => JSON.parse(rawValue) as T);

const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const dispatchStorageChange = (key: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<LocalStorageChangeEventDetail>(LOCAL_STORAGE_CHANGE_EVENT, {
      detail: { key },
    }),
  );
};

export function readLocalStorageValue<T>(key: string, options: LocalStorageOptions<T>): T {
  const localStorage = getLocalStorage();
  const defaultValue = resolveDefaultValue(options.defaultValue);

  if (!localStorage) {
    return defaultValue;
  }

  const rawValue = localStorage.getItem(key);
  if (rawValue === null) {
    return defaultValue;
  }

  try {
    return getDeserializer(options.deserializer)(rawValue);
  } catch {
    return defaultValue;
  }
}

export function writeLocalStorageValue<T>(
  key: string,
  value: T,
  options?: Pick<LocalStorageOptions<T>, "serializer">,
): void {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  localStorage.setItem(key, getSerializer(options?.serializer)(value));
  dispatchStorageChange(key);
}

export function removeLocalStorageValue(key: string): void {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  localStorage.removeItem(key);
  dispatchStorageChange(key);
}

export function useLocalStorage<T>(
  key: string,
  options: LocalStorageOptions<T>,
): readonly [T, (value: LocalStorageSetter<T>) => void, () => void] {
  const defaultValue = React.useMemo(
    () => resolveDefaultValue(options.defaultValue),
    [options.defaultValue],
  );
  const deserializer = React.useMemo(
    () => getDeserializer(options.deserializer),
    [options.deserializer],
  );
  const snapshotRef = React.useRef<{
    rawValue: string | null;
    value: T;
  }>({
    rawValue: MISSING_LOCAL_STORAGE_VALUE,
    value: defaultValue,
  });

  React.useEffect(() => {
    snapshotRef.current = {
      rawValue: MISSING_LOCAL_STORAGE_VALUE,
      value: defaultValue,
    };
  }, [defaultValue]);

  const getSnapshot = React.useCallback(() => {
    const localStorage = getLocalStorage();
    if (!localStorage) {
      return defaultValue;
    }

    const rawValue = localStorage.getItem(key);
    if (snapshotRef.current.rawValue === rawValue) {
      return snapshotRef.current.value;
    }

    if (rawValue === null) {
      snapshotRef.current = {
        rawValue,
        value: defaultValue,
      };
      return defaultValue;
    }

    try {
      const value = deserializer(rawValue);
      snapshotRef.current = {
        rawValue,
        value,
      };
      return value;
    } catch {
      snapshotRef.current = {
        rawValue,
        value: defaultValue,
      };
      return defaultValue;
    }
  }, [defaultValue, deserializer, key]);

  const subscribe = React.useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") {
        return () => void 0;
      }

      const handleNativeStorage = (event: StorageEvent) => {
        if (event.key === key) {
          callback();
        }
      };
      const handleCustomStorage = (event: Event) => {
        const { detail } = event as CustomEvent<LocalStorageChangeEventDetail>;
        if (detail.key === key) {
          callback();
        }
      };

      window.addEventListener("storage", handleNativeStorage);
      window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleCustomStorage);

      return () => {
        window.removeEventListener("storage", handleNativeStorage);
        window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleCustomStorage);
      };
    },
    [key],
  );

  const storedValue = React.useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  const setValue = React.useCallback(
    (value: LocalStorageSetter<T>) => {
      const nextValue =
        typeof value === "function"
          ? (value as (previousValue: T) => T)(readLocalStorageValue(key, options))
          : value;

      writeLocalStorageValue(key, nextValue, {
        serializer: options.serializer,
      });
    },
    [key, options],
  );

  const removeValue = React.useCallback(() => {
    removeLocalStorageValue(key);
  }, [key]);

  return [storedValue, setValue, removeValue] as const;
}
