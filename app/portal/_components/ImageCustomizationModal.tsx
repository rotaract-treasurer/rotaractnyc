'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageCustomizationModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (customizedImage: {
    url: string;
    alt: string;
    caption: string;
    filter: string;
    dimensions: { width: number; height: number };
  }) => void;
}

export default function ImageCustomizationModal({
  isOpen,
  imageUrl,
  onClose,
  onSave,
}: ImageCustomizationModalProps) {
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('none');
  const [dimensions, setDimensions] = useState({ width: 1200, height: 630 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const filters = [
    { name: 'none', label: 'Original', css: 'none' },
    { name: 'grayscale', label: 'B&W', css: 'grayscale(100%)' },
    { name: 'sepia', label: 'Sepia', css: 'sepia(80%)' },
    { name: 'warm', label: 'Warm', css: 'saturate(1.2) contrast(1.1)' },
    { name: 'cool', label: 'Cool', css: 'hue-rotate(180deg) saturate(1.1)' },
    { name: 'vibrant', label: 'Vibrant', css: 'saturate(1.5) contrast(1.2)' },
    { name: 'vintage', label: 'Vintage', css: 'sepia(50%) contrast(1.1) brightness(0.95)' },
    { name: 'bright', label: 'Bright', css: 'brightness(1.2) saturate(1.1)' },
  ];

  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new window.Image();
      img.src = imageUrl;
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
      };
    }
  }, [isOpen, imageUrl]);

  const handleSave = () => {
    onSave({
      url: imageUrl,
      alt,
      caption,
      filter,
      dimensions,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#003a70] dark:text-blue-400">
              tune
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Customize Image
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Add filters, alt text, and captions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left: Preview */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-slate-100 dark:bg-zinc-950 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
              <Image
                ref={imgRef}
                src={imageUrl}
                alt="Preview"
                fill
                className="object-cover"
                style={{
                  filter: filters.find((f) => f.name === filter)?.css || 'none',
                }}
              />
            </div>

            {/* Filter Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">palette</span>
                Filters
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filters.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setFilter(f.name)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      filter === f.name
                        ? 'border-[#003a70] dark:border-blue-400 shadow-lg'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"
                      style={{
                        filter: f.css,
                      }}
                    />
                    <div className="absolute inset-0 flex items-end justify-center pb-1 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-[10px] font-bold text-white">
                        {f.label}
                      </span>
                    </div>
                    {filter === f.name && (
                      <div className="absolute top-1 right-1 bg-[#003a70] dark:bg-blue-400 rounded-full p-0.5">
                        <span className="material-symbols-outlined text-white dark:text-zinc-900 text-[14px]">
                          check
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Settings */}
          <div className="space-y-6">
            {/* Alt Text */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">accessibility</span>
                Alt Text (for accessibility)
              </label>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe this image for screen readers..."
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-[#003a70]/20 focus:border-[#003a70] dark:focus:border-blue-400 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                Helps visually impaired users understand the image content
              </p>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">notes</span>
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to display below the image..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-[#003a70]/20 focus:border-[#003a70] dark:focus:border-blue-400 outline-none transition-all resize-none"
              />
            </div>

            {/* Image Info */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                Image Information
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-zinc-500">Width:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {dimensions.width}px
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-500">Height:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {dimensions.height}px
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-[#003a70] dark:text-blue-400 text-[20px] shrink-0">
                  lightbulb
                </span>
                <div className="text-xs text-slate-700 dark:text-zinc-300 space-y-1">
                  <p className="font-semibold">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-zinc-400">
                    <li>Optimal size: 1200x630px for social sharing</li>
                    <li>Always add descriptive alt text</li>
                    <li>Keep file size under 5MB for faster loading</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => {
              setAlt('');
              setCaption('');
              setFilter('none');
            }}
            className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Reset All
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-bold bg-[#003a70] hover:bg-[#003a70]/90 text-white rounded-lg shadow-lg shadow-[#003a70]/20 transition-all flex items-center gap-2"
            >
              Apply Changes
              <span className="material-symbols-outlined text-[18px]">check</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
