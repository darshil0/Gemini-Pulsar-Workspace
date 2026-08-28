import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn } from '../lib/utils';
import { analyzeEmail, transformImage } from '../services/gemini';

describe('Utility - cn', () => {
  it('combines class names correctly with tailwind-merge', () => {
    expect(cn('px-2 py-1', 'bg-red-500', { 'text-white': true })).toBe('px-2 py-1 bg-red-500 text-white');
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('Gemini Client Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('analyzeEmail posts content to /api/analyze-email', async () => {
    const mockData = {
      category: 'Work',
      priority: 'high',
      mood: 'Urgent',
      actionItems: ['Review report'],
      draftReply: 'I will review it soon.',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await analyzeEmail('Please review the report ASAP.');
    expect(fetch).toHaveBeenCalledWith('/api/analyze-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailContent: 'Please review the report ASAP.' }),
    });
    expect(result).toEqual(mockData);
  });

  it('analyzeEmail throws error on non-ok response', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    await expect(analyzeEmail('Test content')).rejects.toThrow('Failed to analyze email via proxy');
  });

  it('transformImage strips base64 header prefix and posts data', async () => {
    const mockResponse = {
      imageUrl: 'data:image/png;base64,resultData',
      analysis: 'Transformed into sketch.',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const inputDataUri = 'data:image/png;base64,rawImageDataHere';
    const result = await transformImage(inputDataUri, 'image/png', 'Transform to sketch');

    expect(fetch).toHaveBeenCalledWith('/api/transform-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'rawImageDataHere',
        mimeType: 'image/png',
        instruction: 'Transform to sketch',
      }),
    });
    expect(result).toEqual(mockResponse);
  });
});

describe('Audio Frame PCM Byte Alignment', () => {
  it('correctly aligns odd byte buffers without throwing RangeError', () => {
    // Simulate odd byte buffer (3 bytes)
    const binary = '\x01\x02\x03';
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const alignedLength = bytes.length - (bytes.length % 2);
    expect(alignedLength).toBe(2);

    const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, alignedLength / 2);
    expect(pcm16.length).toBe(1);
  });
});
