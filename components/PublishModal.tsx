import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Article, UserIntegration } from '../types';
import { getIntegrations } from '../services/supabase';
import { publishToWordPress, publishToMedium, fetchWordPressCategories } from '../services/publishingService';
import { CheckIcon } from './icons/CheckIcon';
import { ToggleSwitch } from './ToggleSwitch';

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, article }) => {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<string | null>(null); // provider name
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Featured Image states
  const [enableFeaturedImage, setEnableFeaturedImage] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [webpImage, setWebpImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [customAltText, setCustomAltText] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [showEditFields, setShowEditFields] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Modal açıldığında body scroll'unu engelle
      document.body.style.overflow = 'hidden';

      // ESC tuşu listener'ı
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);

      const fetchIntegrations = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setSuccess(null);
          const data = await getIntegrations();
          setIntegrations(data || []);

          // WordPress entegrasyonu varsa kategorileri yükle
          const wordpressIntegration = data?.find(int => int.provider === 'wordpress');
          if (wordpressIntegration) {
            setCategoriesLoading(true);
            try {
              const cats = await fetchWordPressCategories();
              setCategories(cats);
            } catch (catError: any) {
              console.warn('Failed to load WordPress categories:', catError);
              // Kategoriler yüklenemezse devam et, zorunlu değil
            } finally {
              setCategoriesLoading(false);
            }
          }
        } catch (e: any) {
          setError('Failed to load integrations. Check your profile settings.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchIntegrations();

      // Cleanup function
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      // Modal kapandığında da temizlik
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  const handlePublish = async (provider: 'wordpress' | 'medium') => {
    setIsPublishing(provider);
    setError(null);
    setSuccess(null);
    try {
      let result;
      if (provider === 'wordpress') {
        // Use WebP if converted, otherwise original image
        const imageToUpload = enableFeaturedImage && (webpImage || selectedImage);
        result = await publishToWordPress(
          article,
          selectedCategory || undefined,
          imageToUpload || undefined,
          customAltText || undefined,
          customTitle || undefined
        );
      } else {
        result = await publishToMedium(article);
      }
      setSuccess(`Successfully published to ${provider} as a draft!`);
      console.log('Publishing result:', result);
    } catch (e: any) {
      if (e.response && e.response.status === 401) {
        setError(`Authentication failed for ${provider}. Please check the credentials in your profile settings.`);
      } else {
        setError(e.message || `An unknown error occurred while publishing to ${provider}.`);
      }
    } finally {
      setIsPublishing(null);
    }
  };

  // Image file handling - convert to WebP immediately for preview
  const handleFileSelect = async (file: File) => {
    // Check if conversion is supported for this format
    const supportedFormatsForConversion = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/bmp',
      'image/tiff',
      'image/gif'
    ];

    setSelectedImage(file);

    if (supportedFormatsForConversion.includes(file.type.toLowerCase())) {
      try {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        // Call Netlify function for WebP conversion
        const response = await fetch('/.netlify/functions/webp-convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageData: base64Data,
            fileName: file.name
          })
        });

        if (!response.ok) {
          throw new Error(`Sharp conversion failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('Sharp conversion failed');
        }

        // Convert base64 WebP back to Blob
        const webpBlob = await fetch(`data:image/webp;base64,${data.webpData}`).then(res => res.blob());

        // Create WebP file for upload
        const webpFileName = file.name.replace(/\.[^/.]+$/, '.webp');
        const webpFile = new File([webpBlob], webpFileName, { type: 'image/webp' });
        setWebpImage(webpFile);
        setImagePreview(URL.createObjectURL(webpBlob));
      } catch (error) {
        console.warn('WebP conversion for preview failed, using original:', error);
        setWebpImage(null);
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      // Unsupported format - use as-is (WebP or other)
      setWebpImage(null);
      setImagePreview(URL.createObjectURL(file));
    }

    // Auto fill alt text and title from H1
    const h1Title = article.articleContent.split('\n').find(line => line.trim().startsWith('# '))?.substring(2).trim() || article.title;
    setCustomAltText(h1Title);
    setCustomTitle(h1Title);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 relative animate-slide-in-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4">Publish Article</h2>
        <p className="text-slate-400 mb-6">Choose a platform to publish "{article.title}" as a draft.</p>

        {isLoading && <div className="text-center text-slate-300">Loading integrations...</div>}
        
        <div className="space-y-4">
          {integrations
            .filter(int => int.provider === 'wordpress')
            .map(int => {
              if (categories.length > 0) {
                // WordPress için kategori seçimi ve featured image ile birlikte göster
                return (
                  <div key={int.id} className="space-y-4">
                    {/* Featured Image Toggle */}
                    <div className="flex items-center space-x-3">
                      <ToggleSwitch
                        id="enableFeaturedImage"
                        checked={enableFeaturedImage}
                        onChange={setEnableFeaturedImage}
                      />
                      <label htmlFor="enableFeaturedImage" className="text-sm font-medium text-slate-300 cursor-pointer">
                        Add Featured Image to WordPress Post
                      </label>
                    </div>

                    {/* Featured Image Upload Area */}
                    {enableFeaturedImage && (
                      <div className="space-y-3">
                        {/* Image Upload/Preview Area */}
                        {!selectedImage ? (
                          <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                              isDragOver
                                ? 'border-indigo-400 bg-indigo-500/10 shadow-lg scale-[1.02]'
                                : 'border-slate-600 hover:border-indigo-500'
                            }`}
                            onClick={() => document.getElementById(`file-input-${int.id}`)?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-400 text-sm">Click to select or drag & drop image</p>
                            <p className="text-slate-500 text-xs mt-1">JPEG, PNG, BMP, TIFF, GIF supported - will be converted to WebP</p>
                            <input
                              id={`file-input-${int.id}`}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/bmp,image/tiff,image/gif,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  await handleFileSelect(file);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Featured image preview"
                                className="w-full h-32 object-cover rounded-lg border border-slate-600"
                              />
                              <button
                                onClick={() => {
                                  setSelectedImage(null);
                                  setImagePreview('');
                                  URL.revokeObjectURL(imagePreview);
                                }}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                                title="Remove image"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Alt Text & Title Edit Toggle */}
                        {selectedImage && (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <ToggleSwitch
                                id={`showEditFields-${int.id}`}
                                checked={showEditFields}
                                onChange={setShowEditFields}
                              />
                              <label htmlFor={`showEditFields-${int.id}`} className="text-sm font-medium text-slate-300 cursor-pointer">
                                Edit Alt Text & Title
                              </label>
                            </div>

                            {showEditFields && (
                              <div className="grid gap-3">
                                <div>
                                  <label className="block text-sm text-slate-300 mb-1">Alt Text (SEO)</label>
                                  <input
                                    type="text"
                                    value={customAltText}
                                    onChange={(e) => setCustomAltText(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Describe the image for accessibility and SEO"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-slate-300 mb-1">Image Title</label>
                                  <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Title for the image"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">WordPress Category</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                          className="relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all duration-300"
                          disabled={isPublishing !== null}
                        >
                          <span className="block truncate">
                            {selectedCategory
                              ? categories.find(c => c.id === selectedCategory)?.name || 'Select category...'
                              : 'Choose a category (optional)'}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className={`h-5 w-5 text-gray-400 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                          </span>
                        </button>
                        {isCategoriesOpen && (
                          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                            {categoriesLoading ? (
                              <div className="p-2 text-slate-400 text-sm">Loading categories...</div>
                            ) : categories.length > 0 ? (
                              <ul role="listbox">
                                <li
                                  className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-500/30"
                                  onClick={() => { setSelectedCategory(null); setIsCategoriesOpen(false); }}
                                >
                                  <span className="font-normal block truncate">Choose a category (optional)</span>
                                  {!selectedCategory && (
                                    <span className="text-indigo-400 absolute inset-y-0 right-0 flex items-center pr-4">
                                      <CheckIcon className="h-5 w-5" />
                                    </span>
                                  )}
                                </li>
                                {categories.map(cat => (
                                  <li
                                    key={cat.id}
                                    className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-500/30"
                                    onClick={() => { setSelectedCategory(cat.id); setIsCategoriesOpen(false); }}
                                  >
                                    <span className="font-normal block truncate">{cat.name} ({cat.count} posts)</span>
                                    {selectedCategory === cat.id && (
                                      <span className="text-indigo-400 absolute inset-y-0 right-0 flex items-center pr-4">
                                        <CheckIcon className="h-5 w-5" />
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="p-2 text-slate-400 text-sm">No categories found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handlePublish(int.provider)}
                      disabled={isPublishing !== null}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:bg-indigo-500/50 disabled:cursor-wait"
                    >
                      {isPublishing === int.provider ? `Publishing to ${int.provider}...` : `Publish to ${int.provider}`}
                    </button>
                  </div>
                );
              }

              return null; // WordPress değilse null dönder
            })}

          {/* Medium ve diğer entegrasyonlar */}
          {integrations
            .filter(int => int.provider !== 'wordpress')
            .map(int => (
              <button
                key={int.id}
                onClick={() => handlePublish(int.provider)}
                disabled={isPublishing !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:bg-indigo-500/50 disabled:cursor-wait"
              >
                {isPublishing === int.provider ? `Publishing to ${int.provider}...` : `Publish to ${int.provider}`}
              </button>
            ))}
        </div>

        {!isLoading && integrations.length === 0 && (
            <div className="text-center text-slate-400 border border-dashed border-slate-600 p-6 rounded-lg">
                <p>No publishing integrations found.</p>
                <p className="text-sm mt-2">Please add WordPress or Medium in your profile settings.</p>
            </div>
        )}

        {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}
        {success && <p className="text-sm text-green-400 text-center mt-4">{success}</p>}

      </div>
    </div>,
    document.body
  );
};
