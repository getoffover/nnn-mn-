```typescript
/**
 * Test utilities for unit and integration tests.
 * Provides helpers for mocking, assertions, and test data generation.
 */

import type { Mock } from 'vitest';
import { vi } from 'vitest';

// Types
export type MockFunction<T extends (...args: any[]) => any> = Mock<T>;

// Helper to create a mock function with proper typing
export function createMock<T extends (...args: any[]) => any>(fn?: T): MockFunction<T> {
  return vi.fn(fn);
}

// Helper to create a resolved promise
export function resolvePromise<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// Helper to create a rejected promise
export function rejectPromise<T = never>(error: Error): Promise<T> {
  return Promise.reject(error);
}

// Helper to create a mock Result<T, E> success
export function mockSuccess<T, E>(value: T): { ok: true; value: T; error?: never } {
  return { ok: true, value };
}

// Helper to create a mock Result<T, E> failure
export function mockFailure<T, E>(error: E): { ok: false; error: E; value?: never } {
  return { ok: false, error };
}

// Helper to create a mock Card object
export function createMockCard(rank: string, suit: string) {
  return {
    rank,
    suit,
    toString: () => `${rank}${suit}`,
  };
}

// Helper to create a mock Board state
export function createMockBoard(cards: Array<{ rank: string; suit: string }>) {
  return {
    cards: cards.map(c => createMockCard(c.rank, c.suit)),
    street: 'river',
  };
}

// Helper to create a mock HandState
export function createMockHandState(
  heroCards: Array<{ rank: string; suit: string }>,
  boardCards: Array<{ rank: string; suit: string }>,
  potSize: number,
  effectiveStack: number,
  position: 'UTG' | 'HJ' | 'CO' | 'BN' | 'SB' | 'BB',
  aggressorCount: number = 0,
) {
  return {
    heroCards: heroCards.map(c => createMockCard(c.rank, c.suit)),
    board: createMockBoard(boardCards),
    potSize,
    effectiveStack,
    position,
    aggressorCount,
    street: 'river',
  };
}

// Helper to create a mock EquityResult
export function createMockEquityResult(
  equity: number,
  variance: number,
  samples: number,
  confidenceInterval: [number, number],
) {
  return {
    equity,
    variance,
    samples,
    confidenceInterval,
  };
}

// Helper to create a mock CardDetectionResult
export function createMockCardDetectionResult(
  cards: Array<{ rank: string; suit: string; confidence: number }>,
  timestamp: number,
) {
  return {
    cards: cards.map(c => createMockCard(c.rank, c.suit)),
    confidence: cards.reduce((acc, c) => acc + c.confidence, 0) / cards.length,
    timestamp,
  };
}

// Helper to create a mock OCRResult
export function createMockOCRResult(
  text: string,
  confidence: number,
  boundingBox: { x: number; y: number; width: number; height: number },
) {
  return {
    text,
    confidence,
    boundingBox,
  };
}

// Helper to create a mock ActionRecommendation
export function createMockActionRecommendation(
  action: 'fold' | 'call' | 'raise',
  reason: string,
  confidence: number,
  betSize?: number,
) {
  return {
    action,
    reason,
    confidence,
    betSize,
  };
}

// Helper to mock localStorage
export function mockLocalStorage() {
  const store: Record<string, string> = {};
  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    length: vi.fn(() => Object.keys(store).length),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
  return localStorageMock;
}

// Helper to mock window.matchMedia
export function mockMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockImplementation(() => mediaQueryList);
}

// Helper to mock IPC channels
export function mockIpcRenderer() {
  const listeners: Record<string, Array<(event: any, ...args: any[]) => void>> = {};
  return {
    send: vi.fn((channel: string, ...args: any[]) => {}),
    on: vi.fn((channel: string, listener: (event: any, ...args: any[]) => void) => {
      if (!listeners[channel]) listeners[channel] = [];
      listeners[channel].push(listener);
      return { dispose: () => { /* no-op for test */ } };
    }),
    once: vi.fn((channel: string, listener: (event: any, ...args: any[]) => void) => {
      if (!listeners[channel]) listeners[channel] = [];
      const wrapped = (event: any, ...args: any[]) => {
        listener(event, ...args);
        const idx = listeners[channel].indexOf(wrapped);
        if (idx !== -1) listeners[channel].splice(idx, 1);
      };
      listeners[channel].push(wrapped);
      return { dispose: () => { /* no-op for test */ } };
    }),
    removeListener: vi.fn((channel: string, listener: any) => {
      if (listeners[channel]) {
        const idx = listeners[channel].indexOf(listener);
        if (idx !== -1) listeners[channel].splice(idx, 1);
      }
    }),
    removeAllListeners: vi.fn((channel?: string) => {
      if (channel) delete listeners[channel];
      else Object.keys(listeners).forEach(k => delete listeners[k]);
    }),
    invoke: vi.fn((channel: string, ...args: any[]) => Promise.resolve(null)),
    sendSync: vi.fn((channel: string, ...args: any[]) => null),
  };
}

// Helper to mock desktopCapturer
export function mockDesktopCapturerSources(sources: Array<{ id: string; name: string; thumbnail: { toDataURL: () => string } }>) {
  const mockSource = {
    getSources: vi.fn((options: any, callback: (err: Error | null, sources: any[]) => void) => {
      callback(null, sources);
    }),
  };
  (navigator as any).desktopCapturer = mockSource;
}

// Helper to mock OffscreenCanvas
export function mockOffscreenCanvas() {
  const canvas = {
    width: 1920,
    height: 1080,
    context: {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(1920 * 1080 * 4).fill(255),
        width: 1920,
        height: 1080,
      })),
      putImageData: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    } as any,
    transferToImageBitmap: vi.fn(() => ({} as ImageBitmap)),
    convertToBlob: vi.fn(() => Promise.resolve(new Blob())),
  };
  return canvas;
}

// Helper to mock Worker
export function mockWorker() {
  const onmessage = vi.fn();
  const onerror = vi.fn();
  const postMessage = vi.fn();
  const terminate = vi.fn();
  return {
    onmessage,
    onerror,
    postMessage,
    terminate,
    addEventListener: vi.fn((event: string, handler: any) => {
      if (event === 'message') onmessage(handler);
      if (event === 'error') onerror(handler);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

// Helper to mock ResizeObserver
export function mockResizeObserver(entries: ResizeObserverEntry[]) {
  const observer = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
  const mock = vi.fn((callback: (entries: ResizeObserverEntry[]) => void) => {
    callback(entries);
    return observer;
  });
  (window as any).ResizeObserver = mock as any;
}

// Helper to mock IntersectionObserver
export function mockIntersectionObserver(entries: IntersectionObserverEntry[]) {
  const observer = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
  const mock = vi.fn((callback: (entries: IntersectionObserverEntry[]) => void) => {
    callback(entries);
    return observer;
  });
  (window as any).IntersectionObserver = mock as any;
}

// Helper to mock requestAnimationFrame
export function mockAnimationFrame() {
  let callbacks: Array<(time: number) => void> = [];
  const mock = vi.fn((callback: (time: number) => void) => {
    callbacks.push(callback);
    return callbacks.length - 1;
  });
  const cancel = vi.fn((id: number) => {
    if (id >= 0 && id < callbacks.length) callbacks[id] = () => {};
  });
  const runAll = vi.fn((time: number = 0) => {
    callbacks.forEach(cb => cb(time));
    callbacks = [];
  });
  (window as any).requestAnimationFrame = mock;
  (window as any).cancelAnimationFrame = cancel;
  return { mock, cancel, runAll };
}

// Helper to mock performance.now
export function mockPerformanceNow(values: number[]) {
  let i = 0;
  (performance as any).now = vi.fn(() => {
    const val = values[i % values.length];
    i++;
    return val;
  });
}

// Helper to mock Date.now
export function mockDateNow(values: number[]) {
  let i = 0;
  const originalDateNow = Date.now;
  (Date as any).now = vi.fn(() => {
    const val = values[i % values.length];
    i++;
    return val;
  });
  return () => { (Date as any).now = originalDateNow; };
}

// Helper to mock fetch
export function mockFetch(json: any, status: number = 200) {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(() => Promise.resolve(json)),
    text: vi.fn(() => Promise.resolve(JSON.stringify(json))),
    clone: vi.fn(() => mockResponse),
  };
  global.fetch = vi.fn(() => Promise.resolve(mockResponse as Response));
}

// Helper to mock console methods
export function mockConsole() {
  const mocks = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
  Object.assign(console, mocks);
  return mocks;
}

// Helper to reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks();
}

// Helper to create a mock DOM element
export function createMockElement(tagName: string, attributes: Record<string, string> = {}) {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

// Helper to create a mock canvas element
export function createMockCanvas(width: number = 1920, height: number = 1080) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}

// Helper to create a mock image element
export function createMockImage(src: string = '', width: number = 100, height: number = 100) {
  const img = new Image();
  img.src = src;
  img.width = width;
  img.height = height;
  return img;
}

// Helper to wait for a specified time
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to flush all promises
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
}

// Helper to wait for animation frame
export async function waitForAnimationFrame(): Promise<void> {
  await new Promise(requestAnimationFrame);
}

// Helper to mock window.innerWidth/Height
export function mockWindowDimensions(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
}

// Helper to mock document.documentElement.clientWidth/Height
export function mockDocumentDimensions(width: number, height: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', { value: width, writable: true });
  Object.defineProperty(document.documentElement, 'clientHeight', { value: height, writable: true });
}

// Helper to mock getComputedStyle
export function mockGetComputedStyle(styles: Record<string, string>) {
  const original = window.getComputedStyle;
  window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
    const base = original(elt, pseudoElt);
    return {
      ...base,
      getPropertyValue: (prop: string) => styles[prop] ?? base.getPropertyValue(prop),
    };
  };
  return () => { window.getComputedStyle = original; };
}

// Helper to mock localStorage with initial data
export function setupLocalStorage(initialData: Record<string, any> = {}) {
  const store = { ...initialData };
  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  };
  (window as any).localStorage = localStorageMock;
  return localStorageMock;
}

// Helper to mock navigator.mediaDevices
export function mockMediaDevices() {
  const mockStream = {
    getTracks: vi.fn(() => []),
    getVideoTracks: vi.fn(() => []),
    getAudioTracks: vi.fn(() => []),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(() => mockStream),
  };
  const mockMediaDevices = {
    enumerateDevices: vi.fn(() => Promise.resolve([])),
    getDisplayMedia: vi.fn(() => Promise.resolve(mockStream)),
    getUserMedia: vi.fn(() => Promise.resolve(mockStream)),
  };
  (navigator as any).mediaDevices = mockMediaDevices;
  return mockMediaDevices;
}

// Helper to mock worker thread
export function mockWorkerThread() {
  const onmessage = vi.fn();
  const onerror = vi.fn();
  const postMessage = vi.fn();
  const terminate = vi.fn();
  const mockWorker = {
    onmessage,
    onerror,
    postMessage,
    terminate,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
  return mockWorker;
}

// Helper to mock OnnxRuntime
export function mockOnnxRuntime() {
  const mockSession = {
    run: vi.fn(() => Promise.resolve([{ name: 'output', type: 'float32', shape: [1, 1], data: new Float32Array([0.5]) }])),
  };
  const mockInferenceSession = {
    create: vi.fn(() => Promise.resolve(mockSession)),
  };
  return {
    InferenceSession: mockInferenceSession,
  };
}

// Helper to mock Tesseract
export function mockTesseract() {
  const mockWorker = {
    terminate: vi.fn(),
    postMessage: vi.fn(),
    onmessage: vi.fn(),
    onerror: vi.fn(),
  };
  const mockRecognize = vi.fn(() => Promise.resolve({
    data: {
      text: 'K♠ Q♥ J♦ 10♣ 9♠',
      confidence: 95.5,
      boxes: [],
      par: { blocks: [] },
    },
  }));
  return {
    createWorker: vi.fn(() => Promise.resolve(mockWorker)),
    recognize: mockRecognize,
  };
}

// Helper to mock TesseractAdapter
export function mockTesseractAdapter() {
  const mockOcrProcessor = {
    process: vi.fn(() => Promise.resolve({ text: 'K♠ Q♥ J♦ 10♣ 9♠', confidence: 95.5 })),
  };
  return mockOcrProcessor;
}

// Helper to mock CanvasPreprocessor
export function mockCanvasPreprocessor() {
  const mockPreprocessor = {
    preprocess: vi.fn(() => ({
      width: 1920,
      height: 1080,
      data: new Uint8ClampedArray(1920 * 1080 * 4),
    })),
  };
  return mockPreprocessor;
}

// Helper to mock OffscreenCanvasAdapter
export function mockOffscreenCanvasAdapter() {
  const mockAdapter = {
    createCanvas: vi.fn(() => ({
      width: 1920,
      height: 1080,
      context: {
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(1920 * 1080 * 4).fill(255), width: 1920, height: 1080 })),
        putImageData: vi.fn(),
      },
    })),
    createOffscreenCanvas: vi.fn(() => ({
      width: 1920,
      height: 1080,
      transferToImageBitmap: vi.fn(() => ({} as ImageBitmap)),
    })),
  };
  return mockAdapter;
}

// Helper to mock DesktopCapturerAdapter
export function mockDesktopCapturerAdapter