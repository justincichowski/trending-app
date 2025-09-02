"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.getInflight = getInflight;
exports.setInflight = setInflight;
exports.hashKey = hashKey;
const _cache = new Map();
const _inflight = new Map();
function getCache(key) {
    const hit = _cache.get(key);
    if (!hit)
        return undefined;
    if (hit.expiresAt < Date.now()) {
        _cache.delete(key);
        return undefined;
    }
    return hit.value;
}
function setCache(key, value, ttlMs) {
    _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
function getInflight(key) {
    const p = _inflight.get(key);
    return p;
}
function setInflight(key, p) {
    _inflight.set(key, p);
    p.finally(() => _inflight.delete(key));
}
function hashKey(obj) {
    try {
        return JSON.stringify(obj);
    }
    catch {
        return String(obj);
    }
}
