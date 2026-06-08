```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnnxRuntimeAdapter } from '../../../infrastructure/cv/OnnxRuntimeAdapter';
import * as ort from 'onnxruntime-web';

// Mock ONNX Runtime Web
vi.mock('onnxruntime-web', () => {
  const mockSession = {
    close: vi.fn(),
    run: vi.fn(),
  };
  const mockInferenceSession = {
    create: vi.fn().mockResolvedValue(mockSession),
  };
  return {
    InferenceSession: mockInferenceSession,
    Session: mockInferenceSession,
    Environment: {
      make: vi.fn().mockReturnValue({}),
    },
    setWasmPath: vi.fn(),
  };
});

describe('OnnxRuntimeAdapter', () => {
  let adapter: OnnxRuntimeAdapter;
  const mockModelPath = 'models/yolov8n.onnx';
  const mockInputTensor = new Float32Array(3 * 640 * 640).fill(0.5);
  const mockInputName = 'images';
  const mockOutputName = 'output0';

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new OnnxRuntimeAdapter();
  });

  afterEach(async () => {
    await adapter.dispose();
  });

  describe('constructor', () => {
    it('should initialize ONNX Runtime with wasm path', async () => {
      expect(ort.setWasmPath).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should create inference session with provided model path', async () => {
      await adapter.initialize(mockModelPath);
      expect(ort.InferenceSession.create).toHaveBeenCalledWith(
        mockModelPath,
        expect.objectContaining({ executionProviders: ['wasm'] })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(ort.InferenceSession.create).mockRejectedValueOnce(new Error('Model load failed'));
      await expect(adapter.initialize(mockModelPath)).rejects.toThrow('Model load failed');
    });
  });

  describe('infer', () => {
    beforeEach(async () => {
      await adapter.initialize(mockModelPath);
    });

    it('should run inference with correct input tensor', async () => {
      const mockOutput = {
        [mockOutputName]: {
          data: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]),
          dims: [1, 84, 8400],
        },
      };
      vi.mocked(ort.InferenceSession.create).mockResolvedValueOnce({
        run: vi.fn().mockResolvedValue(mockOutput),
        close: vi.fn(),
      } as any);

      const result = await adapter.infer(mockInputTensor, mockInputName, mockOutputName);
      expect(result).toEqual(mockOutput[mockOutputName]);
    });

    it('should throw error if session is not initialized', async () => {
      const uninitAdapter = new OnnxRuntimeAdapter();
      await expect(uninitAdapter.infer(mockInputTensor, mockInputName, mockOutputName)).rejects.toThrow(
        'Session not initialized. Call initialize() first.'
      );
    });

    it('should handle inference errors', async () => {
      vi.mocked(ort.InferenceSession.create).mockResolvedValueOnce({
        run: vi.fn().mockRejectedValue(new Error('Inference failed')),
        close: vi.fn(),
      } as any);

      await expect(adapter.infer(mockInputTensor, mockInputName, mockOutputName)).rejects.toThrow('Inference failed');
    });
  });

  describe('dispose', () => {
    it('should close the session if it exists', async () => {
      await adapter.initialize(mockModelPath);
      await adapter.dispose();
      expect(ort.InferenceSession.create).toHaveBeenCalled();
      const session = await (ort.InferenceSession.create as any).mock.results[0].value;
      expect(session.close).toHaveBeenCalled();
    });

    it('should not throw if session is not initialized', async () => {
      const uninitAdapter = new OnnxRuntimeAdapter();
      await expect(uninitAdapter.dispose()).resolves.not.toThrow();
    });

    it('should clear internal session reference', async () => {
      await adapter.initialize(mockModelPath);
      await adapter.dispose();
      expect((adapter as any).session).toBeNull();
    });
  });

  describe('getVersion', () => {
    it('should return ONNX Runtime version', () => {
      const version = adapter.getVersion();
      expect(version).toBe(ort.version);
    });
  });
});
```