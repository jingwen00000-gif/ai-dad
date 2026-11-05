"use client";

/**
 * 爸爸的 3D 形象文件（.vrm，通常 10~30MB）存在本机 IndexedDB。
 * localStorage 放不下这么大的文件；以后接后端时改为上传到对象存储。
 * 所有读写都包在 try/catch 里：隐私模式等情况下 IndexedDB 可能不可用。
 */

const DB = "ai-dad";
const STORE = "files";
const KEY = "dad.vrm";

export const MAX_VRM_BYTES = 60 * 1024 * 1024;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

// 解析好的文件内容在内存里缓存一份，换页时不用重复读取
let memo: { version: number; data: ArrayBuffer } | null = null;

export async function loadVrm(version: number): Promise<ArrayBuffer | null> {
  if (memo && memo.version === version) return memo.data;
  try {
    const blob = await run<Blob | undefined>("readonly", (s) => s.get(KEY));
    if (!blob) return null;
    const data = await blob.arrayBuffer();
    memo = { version, data };
    return data;
  } catch {
    return null;
  }
}

export async function saveVrm(file: Blob): Promise<void> {
  await run("readwrite", (s) => s.put(file, KEY));
  memo = null;
}

export async function deleteVrm(): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(KEY));
  } finally {
    memo = null;
  }
}
