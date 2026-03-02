'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';

interface Props {
    onImageSelect: (file: File) => void;
    preview: string | null;
    onClear: () => void;
}

export default function ImageUploader({ onImageSelect, preview, onClear }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = useCallback(
        (file: File) => {
            if (file.type.startsWith('image/')) {
                onImageSelect(file);
            }
        },
        [onImageSelect]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                上传图片
            </label>

            {preview ? (
                <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                    <img src={preview} alt="preview" className="w-full h-48 object-contain p-2" />
                    <button
                        onClick={onClear}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${dragging
                            ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
                            : 'border-white/20 bg-white/5 hover:border-violet-400/60 hover:bg-violet-500/5'
                        }`}
                >
                    <div className={`p-4 rounded-full mb-3 transition-all duration-300 ${dragging ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                        {dragging ? (
                            <ImageIcon className="w-8 h-8 text-violet-400" />
                        ) : (
                            <Upload className="w-8 h-8 text-slate-400" />
                        )}
                    </div>
                    <p className="text-sm text-slate-300 font-medium">
                        {dragging ? '松开以上传' : '拖放图片或点击上传'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">支持 PNG、JPG、WebP、GIF</p>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
        </div>
    );
}
