'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { HardDrive, UploadCloud, Music, FileAudio, Check, Loader2, Zap } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function PublicConverterPage() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    setSuccess(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    setSuccess(false);

    // Validate size and type
    if (selectedFile.size > 100 * 1024 * 1024) { // 100 MB max for public
      setError(t('converter.fileTooLarge'));
      return;
    }
    
    if (!selectedFile.name.toLowerCase().endsWith('.mp4')) {
      setError(t('converter.unsupportedFormat'));
      return;
    }

    setFile(selectedFile);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call the public conversion endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || t('converter.conversionFailed'));
      }

      // Automatically download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const originalName = file.name.split('.').slice(0, -1).join('.') || 'audio';
      a.download = `${originalName}.mp3`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setFile(null); // Clear file after success
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('converter.conversionFailed'));
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-[var(--accent)] selection:text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between mx-4 my-4 rounded-2xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-[0_0_15px_var(--accent-glow)]">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight font-display">CloudVault<span className="text-[var(--accent)]">.</span></span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/auth/login" className="text-sm font-semibold hover:text-[var(--accent)] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
            {t('header.login')}
          </Link>
          <Link href="/auth/register" className="btn-primary text-sm shadow-xl hidden xs:flex">
            {t('header.getStarted')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />

        <div className="max-w-2xl w-full text-center mb-8 animate-in delay-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm mb-6 border border-[var(--accent)]/20">
            <Zap className="w-4 h-4" /> {t('converter.badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 font-display">
            {t('converter.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-400">{t('converter.title2')}</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-lg mx-auto">
            {t('converter.desc')}
          </p>
        </div>

        {/* Converter Card */}
        <div className="glass p-8 md:p-12 w-full max-w-2xl rounded-3xl shadow-2xl relative animate-in delay-2 z-10 border border-white/5 bg-white/5 backdrop-blur-3xl">
          {!file && !isConverting && !success && (
            <div 
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xl font-bold font-display mb-1">{t('converter.dropTitle')}</p>
                <p className="text-slate-400 text-sm">{t('converter.dropDesc')}</p>
              </div>
            </div>
          )}

          {file && !isConverting && !success && (
            <div className="flex flex-col items-center text-center animate-in">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <Music className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2 font-display break-all">{file.name}</h3>
              <p className="text-slate-400 mb-8">{t('converter.readyLabel')} - {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setFile(null)} 
                  className="glass flex-1 py-4 font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                  {t('converter.cancelBtn')}
                </button>
                <button 
                  onClick={handleConvert} 
                  className="btn-primary flex-1 py-4 shadow-xl text-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 font-bold flex items-center justify-center gap-2">
                    {t('converter.convertBtn')} <Zap className="w-5 h-5 fill-current" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          )}

          {isConverting && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in">
              <Loader2 className="w-16 h-16 text-[var(--accent)] animate-spin mb-6" />
              <h3 className="text-2xl font-bold mb-2 font-display">{t('converter.extracting')}</h3>
              <p className="text-slate-400">{t('converter.waitingText')}</p>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center text-center py-8 animate-in">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <Check className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-black mb-4 font-display text-emerald-400">{t('converter.success')}</h3>
              <p className="text-slate-300 mb-8 text-lg">{t('converter.successDesc')}</p>
              
              <button 
                onClick={() => setSuccess(false)} 
                className="btn-primary shadow-xl py-4 px-10 rounded-xl font-bold flex items-center gap-3"
              >
                <FileAudio className="w-5 h-5" />
                {t('converter.convertAnother')}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center animate-in">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".mp4" 
            onChange={handleFileChange} 
          />
        </div>

        {/* Security / Privacy Banner */}
        <div className="mt-16 flex items-center gap-3 text-slate-500 text-sm bg-black/30 px-6 py-3 rounded-full border border-white/5 animate-in delay-3">
          <Check className="w-4 h-4 text-emerald-500" /> 
          {t('converter.privacyBanner')}
        </div>
      </main>
    </div>
  );
}
