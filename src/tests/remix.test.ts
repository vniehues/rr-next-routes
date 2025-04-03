import {assert, beforeEach, describe, expect, test, vi, beforeAll} from 'vitest'
import * as fs from "node:fs";
import {runSharedTests} from "./sharedTests";

vi.mock("node:fs", async () => {
    const memfs = await vi.importActual("memfs");
    return memfs.fs;
});

vi.mock('node:fs/promises', async () => {
    const memfs: { fs: typeof fs } = await vi.importActual('memfs')
    return memfs.fs.promises
})

vi.mock(import('@remix-run/route-config'), async (importOriginal) => {
    const mod = await importOriginal() // type is inferred
    return {
        ...mod,
        getAppDirectory: vi.fn(() => './app')
    }
})

vi.mock('../common/implementationResolver', async () => {
    const remixImpl = await vi.importActual<typeof import('../remix')>(
        '../remix'
    );
    return {
        resolveImplementation: () => remixImpl,
    };
});

runSharedTests('remix')