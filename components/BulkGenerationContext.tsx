import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { BulkGenerationState, BulkGenerationRequest, BulkGenerationItem, BulkGenerationProgress, Article } from '../types';
import { createBulkGenerationService, BulkGenerationService } from '../services/bulkGenerationService';
import * as supabaseService from '../services/supabase';

// Action types
type BulkGenerationAction =
  | { type: 'START_GENERATION'; payload: { request: BulkGenerationRequest; items: BulkGenerationItem[] } }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<BulkGenerationItem> } }
  | { type: 'COMPLETE_ITEM'; payload: { id: string; article: any } }
  | { type: 'FAIL_ITEM'; payload: { id: string; error: string } }
  | { type: 'PAUSE_GENERATION' }
  | { type: 'RESUME_GENERATION' }
  | { type: 'CANCEL_GENERATION' }
  | { type: 'RESET_GENERATION' }
  | { type: 'LOAD_FROM_STORAGE'; payload: BulkGenerationState };

// Initial state
const initialState: BulkGenerationState = {
  items: [],
  progress: {
    total: 0,
    completed: 0,
    failed: 0,
    current: 0,
    isActive: false,
    estimatedTimeRemaining: 0,
  },
  isGenerating: false,
  lastSaved: '',
};

// Reducer
function bulkGenerationReducer(state: BulkGenerationState, action: BulkGenerationAction): BulkGenerationState {
  switch (action.type) {
    case 'START_GENERATION': {
      const { request, items } = action.payload;

      console.log(`🚀 START_GENERATION reducer called with ${items.length} items`);
      console.log(`📋 Items received:`, items.map(item => ({ id: item.id, status: item.status })));

      return {
        ...state,
        items,
        progress: {
          total: items.length,
          completed: 0,
          failed: 0,
          current: 0,
          isActive: true,
          estimatedTimeRemaining: items.length * 30, // Rough estimate: 30 seconds per article
        },
        isGenerating: true,
        lastSaved: new Date().toISOString(),
      };
    }

    case 'UPDATE_ITEM': {
      const { id, updates } = action.payload;
      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );

      // Recalculate progress stats
      const completed = updatedItems.filter(item => item.status === 'completed').length;
      const failed = updatedItems.filter(item => item.status === 'failed').length;
      const processing = updatedItems.filter(item => item.status === 'processing').length;
      const totalProcessed = completed + failed;

      // Update estimated time remaining based on current progress
      let estimatedTimeRemaining = state.progress.estimatedTimeRemaining;
      if (processing > 0 && totalProcessed > 0) {
        // Calculate average time per article based on completed items
        const avgTimePerArticle = 30; // fallback
        const remainingItems = state.progress.total - totalProcessed;
        estimatedTimeRemaining = Math.max(0, remainingItems * avgTimePerArticle);
      }

      return {
        ...state,
        items: updatedItems,
        progress: {
          ...state.progress,
          completed,
          failed,
          current: totalProcessed,
          estimatedTimeRemaining,
          isActive: processing > 0 || (totalProcessed < state.progress.total && state.progress.isActive),
        },
        isGenerating: processing > 0 || totalProcessed < state.progress.total,
        lastSaved: new Date().toISOString(),
      };
    }

    case 'COMPLETE_ITEM': {
      const { id, article } = action.payload;
      console.log(`🔄 COMPLETE_ITEM reducer called for ${id}`);
      console.log(`📋 Current state items:`, state.items.map(item => ({ id: item.id, status: item.status })));

      const updatedItems = state.items.map(item => {
        if (item.id === id) {
          console.log(`🔄 Updating item ${id} status to 'completed'`);
          return { ...item, status: 'completed' as const, progress: 100, article };
        }
        return item;
      });

      console.log(`📋 Updated items:`, updatedItems.map(item => ({ id: item.id, status: item.status })));

      const completed = updatedItems.filter(item => item.status === 'completed').length;
      const failed = updatedItems.filter(item => item.status === 'failed').length;

      console.log(`📊 Progress calculation: completed=${completed}, failed=${failed}, total=${state.progress.total}`);
      console.log(`📊 Items with completed status:`, updatedItems.filter(item => item.status === 'completed').map(item => item.id));

      const newState = {
        ...state,
        items: updatedItems,
        progress: {
          ...state.progress,
          completed,
          failed,
          current: completed + failed,
          isActive: completed + failed < state.progress.total,
          estimatedTimeRemaining: Math.max(0, (state.progress.total - completed - failed) * 30),
        },
        isGenerating: completed + failed < state.progress.total,
        lastSaved: new Date().toISOString(),
      };

      console.log(`✅ State updated: ${completed}/${state.progress.total} completed`);
      return newState;
    }

    case 'FAIL_ITEM': {
      const { id, error } = action.payload;
      const updatedItems = state.items.map(item =>
        item.id === id
          ? { ...item, status: 'failed' as const, error, retryCount: item.retryCount + 1 }
          : item
      );

      const failed = updatedItems.filter(item => item.status === 'failed').length;
      const completed = updatedItems.filter(item => item.status === 'completed').length;

      return {
        ...state,
        items: updatedItems,
        progress: {
          ...state.progress,
          failed,
          current: completed + failed,
          isActive: completed + failed < state.progress.total,
          estimatedTimeRemaining: Math.max(0, (state.progress.total - completed - failed) * 30),
        },
        isGenerating: completed + failed < state.progress.total,
        lastSaved: new Date().toISOString(),
      };
    }

    case 'PAUSE_GENERATION':
      return {
        ...state,
        progress: { ...state.progress, isActive: false },
        isGenerating: false,
        lastSaved: new Date().toISOString(),
      };

    case 'RESUME_GENERATION':
      return {
        ...state,
        progress: { ...state.progress, isActive: true },
        isGenerating: true,
        lastSaved: new Date().toISOString(),
      };

    case 'CANCEL_GENERATION':
      return {
        ...state,
        items: state.items.map(item =>
          item.status === 'processing' ? { ...item, status: 'pending' as const } : item
        ),
        progress: { ...state.progress, isActive: false },
        isGenerating: false,
        lastSaved: new Date().toISOString(),
      };

    case 'RESET_GENERATION':
      return initialState;

    case 'LOAD_FROM_STORAGE':
      return action.payload;

    default:
      return state;
  }
}

// Context
interface BulkGenerationContextType {
  state: BulkGenerationState;
  startBulkGeneration: (request: BulkGenerationRequest) => void;
  pauseBulkGeneration: () => void;
  resumeBulkGeneration: () => void;
  cancelBulkGeneration: () => void;
  resetBulkGeneration: () => void;
}

const BulkGenerationContext = createContext<BulkGenerationContextType | undefined>(undefined);

// Provider component
interface BulkGenerationProviderProps {
  children: ReactNode;
  userId?: string;
  onArticleSaved?: (article: Article) => void;
}

export function BulkGenerationProvider({ children, userId, onArticleSaved }: BulkGenerationProviderProps) {
  const [state, dispatch] = useReducer(bulkGenerationReducer, initialState);
  const serviceRef = useRef<BulkGenerationService | null>(null);
  const originalConsoleLog = useRef<typeof console.log | null>(null);

  // Initialize service
  useEffect(() => {
    serviceRef.current = createBulkGenerationService({
      onProgress: (itemId, progress) => {
        dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, updates: { progress } } });
      },
      onComplete: async (itemId, article) => {
        console.log(`🎯 onComplete callback triggered for item ${itemId}`);
        try {
          // Save article to Supabase if we have a userId
          if (userId && article) {
            console.log(`💾 Saving article ${itemId} to Supabase`);
            const savedArticle = await supabaseService.addArticle({
              ...article,
              user_id: userId,
            });
            console.log(`✅ Article ${itemId} saved to Supabase`);
            // Notify parent component that article was saved
            onArticleSaved?.(savedArticle);
            // Update the item with the saved article (which has the correct ID from Supabase)
            console.log(`🔄 Dispatching COMPLETE_ITEM for ${itemId}`);
            dispatch({ type: 'COMPLETE_ITEM', payload: { id: itemId, article: savedArticle } });
            console.log(`✅ COMPLETE_ITEM dispatched for ${itemId}`);
          } else {
            console.log(`📝 No userId, using local state for ${itemId}`);
            // Fallback to local state only
            dispatch({ type: 'COMPLETE_ITEM', payload: { id: itemId, article } });
            console.log(`✅ Local COMPLETE_ITEM dispatched for ${itemId}`);
          }
        } catch (error) {
          console.error('Failed to save article to Supabase:', error);
          // Still mark as completed but with error indication
          dispatch({ type: 'FAIL_ITEM', payload: { id: itemId, error: 'Failed to save to database' } });
        }
      },
      onError: (itemId, error) => {
        dispatch({ type: 'FAIL_ITEM', payload: { id: itemId, error } });
      },
      onStart: (itemId) => {
        dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, updates: { status: 'processing' } } });
      },
    });
  }, [userId, onArticleSaved]);

  // Load from localStorage on mount and resume bulk generation if needed
  useEffect(() => {
    console.log('🔄 Bulk generation context initialized');

    const saved = localStorage.getItem('bulkGenerationState');
    const savedRequest = localStorage.getItem('bulkGenerationLastRequest');

    if (saved && savedRequest) {
      try {
        const parsedState = JSON.parse(saved);
        const parsedRequest = JSON.parse(savedRequest);

        // Check if state is stale (older than 2 hours)
        const lastSaved = parsedState.lastSaved ? new Date(parsedState.lastSaved) : null;
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        if (lastSaved && lastSaved < twoHoursAgo) {
          console.log('🧹 Clearing stale bulk generation state from localStorage (2h+)');
          localStorage.removeItem('bulkGenerationState');
          localStorage.removeItem('bulkGenerationLastRequest');
          return;
        }

        // Check if there are unfinished items (pending or processing)
        const hasUnfinishedItems = parsedState.items?.some((item: any) =>
          item.status === 'pending' || item.status === 'processing'
        );

        if (hasUnfinishedItems && parsedState.items?.length > 0) {
          console.log('🔄 Found unfinished bulk generation, resuming...');
          console.log(`📊 State: ${parsedState.progress.completed}/${parsedState.progress.total} completed`);

          // Load the state first
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState });

          // Resume bulk generation after a short delay to ensure state is loaded
          setTimeout(async () => {
            if (serviceRef.current) {
              try {
                const pendingItems = parsedState.items.filter((item: any) =>
                  item.status === 'pending' || item.status === 'processing'
                );

                if (pendingItems.length > 0) {
                  console.log(`▶️ Resuming ${pendingItems.length} unfinished items`);
                  await serviceRef.current.resumeBulkGeneration(
                    pendingItems,
                    parsedRequest,
                    (itemId, updates) => {
                      dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, updates } });
                    }
                  );
                  dispatch({ type: 'RESUME_GENERATION' });
                }
              } catch (error) {
                console.error('Failed to resume bulk generation:', error);
                // Clear corrupted state
                localStorage.removeItem('bulkGenerationState');
                localStorage.removeItem('bulkGenerationLastRequest');
              }
            }
          }, 1000); // Wait 1 second for state to load
        } else if (parsedState.items?.length > 0) {
          // Load completed state for display
          console.log('📊 Loading completed bulk generation state');
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState });
        }
      } catch (error) {
        console.error('Failed to load bulk generation state from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('bulkGenerationState');
        localStorage.removeItem('bulkGenerationLastRequest');
      }
    } else {
      console.log('📭 No saved bulk generation state found');
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.lastSaved) {
      localStorage.setItem('bulkGenerationState', JSON.stringify(state));
    }
  }, [state]);

  // Milestone-based progress tracking for reliable updates
  useEffect(() => {
    if (!state.isGenerating) return;

    // Store original console.log
    originalConsoleLog.current = console.log;

    // Monitor for article completion milestone
    const originalLog = console.log;
    console.log = (...args) => {
      // Call original log first
      originalLog.apply(console, args);

      // Monitor for article completion milestone
      const message = args.join(' ');

      if (message.includes('🎉 Article creation completed for topic:')) {
        console.log('📊 Milestone reached: Article completed, progress will update via service callback');

        // Don't manually complete here - let the service's onComplete callback handle it
        // This milestone just confirms the article generation finished successfully
        // The actual completion will come through the service's onComplete callback
      }
    };

    // Cleanup function to restore original console.log
    return () => {
      console.log = originalLog;
    };
  }, [state.isGenerating, state.items]);

  const startBulkGeneration = async (request: BulkGenerationRequest) => {
    if (!serviceRef.current) {
      throw new Error('Bulk generation service not initialized');
    }

    try {
      // Create items first before dispatching
      const { topics, count } = request;
      const timestamp = Date.now();
      console.log(`🆔 Creating items with timestamp: ${timestamp}`);

      const items: BulkGenerationItem[] = topics.flatMap(topic =>
        Array.from({ length: count }, (_, index) => {
          const itemId = `${topic}-${index}-${timestamp}`;
          console.log(`🆔 Created item: ${itemId}`);
          return {
            id: itemId,
            topic,
            status: 'pending' as const,
            progress: 0,
            retryCount: 0,
          };
        })
      );

      // Save request to localStorage for resume functionality
      localStorage.setItem('bulkGenerationLastRequest', JSON.stringify(request));

      // Dispatch the request with items to avoid timestamp mismatch
      dispatch({ type: 'START_GENERATION', payload: { request, items } });

      // Pass existing items to service to avoid ID mismatch
      await serviceRef.current.startBulkGeneration(
        request,
        items, // Use the same items created above
        (itemId, updates) => {
          console.log(`🔄 Service callback for item ${itemId}:`, updates);
          dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, updates } });
        }
      );
    } catch (error) {
      console.error('Failed to start bulk generation:', error);
      throw error;
    }
  };

  const pauseBulkGeneration = () => {
    if (serviceRef.current) {
      serviceRef.current.stopBulkGeneration();
    }
    dispatch({ type: 'PAUSE_GENERATION' });
  };

  const resumeBulkGeneration = () => {
    if (!serviceRef.current) {
      throw new Error('Bulk generation service not initialized');
    }

    try {
      // Get pending items to resume
      const pendingItems = state.items.filter(item => item.status === 'pending');

      if (pendingItems.length === 0) {
        console.log('No pending items to resume');
        return;
      }

      // Try to get last request from localStorage
      let lastRequest: BulkGenerationRequest | null = null;
      try {
        const savedRequest = localStorage.getItem('bulkGenerationLastRequest');
        if (savedRequest) {
          lastRequest = JSON.parse(savedRequest);
        }
      } catch (error) {
        console.error('Failed to load last request from localStorage:', error);
      }

      // If no saved request, create from current state
      if (!lastRequest) {
        lastRequest = {
          topics: [...new Set(pendingItems.map(item => item.topic))], // Get unique topics
          location: 'United Kingdom', // Default fallback
          tone: 'Professional', // Default fallback
          contentQuality: ['Comprehensive', 'SEO-Optimized'],
          count: 1
        };
      }

      // Resume generation with pending items
      serviceRef.current.resumeBulkGeneration(
        pendingItems,
        lastRequest,
        (itemId, updates) => {
          dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, updates } });
        }
      );

      dispatch({ type: 'RESUME_GENERATION' });
    } catch (error) {
      console.error('Failed to resume bulk generation:', error);
      throw error;
    }
  };

  const cancelBulkGeneration = () => {
    if (serviceRef.current) {
      serviceRef.current.stopBulkGeneration();
    }
    dispatch({ type: 'CANCEL_GENERATION' });
  };

  const resetBulkGeneration = () => {
    if (serviceRef.current) {
      serviceRef.current.stopBulkGeneration();
    }
    dispatch({ type: 'RESET_GENERATION' });
  };

  const value: BulkGenerationContextType = {
    state,
    startBulkGeneration,
    pauseBulkGeneration,
    resumeBulkGeneration,
    cancelBulkGeneration,
    resetBulkGeneration,
  };

  return (
    <BulkGenerationContext.Provider value={value}>
      {children}
    </BulkGenerationContext.Provider>
  );
}

// Hook to use the context
export function useBulkGeneration() {
  const context = useContext(BulkGenerationContext);
  if (context === undefined) {
    throw new Error('useBulkGeneration must be used within a BulkGenerationProvider');
  }
  return context;
}
