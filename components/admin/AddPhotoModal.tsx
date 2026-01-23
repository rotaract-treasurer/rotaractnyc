'use client'

import { useState, useEffect } from 'react'
import DragDropFile from '@/components/admin/DragDropFile'

type GalleryRow = {
  id: string
  title: string
  alt: string
  imageUrl: string
  storagePath?: string
  order: number
  createdAt?: unknown
  updatedAt?: unknown
}

interface AddPhotoModalProps {
  isOpen: boolean
  onClose: () => void
  editingItem: GalleryRow | null
  onSave: (form: Omit<GalleryRow, 'id'>, file: File | null) => Promise<void>
  saving: boolean
  uploading: boolean
}

export default function AddPhotoModal({
  isOpen,
  onClose,
  editingItem,
  onSave,
  saving,
  uploading,
}: AddPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form, setForm] = useState<Omit<GalleryRow, 'id'>>({
    title: '',
    alt: '',
    imageUrl: '',
    order: 1,
  })

  // Update form when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setForm({
        title: editingItem.title,
        alt: editingItem.alt,
        imageUrl: editingItem.imageUrl,
        storagePath: editingItem.storagePath || '',
        order: editingItem.order,
      })
    } else {
      setForm({
        title: '',
        alt: '',
        imageUrl: '',
        order: 1,
      })
      setFile(null)
    }
  }, [editingItem, isOpen])

  // Album and tag state
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [tags, setTags] = useState<string[]>(['Charity', 'NYC'])
  const [newTag, setNewTag] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'members' | 'private'>('public')

  const handleSave = async () => {
    await onSave(form, file)
  }

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile)
    // Simulate upload progress
    if (selectedFile) {
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal Overlay / Background Dimmer */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Add Photo Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto">
        <div className="relative w-full max-w-4xl bg-white dark:bg-background-dark rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] my-auto">
          {/* Left Side: Upload Area */}
          <div className="flex-1 p-8 border-r border-slate-100 dark:border-slate-800 flex flex-col overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-[#101618] dark:text-white text-2xl font-bold tracking-tight">
                {editingItem ? 'Edit Photo' : 'Add Photos to Gallery'}
              </h2>
              <p className="text-[#5e7d8d] text-sm">
                {editingItem ? 'Update photo details' : 'Upload new images to the Rotaract Club of NYC library'}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  placeholder="Event photos 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alt Text / Description
                </label>
                <input
                  type="text"
                  value={form.alt}
                  onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  placeholder="Description for accessibility"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  placeholder="1"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Auto-filled when you upload a file
                </p>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div className="flex flex-col flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Upload Image
              </label>
              
              {/* Custom Drag & Drop UI */}
              <div 
                onClick={() => document.getElementById('file-upload-input')?.click()}
                className="flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-[#dae2e7] dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 px-6 py-12 transition-all hover:border-primary/50 group cursor-pointer"
              >
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <div className="flex max-w-[480px] flex-col items-center gap-2">
                  <p className="text-[#101618] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
                    Drag &amp; drop your photos here or <span className="text-primary underline cursor-pointer">click to browse</span>
                  </p>
                  <p className="text-[#5e7d8d] text-sm font-normal leading-normal text-center">
                    Supported formats: JPG, PNG. Max file size: 10MB.
                  </p>
                </div>
                
                {/* Hidden File Input */}
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null
                    handleFileSelect(selectedFile)
                  }}
                  className="hidden"
                />
                
                {/* File Preview */}
                {file && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Selected: {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                
                {/* Show uploaded URL if exists */}
                {!file && form.imageUrl && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      ✓ Image already uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar (Active State) */}
              {uploading && uploadProgress > 0 && (
                <div className="flex flex-col gap-3 mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex gap-6 justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">image</span>
                      <p className="text-[#101618] dark:text-white text-sm font-semibold">
                        Uploading {file ? 1 : 0} file{file ? '' : 's'}...
                      </p>
                    </div>
                    <p className="text-primary text-sm font-bold">{uploadProgress}%</p>
                  </div>
                  <div className="rounded-full bg-[#dae2e7] dark:bg-slate-700 h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {file && (
                    <div className="flex justify-between">
                      <p className="text-[#5e7d8d] text-xs font-normal">
                        {((file.size * uploadProgress) / 100 / 1024 / 1024).toFixed(1)} MB of {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <p className="text-[#5e7d8d] text-xs font-normal">
                        Est. {Math.ceil((100 - uploadProgress) / 8)} seconds remaining
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Sidebar Controls */}
          <aside className="w-full md:w-80 bg-slate-50/50 dark:bg-slate-900/50 p-8 flex flex-col gap-8 overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-end -mt-4 -mr-4">
              <button 
                onClick={onClose}
                className="size-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Album Selection */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">folder</span>
                <span>Album Settings</span>
              </div>
              <div className="flex flex-col gap-2">
                <select 
                  value={selectedAlbum}
                  onChange={(e) => setSelectedAlbum(e.target.value)}
                  className="form-select w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:ring-primary focus:border-primary"
                >
                  <option value="">Select an existing album</option>
                  <option value="community-service-2024">Community Service 2024</option>
                  <option value="fundraising-gala">Fundraising Gala</option>
                  <option value="monthly-meeting-june">Monthly Meeting - June</option>
                </select>
                <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline py-1">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Create New Album
                </button>
              </div>
            </div>

            {/* Event Tags */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">sell</span>
                <span>Event Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1 border border-primary/20"
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)}>
                      <span className="material-symbols-outlined text-[10px] cursor-pointer">close</span>
                    </button>
                  </span>
                ))}
                <input 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  className="bg-transparent border-none p-0 text-xs focus:ring-0 placeholder:text-slate-400 w-20" 
                  placeholder="Add tag..." 
                  type="text"
                />
              </div>
            </div>

            {/* Privacy Levels */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">visibility</span>
                <span>Privacy</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    checked={privacy === 'public'}
                    onChange={() => setPrivacy('public')}
                    className="form-radio text-primary focus:ring-primary h-4 w-4 border-slate-300 dark:bg-slate-800 dark:border-slate-600" 
                    name="privacy" 
                    type="radio"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Public (Visible to all)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    checked={privacy === 'members'}
                    onChange={() => setPrivacy('members')}
                    className="form-radio text-primary focus:ring-primary h-4 w-4 border-slate-300 dark:bg-slate-800 dark:border-slate-600" 
                    name="privacy" 
                    type="radio"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Members Only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    checked={privacy === 'private'}
                    onChange={() => setPrivacy('private')}
                    className="form-radio text-primary focus:ring-primary h-4 w-4 border-slate-300 dark:bg-slate-800 dark:border-slate-600" 
                    name="privacy" 
                    type="radio"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Private (Admins Only)</span>
                </label>
              </div>
            </div>

            {/* Action Footer in Sidebar */}
            <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={handleSave}
                disabled={saving || uploading || !form.title || !form.alt || (!file && !form.imageUrl)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Uploading...</span>
                  </>
                ) : saving ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">upload</span>
                    <span>{editingItem ? 'Save Changes' : 'Start Upload'}</span>
                  </>
                )}
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
