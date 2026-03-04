'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.webm'];
const MAX_FILE_SIZE_MB = 10;

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    preview?: string;
}

export default function CreatePostPage() {
    const { user, isLoading, token } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contentHtml, setContentHtml] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Auth guard
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [isLoading, user, router]);

    // Fetch categories
    useEffect(() => {
        fetch(`${API_URL}/forum/categories`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setCategories(data); })
            .catch(() => { });
    }, []);

    const [linkPrompt, setLinkPrompt] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [imagePrompt, setImagePrompt] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    // Sync editor content
    const syncContent = useCallback(() => {
        if (editorRef.current) {
            setContent(editorRef.current.innerText);
            setContentHtml(editorRef.current.innerHTML);
        }
    }, []);

    const execCmd = (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        syncContent();
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            setSavedRange(sel.getRangeAt(0));
        }
    };

    const restoreSelection = () => {
        if (savedRange) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(savedRange);
        }
    };

    const handleLinkClick = () => {
        saveSelection();
        setLinkPrompt(true);
        setImagePrompt(false);
    };

    const handleImageClick = () => {
        saveSelection();
        setImagePrompt(true);
        setLinkPrompt(false);
    };

    const confirmLink = () => {
        restoreSelection();
        if (linkUrl) {
            document.execCommand('createLink', false, linkUrl);
            syncContent();
        }
        setLinkPrompt(false);
        setLinkUrl('');
    };

    const confirmImage = () => {
        restoreSelection();
        if (imageUrl) {
            document.execCommand('insertImage', false, imageUrl);
            syncContent();
        }
        setImagePrompt(false);
        setImageUrl('');
    };

    // Tag management
    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
            setTags([...tags, trimmed]);
            setTagInput('');
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
        if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    // File management
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        const newFiles: UploadedFile[] = [];
        const errors: string[] = [];

        Array.from(selectedFiles).forEach(file => {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_FILE_TYPES.includes(ext)) {
                errors.push(`${file.name}: unsupported file type`);
                return;
            }
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_MB}MB limit`);
                return;
            }
            newFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
            });
        });

        if (errors.length > 0) {
            setError(errors.join('. '));
            setTimeout(() => setError(''), 5000);
        }

        setFiles([...files, ...newFiles]);
        e.target.value = '';
    };

    const removeFile = (name: string) => {
        setFiles(files.filter(f => f.name !== name));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎬';
        if (type.includes('pdf')) return '📄';
        return '📎';
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        syncContent();
        const txt = editorRef.current?.innerText.trim() || content.trim();
        if (!title.trim() || !txt) {
            setError('Title and content are required');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/forum/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: editorRef.current?.innerHTML || contentHtml || content.trim(),
                    categoryId: categoryId || undefined,
                    tags,
                    attachments: files.map(f => f.name)
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to submit post');
            } else {
                setSubmitted(true);
            }
        } catch {
            setError('Unable to connect to server');
        }
        setLoading(false);
    };

    if (isLoading || !user) {
        return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Loading...</div>;
    }

    // Success state
    if (submitted) {
        return (
            <div className="space-y-6">
                <nav className="text-xs text-gray-500">
                    <Link href="/" className="hover:text-acron-pitch">Home</Link> &gt;
                    <Link href="/forum" className="hover:text-acron-pitch mx-1">Forum</Link> &gt;
                    <span className="text-acron-pitch font-medium"> Create Post</span>
                </nav>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-acron-pitch/10 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-acron-yoke-500 mb-2">Post Submitted for Review</h2>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Your post has been submitted and is awaiting review by the Echidna team. You&apos;ll be notified once it&apos;s approved.</p>
                    <div className="mt-6 flex justify-center space-x-3">
                        <Link href="/dashboard" className="bg-acron-pitch text-acron-yoke-500 font-bold py-2 px-6 rounded-lg text-sm hover:bg-acron-pitch transition-all">Go to Dashboard</Link>
                        <Link href="/forum" className="bg-gray-100 text-gray-700 font-medium py-2 px-6 rounded-lg text-sm hover:bg-gray-200 transition-all">Browse Forum</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Preview mode
    if (showPreview) {
        const selectedCat = categories.find((c: { id: string; name: string }) => c.id === categoryId);
        return (
            <div className="space-y-6">
                <nav className="text-xs text-gray-500">
                    <Link href="/" className="hover:text-acron-pitch">Home</Link> &gt;
                    <Link href="/forum" className="hover:text-acron-pitch mx-1">Forum</Link> &gt;
                    <span className="text-acron-pitch font-medium"> Preview Post</span>
                </nav>

                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-acron-yoke-500">📋 Post Preview</h1>
                    <div className="flex space-x-3">
                        <button onClick={() => setShowPreview(false)}
                            className="bg-gray-100 text-gray-700 font-medium py-2 px-5 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                            ← Back to Edit
                        </button>
                        <button onClick={handleSubmit} disabled={loading}
                            className="bg-acron-pitch text-acron-yoke-500 font-bold py-2 px-6 rounded-lg text-sm hover:bg-acron-pitch transition-all disabled:opacity-50">
                            {loading ? 'Submitting...' : 'Submit for Review'}
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2.5 rounded-lg text-xs font-medium">
                    🔒 This is a preview. Your post will not be publicly visible until approved by the Echidna team.
                </div>

                <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-acron-pitch rounded-full flex items-center justify-center text-acron-yoke-500 font-bold flex-shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-acron-yoke-500">{title || 'Untitled Post'}</h1>
                                <p className="text-xs text-gray-500 mt-1">
                                    {user.name} &middot; Just now &middot;
                                    <span className="text-acron-pitch ml-1">{selectedCat?.name || 'Uncategorized'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-gray-400">No content written yet.</p>' }} />

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-5 border-t border-gray-100 pt-4">
                                {tags.map(tag => (
                                    <span key={tag} className="text-xs bg-acron-yoke-500 text-white px-2.5 py-1 rounded">{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Attachments */}
                        {files.length > 0 && (
                            <div className="mt-5 border-t border-gray-100 pt-4">
                                <h3 className="text-xs font-semibold text-gray-500 mb-2">ATTACHMENTS ({files.length})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {files.map(file => (
                                        <div key={file.name} className="rounded-lg border border-gray-200 p-3 flex items-center space-x-2">
                                            {file.preview ? (
                                                <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
                                            ) : (
                                                <span className="text-xl">{getFileIcon(file.type)}</span>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-acron-yoke-500 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Engagement bar (static preview) */}
                        <div className="flex items-center space-x-4 text-sm mt-5 border-t border-gray-100 pt-4 text-gray-400">
                            <span>❤️ 0</span>
                            <span>💬 0</span>
                            <span>👁 0</span>
                        </div>
                    </div>
                </article>
            </div>
        );
    }

    // Edit mode (main form)
    return (
        <div className="space-y-6">
            <nav className="text-xs text-gray-500">
                <Link href="/" className="hover:text-acron-pitch">Home</Link> &gt;
                <Link href="/forum" className="hover:text-acron-pitch mx-1">Forum</Link> &gt;
                <span className="text-acron-pitch font-medium"> Create Post</span>
            </nav>

            <h1 className="text-2xl font-bold text-acron-yoke-500">Create New Post</h1>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">
                                Post Title<span className="text-red-500">*</span>
                            </label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
                                className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm focus:border-acron-pitch focus:ring-acron-pitch"
                                placeholder="Enter a clear, descriptive title for your post" />
                            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</p>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Category</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm focus:border-acron-pitch focus:ring-acron-pitch bg-white">
                                <option value="">Select a category</option>
                                {categories.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Content Editor */}
                        <div>
                            <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">
                                Content<span className="text-red-500">*</span>
                            </label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-acron-pitch focus-within:ring-1 focus-within:ring-acron-pitch transition-all">
                                {/* Toolbar */}
                                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center space-x-1">
                                    <button type="button" title="Bold" onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}
                                        className="w-8 h-8 rounded text-sm font-bold text-gray-600 hover:bg-gray-200 hover:text-acron-yoke-500 transition-colors">B</button>
                                    <button type="button" title="Italic" onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}
                                        className="w-8 h-8 rounded text-sm font-bold text-gray-600 hover:bg-gray-200 hover:text-acron-yoke-500 transition-colors italic">I</button>
                                    <button type="button" title="Underline" onMouseDown={e => { e.preventDefault(); execCmd('underline'); }}
                                        className="w-8 h-8 rounded text-sm font-bold text-gray-600 hover:bg-gray-200 hover:text-acron-yoke-500 transition-colors underline">U</button>
                                    <button type="button" title="Strikethrough" onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough'); }}
                                        className="w-8 h-8 rounded text-sm font-bold text-gray-600 hover:bg-gray-200 hover:text-acron-yoke-500 transition-colors line-through">S</button>
                                    <span className="border-l border-gray-300 h-5 mx-1" />
                                    <button type="button" title="Heading" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'h2'); }}
                                        className="w-8 h-8 rounded text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors">H</button>
                                    <button type="button" title="Bullet List" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}
                                        className="w-8 h-8 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors">•</button>
                                    <button type="button" title="Numbered List" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}
                                        className="w-8 h-8 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors">1.</button>
                                    <span className="border-l border-gray-300 h-5 mx-1" />
                                    <button type="button" title="Insert Link" onMouseDown={e => { e.preventDefault(); handleLinkClick(); }}
                                        className={`w-8 h-8 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors ${linkPrompt ? 'bg-gray-200 text-acron-pitch' : ''}`}>🔗</button>
                                    <button type="button" title="Insert Image" onMouseDown={e => { e.preventDefault(); handleImageClick(); }}
                                        className={`w-8 h-8 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors ${imagePrompt ? 'bg-gray-200 text-acron-pitch' : ''}`}>🖼️</button>
                                    <button type="button" title="Attach File" onClick={() => fileInputRef.current?.click()}
                                        className="w-8 h-8 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors">📎</button>
                                    <button type="button" title="Code Block" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'pre'); }}
                                        className="w-8 h-8 rounded text-xs font-mono text-gray-600 hover:bg-gray-200 transition-colors">&lt;/&gt;</button>
                                </div>

                                {/* Link / Image Prompts */}
                                {(linkPrompt || imagePrompt) && (
                                    <div className="bg-white border-b border-gray-200 p-3 flex items-center space-x-2 shadow-sm relative z-10 animate-fade-in">
                                        <input
                                            autoFocus
                                            type="url"
                                            placeholder={linkPrompt ? "Enter URL (e.g., https://example.com)" : "Enter image URL (e.g., https://example.com/img.jpg)"}
                                            value={linkPrompt ? linkUrl : imageUrl}
                                            onChange={e => linkPrompt ? setLinkUrl(e.target.value) : setImageUrl(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { e.preventDefault(); linkPrompt ? confirmLink() : confirmImage(); }
                                                if (e.key === 'Escape') { linkPrompt ? setLinkPrompt(false) : setImagePrompt(false); restoreSelection(); }
                                            }}
                                            className="flex-1 text-sm border-gray-300 rounded-lg shadow-sm focus:ring-acron-pitch focus:border-acron-pitch px-3 py-1.5"
                                        />
                                        <button type="button" onClick={() => linkPrompt ? confirmLink() : confirmImage()}
                                            className="bg-acron-pitch text-acron-yoke-500 text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-acron-pitch/90">
                                            {linkPrompt ? 'Add Link' : 'Add Image'}
                                        </button>
                                        <button type="button" onClick={() => { linkPrompt ? setLinkPrompt(false) : setImagePrompt(false); restoreSelection(); }}
                                            className="text-gray-400 hover:text-gray-600 px-2 py-1.5">
                                            ✕
                                        </button>
                                    </div>
                                )}

                                <div ref={editorRef} contentEditable suppressContentEditableWarning
                                    onInput={syncContent} onBlur={syncContent}
                                    className="w-full p-4 text-sm focus:outline-none min-h-[280px] leading-relaxed overflow-y-auto max-h-[500px] prose prose-sm max-w-none relative"
                                    data-placeholder="Write your post content here. Share your knowledge, ask questions, or start a discussion..." />
                            </div>
                            <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }`}</style>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">
                                Tags <span className="text-gray-400 font-normal text-xs">(up to 10, press Enter or comma to add)</span>
                            </label>
                            <div className="border border-gray-300 rounded-lg p-2 flex flex-wrap items-center gap-1.5 focus-within:border-acron-pitch focus-within:ring-1 focus-within:ring-acron-pitch min-h-[42px]">
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center space-x-1 bg-acron-yoke-500 text-white text-xs px-2.5 py-1 rounded-lg">
                                        <span>{tag}</span>
                                        <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-300 ml-1">×</button>
                                    </span>
                                ))}
                                {tags.length < 10 && (
                                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown} onBlur={addTag}
                                        className="flex-1 min-w-[120px] text-sm border-none outline-none p-1 focus:ring-0"
                                        placeholder={tags.length === 0 ? 'e.g. Discussion, Help, Best Practices' : 'Add tag...'} />
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{tags.length}/10 tags</p>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Attachments</label>
                            <div onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-acron-pitch transition-colors cursor-pointer group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📎</div>
                                <p className="text-sm text-gray-500">
                                    Drag &amp; drop files here or <span className="text-acron-pitch font-semibold">click to browse</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Max {MAX_FILE_SIZE_MB}MB per file. Supported: PDF, DOC, Images (PNG, JPG, GIF), Videos (MP4, WebM)
                                </p>
                            </div>
                            <input ref={fileInputRef} type="file" multiple accept={ALLOWED_FILE_TYPES.join(',')}
                                onChange={handleFileSelect} className="hidden" />

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {files.map(file => (
                                        <div key={file.name} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                {file.preview ? (
                                                    <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                                ) : (
                                                    <span className="text-xl flex-shrink-0">{getFileIcon(file.type)}</span>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-acron-yoke-500 truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeFile(file.name)}
                                                className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold ml-3 flex-shrink-0">✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                            <div className="flex items-center space-x-3">
                                <button type="submit" disabled={loading}
                                    className="bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-8 rounded-lg hover:bg-acron-pitch transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                                    {loading ? 'Submitting...' : 'Submit for Review'}
                                </button>
                                <button type="button" onClick={() => { syncContent(); setShowPreview(true); }}
                                    disabled={!title.trim()}
                                    className="bg-acron-yoke-500 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-acron-yoke-400 transition-colors text-sm disabled:opacity-40">
                                    👁 Preview
                                </button>
                            </div>
                            <Link href="/forum" className="text-sm text-gray-500 hover:text-acron-yoke-500 transition-colors">Cancel</Link>
                        </div>
                    </form>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-acron-yoke-500/5 rounded-xl p-5 border-l-4 border-acron-pitch">
                        <h3 className="text-sm font-bold text-acron-yoke-500 mb-3">📋 Posting Guidelines</h3>
                        <ul className="text-xs text-gray-600 space-y-2">
                            <li className="flex items-start space-x-1.5"><span className="text-acron-pitch">•</span><span>Be respectful and constructive in your discussions</span></li>
                            <li className="flex items-start space-x-1.5"><span className="text-acron-pitch">•</span><span>Choose the most relevant category for your post</span></li>
                            <li className="flex items-start space-x-1.5"><span className="text-acron-pitch">•</span><span>Use a clear, descriptive title</span></li>
                            <li className="flex items-start space-x-1.5"><span className="text-acron-pitch">•</span><span>Add relevant tags to help others find your content</span></li>
                            <li className="flex items-start space-x-1.5"><span className="text-acron-pitch">•</span><span>All posts are reviewed by the moderation team before publishing</span></li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-acron-yoke-500 mb-3">📌 Submission Status</h3>
                        <div className="space-y-3">
                            {[
                                { step: '1', label: 'Create & Submit', desc: 'Write your post', active: true },
                                { step: '2', label: 'Under Review', desc: 'Echidna team reviews', active: false },
                                { step: '3', label: 'Published', desc: 'Visible to community', active: false },
                            ].map(s => (
                                <div key={s.step} className="flex items-start space-x-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.active ? 'bg-acron-pitch text-acron-yoke-500' : 'bg-gray-200 text-gray-500'}`}>
                                        {s.step}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold ${s.active ? 'text-acron-yoke-500' : 'text-gray-400'}`}>{s.label}</p>
                                        <p className="text-xs text-gray-400">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-acron-yoke-500 mb-2">📁 Supported File Types</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div><span className="font-medium text-acron-yoke-500">Documents:</span> PDF, DOC</div>
                            <div><span className="font-medium text-acron-yoke-500">Images:</span> PNG, JPG, GIF</div>
                            <div><span className="font-medium text-acron-yoke-500">Video:</span> MP4, WebM</div>
                            <div><span className="font-medium text-acron-yoke-500">Max size:</span> 10MB each</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
