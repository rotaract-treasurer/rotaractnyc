'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { getAuth } from 'firebase/auth';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import ImageCustomizationModal from './ImageCustomizationModal';
import { sanitizeHtml } from '@/lib/utils/sanitize';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageMetadata {
  url: string;
  alt: string;
  caption: string;
  filter: string;
  dimensions: { width: number; height: number };
}

export default function NewPostModal({ isOpen, onClose }: NewPostModalProps) {
  const { user, userData } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Community Service');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const [showImageCustomization, setShowImageCustomization] = useState(false);
  const [publicationDate, setPublicationDate] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [wordCount, setWordCount] = useState(0);
  const [lastEdited, setLastEdited] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setPublicationDate(today);
      updateLastEdited();
    }
  }, [isOpen]);

  useEffect(() => {
    // Count words - strip HTML tags for accurate count
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  const updateLastEdited = () => {
    setLastEdited('just now');
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - Date.now()) / 60000);
      if (diff === 0) setLastEdited('just now');
      else if (diff === 1) setLastEdited('1 min ago');
      else setLastEdited(`${diff} mins ago`);
    }, 60000);
    return () => clearInterval(interval);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setFeaturedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setFeaturedImagePreview(url);
      // Automatically open customization modal when image is uploaded
      setShowImageCustomization(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageCustomizationSave = (metadata: ImageMetadata) => {
    setImageMetadata(metadata);
    setShowImageCustomization(false);
  };

  const uploadFeaturedImage = async (idToken: string) => {
    if (!featuredImage) return '';

    const formData = new FormData();
    formData.append('file', featuredImage);
    formData.append('folder', 'posts');

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
      body: formData,
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const message = payload && typeof payload === 'object' && typeof payload.error === 'string'
        ? payload.error
        : 'Image upload failed';
      throw new Error(message);
    }

    const url = payload && typeof payload === 'object' && typeof payload.url === 'string'
      ? payload.url
      : '';
    if (!url) {
      throw new Error('Image upload failed');
    }

    return url;
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaveStatus('saving');
    setIsSaving(true);
    
    try {
      // Create slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Get Firebase ID token
      const app = getFirebaseClientApp();
      if (!app) throw new Error('Firebase not initialized');
      
      const auth = getAuth(app);
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const imageUrl = await uploadFeaturedImage(idToken);

      // Split content into paragraphs
      const contentArray = content
        .split(/<\/p>|<br\s*\/?>/i)
        .map(p => p.replace(/<[^>]*>/g, '').trim())
        .filter(Boolean);
      
      // Generate excerpt
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      const excerpt = plainText.length > 150 
        ? plainText.substring(0, 150) + '...' 
        : plainText;

      // Save as draft (published: false)
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          slug,
          title,
          content: contentArray,
          excerpt,
          category,
          date: publicationDate,
          published: false, // Save as draft
          author: user?.displayName || user?.email || 'Admin',
          featuredImage: imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save draft');
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Show success message
      alert('Draft saved successfully! You can continue editing or publish later.');
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      alert(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }

    setSaveStatus('saving');
    setIsSaving(true);
    
    try {
      // Create slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Get Firebase ID token
      const app = getFirebaseClientApp();
      if (!app) throw new Error('Firebase not initialized');
      
      const auth = getAuth(app);
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Upload featured image if present
      const imageUrl = await uploadFeaturedImage(idToken);

      // Split content into paragraphs and filter empty ones
      const contentArray = content
        .split(/<\/p>|<br\s*\/?>/i)
        .map(p => p.replace(/<[^>]*>/g, '').trim())
        .filter(Boolean);
      
      // Generate excerpt by stripping HTML tags and taking first 150 chars
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      const excerpt = plainText.length > 150 
        ? plainText.substring(0, 150) + '...' 
        : plainText;

      // Create post
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          slug,
          title,
          content: contentArray,
          excerpt,
          category,
          date: publicationDate,
          published: publishImmediately, // Respect the publish setting
          featuredImage: imageUrl,
          imageMetadata: imageMetadata ? {
            alt: imageMetadata.alt,
            caption: imageMetadata.caption,
            filter: imageMetadata.filter,
          } : undefined,
          author: user?.displayName || user?.email || 'Admin',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      setSaveStatus('saved');
      alert(publishImmediately ? 'Post published successfully!' : 'Post saved as draft!');
      onClose();
      
      // Reset form
      setTitle('');
      setContent('');
      setFeaturedImage(null);
      setFeaturedImagePreview(null);
      setImageMetadata(null);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Error publishing post:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      alert(`Failed to publish post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop z-[9999] flex items-start justify-center p-4 md:p-8 overflow-y-auto" onClick={onClose}>
      <div 
        className="w-full max-w-[1100px] max-h-[90vh] my-8 modal-content flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-blue-900 dark:text-blue-400">
                <svg className="size-6" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark leading-none">Create New Post</h1>
                <span className="text-xs font-medium text-text-muted dark:text-text-muted-dark uppercase tracking-widest mt-1 flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${publishImmediately ? 'bg-status-success' : 'bg-status-warning'}`}></span>
                  {publishImmediately ? 'Will Publish Immediately' : 'Will Save as Draft'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            {saveStatus === 'saving' && (
              <div className="badge-info flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="badge-success flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Saved!</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="badge-error flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>Error</span>
              </div>
            )}
            
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !title.trim()}
              className="btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="btn-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSaving ? 'Processing...' : (publishImmediately ? 'Publish' : 'Save as Draft')}</span>
              <span className="material-symbols-outlined text-[18px] ml-1">{publishImmediately ? 'send' : 'save'}</span>
            </button>
            <div className="w-px h-6 bg-border-light dark:bg-border-dark mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {isPreviewMode ? (
            /* Preview Mode */
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
              <article className="max-w-4xl mx-auto px-8 py-12">
                {/* Featured Image Preview */}
                {featuredImagePreview && (
                  <div className="mb-8 rounded-xl overflow-hidden">
                    <div className="relative w-full aspect-video">
                      <Image
                        src={featuredImagePreview}
                        alt={imageMetadata?.alt || title || 'Featured image'}
                        fill
                        className="object-cover"
                        style={{
                          filter: imageMetadata?.filter && imageMetadata.filter !== 'none' 
                            ? imageMetadata.filter 
                            : 'none',
                        }}
                      />
                    </div>
                    {imageMetadata?.caption && (
                      <p className="text-sm text-slate-500 dark:text-zinc-400 italic mt-3 text-center">
                        {imageMetadata.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* Category Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#003a70]/10 text-[#003a70] dark:bg-blue-500/10 dark:text-blue-400">
                    {category}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                  {title || 'Your Post Title'}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-zinc-400 mb-8 pb-8 border-b border-slate-200 dark:border-zinc-800">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    {user?.displayName || user?.email || 'Admin'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {new Date(publicationDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {Math.ceil(wordCount / 200)} min read
                  </span>
                </div>

                {/* Content */}
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                    prose-p:text-slate-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed
                    prose-a:text-[#003a70] dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-slate-900 dark:prose-strong:text-white
                    prose-code:text-[#003a70] dark:prose-code:text-blue-400 prose-code:bg-slate-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-blockquote:border-l-[#003a70] dark:prose-blockquote:border-l-blue-400 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-zinc-800/50 prose-blockquote:py-1 prose-blockquote:px-4
                    prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(content) || '<p class="text-slate-400 dark:text-zinc-500 italic">Your post content will appear here...</p>' 
                  }}
                />

                {/* Empty State */}
                {!content && (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-zinc-800 mb-4">article</span>
                    <p className="text-slate-400 dark:text-zinc-500">Start writing to see your content preview</p>
                  </div>
                )}
              </article>
            </div>
          ) : (
          /* Editor Mode */
          <>
          {/* Left Column: Editor */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-white dark:bg-zinc-900">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm font-medium">
                <a className="text-[#003a70] hover:underline dark:text-blue-400" href="/portal">Portal</a>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400 dark:text-zinc-500">New Post</span>
              </nav>

              {/* Title Field */}
              <div className="space-y-2">
                <input
                  className="w-full text-4xl font-black text-slate-900 dark:text-white border-0 focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-zinc-800 p-0 bg-transparent"
                  placeholder="Enter post title..."
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Editor Toolbar */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={(value) => {
                    setContent(value);
                    updateLastEdited();
                  }}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link', 'image'],
                      ['clean'],
                    ],
                  }}
                  className="bg-white dark:bg-slate-800"
                  style={{ minHeight: '400px' }}
                  placeholder="Start writing your post content here..."
                />
              </div>
            </div>
          </main>

          {/* Right Sidebar: Admin Controls */}
          <aside className="w-[340px] border-l border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Category Section */}
            <section className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">folder</span>
                Category
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 focus:ring-2 focus:ring-[#003a70]/20 transition-all outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Community Service</option>
                  <option>Professional Development</option>
                  <option>Club Socials</option>
                  <option>Global Impact</option>
                  <option>Member Spotlights</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </section>

            {/* Featured Image Section */}
            <section className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">image</span>
                Featured Image
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-[#003a70]/50 dark:hover:border-[#003a70]/50 bg-white dark:bg-zinc-900 rounded-xl cursor-pointer transition-all overflow-hidden"
              >
                {featuredImagePreview ? (
                  <>
                    <Image
                      src={featuredImagePreview}
                      alt="Featured image preview"
                      fill
                      className="object-cover"
                      style={{
                        filter: imageMetadata?.filter && imageMetadata.filter !== 'none' 
                          ? imageMetadata.filter 
                          : 'none',
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageCustomization(true);
                        }}
                        className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        Customize
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-zinc-700 group-hover:text-[#003a70] transition-colors">add_photo_alternate</span>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-500">Click or drag image</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-600">Max size: 5MB (1200x630px)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {featuredImagePreview && (
                <div className="space-y-2">
                  {imageMetadata && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-1">
                      {imageMetadata.alt && (
                        <p className="text-xs text-slate-600 dark:text-zinc-400">
                          <span className="font-semibold">Alt:</span> {imageMetadata.alt}
                        </p>
                      )}
                      {imageMetadata.caption && (
                        <p className="text-xs text-slate-600 dark:text-zinc-400">
                          <span className="font-semibold">Caption:</span> {imageMetadata.caption}
                        </p>
                      )}
                      {imageMetadata.filter !== 'none' && (
                        <p className="text-xs text-slate-600 dark:text-zinc-400">
                          <span className="font-semibold">Filter:</span> {imageMetadata.filter}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowImageCustomization(true);
                      }}
                      className="text-xs text-[#003a70] dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">tune</span>
                      Customize image
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeaturedImage(null);
                        setFeaturedImagePreview(null);
                        setImageMetadata(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Publication Date Section */}
            <section className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Publication Date
              </label>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 focus:ring-2 focus:ring-[#003a70]/20 transition-all outline-none"
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="rounded border-slate-200 dark:border-zinc-800 text-[#003a70] focus:ring-[#003a70]/20"
                    id="schedule"
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                  />
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 cursor-pointer" htmlFor="schedule">
                    Post immediately after publishing
                  </label>
                </div>
              </div>
            </section>

            {/* SEO Snippet Preview */}
            <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">search</span>
                Search Preview
              </label>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-1">
                <p className="text-sm font-bold text-[#003a70] dark:text-blue-400 line-clamp-1">
                  {title || 'Enter post title...'}
                </p>
                <p className="text-[11px] text-green-600 dark:text-green-500">
                  rotaractnyc.org/blog/{title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '...'}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                  {content 
                    ? content.replace(/<[^>]*>/g, '').trim().slice(0, 150)
                    : 'Description will be automatically generated from your post content...'}
                </p>
              </div>
            </section>
          </aside>
          </>
          )}
        </div>

        {/* Footer / Status Bar */}
        <footer className="px-8 py-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">history</span>
              Last edited {lastEdited}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">article</span>
              {wordCount} words
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="text-[11px] font-bold text-[#003a70] dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isPreviewMode ? 'edit' : 'visibility'}
              </span>
              {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
          </div>
        </footer>
      </div>

      {/* Image Customization Modal */}
      {featuredImagePreview && (
        <ImageCustomizationModal
          isOpen={showImageCustomization}
          imageUrl={featuredImagePreview}
          onClose={() => setShowImageCustomization(false)}
          onSave={handleImageCustomizationSave}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        
        /* ReactQuill custom styles for the modal */
        .ql-container {
          min-height: 400px;
          font-size: 16px;
        }
        
        .ql-editor {
          min-height: 400px;
          line-height: 1.6;
        }
        
        .ql-editor.ql-blank::before {
          color: #cbd5e1;
          font-style: normal;
        }
        
        .dark .ql-toolbar {
          background: #18181b;
          border-color: #3f3f46 !important;
        }
        
        .dark .ql-container {
          background: #18181b;
          border-color: #3f3f46 !important;
        }
        
        .dark .ql-editor {
          color: #d4d4d8;
        }
        
        .dark .ql-editor.ql-blank::before {
          color: #52525b;
        }
      `}</style>
    </div>
  );
}