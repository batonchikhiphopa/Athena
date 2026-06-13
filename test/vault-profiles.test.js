import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteVaultProfile,
  getActiveVaultProfileId,
  getVaultProfiles,
  renameVaultProfile,
  setActiveVaultProfileId,
  setVaultProfiles,
} from "../client/src/lib/vaultProfiles.ts";

const localStorageMock = new Map();

globalThis.localStorage = {
  clear() {
    localStorageMock.clear();
  },
  getItem(key) {
    return localStorageMock.get(key) ?? null;
  },
  key(index) {
    return Array.from(localStorageMock.keys())[index] ?? null;
  },
  removeItem(key) {
    localStorageMock.delete(key);
  },
  setItem(key, value) {
    localStorageMock.set(key, String(value));
  },
  get length() {
    return localStorageMock.size;
  },
};

test.beforeEach(() => {
  localStorage.clear();
});

test("renaming a vault profile trims the name and updates the mark", () => {
  setVaultProfiles([
    createProfile("personal", "Локальный профиль", "A"),
    createProfile("work", "Work", "W"),
  ]);

  const profiles = renameVaultProfile("work", "  Journal  ");

  assert.equal(profiles[1].name, "Journal");
  assert.equal(profiles[1].mark, "J");
});

test("deleting the active vault profile selects the next available profile", () => {
  setVaultProfiles([
    createProfile("personal", "Локальный профиль", "A"),
    createProfile("work", "Work", "W"),
  ]);
  setActiveVaultProfileId("work");

  const profiles = deleteVaultProfile("work");

  assert.deepEqual(
    profiles.map((profile) => profile.id),
    ["personal"],
  );
  assert.equal(getActiveVaultProfileId(), "personal");
});

test("the last vault profile cannot be deleted", () => {
  setVaultProfiles([createProfile("personal", "Локальный профиль", "A")]);
  setActiveVaultProfileId("personal");

  const profiles = deleteVaultProfile("personal");

  assert.equal(profiles.length, 1);
  assert.equal(getVaultProfiles().length, 1);
  assert.equal(getActiveVaultProfileId(), "personal");
});

function createProfile(id, name, mark) {
  return {
    id,
    name,
    caption: "Athena",
    mark,
  };
}
