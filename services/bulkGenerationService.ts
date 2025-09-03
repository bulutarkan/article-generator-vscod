import { generateSeoGeoArticle } from './geminiService';
import { webCrawlerService } from './webCrawlerService';
import { BulkGenerationRequest, BulkGenerationItem, Article } from '../types';

export interface BulkGenerationCallbacks {
  onProgress?: (itemId: string, progress: number) => void;
  onComplete?: (itemId: string, article: Article) => void;
  onError?: (itemId: string, error: string) => void;
  onStart?: (itemId: string) => void;
}

export class BulkGenerationService {
  private isRunning = false;
  private abortController: AbortController | null = null;
  private callbacks: BulkGenerationCallbacks = {};

  constructor(callbacks: BulkGenerationCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async startBulkGeneration(
    request: BulkGenerationRequest,
    items: BulkGenerationItem[],
    onUpdate: (itemId: string, updates: Partial<BulkGenerationItem>) => void
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bulk generation is already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      // Process items sequentially
      for (const item of items) {
        if (this.abortController.signal.aborted) {
          break;
        }

        await this.processItem(item, request, onUpdate);

        // Rate limiting: Wait between requests to avoid API limits
        if (!this.abortController.signal.aborted) {
          await this.delay(2000); // 2 second delay between requests
        }
      }
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  private async processItem(
    item: BulkGenerationItem,
    request: BulkGenerationRequest,
    onUpdate: (itemId: string, updates: Partial<BulkGenerationItem>) => void
  ): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount <= maxRetries && !this.abortController?.signal.aborted) {
      let progressInterval: NodeJS.Timeout | null = null;

      try {
        // Update status to processing
        onUpdate(item.id, { status: 'processing', progress: 10 });
        this.callbacks.onStart?.(item.id);

        // Simulate progress updates during generation with better timing
        let progressValue = 10;
        const startTime = Date.now();
        const estimatedDuration = 25000; // 25 seconds estimated per article

        progressInterval = setInterval(() => {
          if (this.abortController?.signal.aborted) {
            if (progressInterval) clearInterval(progressInterval);
            return;
          }

          const elapsed = Date.now() - startTime;
          const timeBasedProgress = Math.min(85, (elapsed / estimatedDuration) * 100);

          // Add some randomness but keep it realistic
          const randomFactor = (Math.random() - 0.5) * 10; // ±5%
          progressValue = Math.min(90, Math.max(timeBasedProgress, progressValue + randomFactor));

          onUpdate(item.id, { progress: Math.round(progressValue) });
        }, 1500); // Update every 1.5 seconds for smoother progress

        try {
          // Get internal links context if enabled
          let internalLinksContext: string | undefined = undefined;
          if (request.enableInternalLinks && request.websiteUrl) {
            try {
              console.log(`🔗 Getting internal links context for topic: ${item.topic}`);

          // Use webCrawlerService like single article generation
          internalLinksContext = await webCrawlerService.getWebsiteContext(request.websiteUrl, item.topic);

              console.log(`✅ Internal links context generated (${internalLinksContext?.length || 0} chars)`);
            } catch (error) {
              console.warn(`⚠️ Failed to get internal links context:`, error);
              // Continue without internal links context
            }
          }

          // Generate the article
          const articleData = await generateSeoGeoArticle(
            item.topic,
            request.location,
            request.tone,
            undefined, // brief
            request.enableInternalLinks || false, // enableInternalLinks
            request.websiteUrl, // websiteUrl
            internalLinksContext // internalLinksContext
          );

          if (progressInterval) clearInterval(progressInterval);

          if (this.abortController?.signal.aborted) {
            return;
          }

          // Create complete article object
          const article: Article = {
            id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: '', // Will be set by the context when saving to Supabase
            title: articleData.title,
            topic: item.topic,
            createdAt: new Date().toISOString(),
            location: request.location,
            articleContent: articleData.articleContent,
            metaDescription: articleData.metaDescription,
            keywords: articleData.keywords,
            priceComparison: articleData.priceComparison,
            generalComparison: articleData.generalComparison,
            monthlySearches: articleData.monthlySearches,
            primaryKeyword: articleData.primaryKeyword,
            keywordDifficulty: articleData.keywordDifficulty,
            content_quality: articleData.content_quality,
            tone: request.tone,
          };

          // Update item as completed
          console.log(`🔄 Updating item ${item.id} to completed status`);
          onUpdate(item.id, {
            status: 'completed',
            progress: 100,
            article,
            retryCount
          });

          console.log(`📞 Calling onComplete callback for item ${item.id} (topic: ${item.topic})`);
          this.callbacks.onComplete?.(item.id, article);
          console.log(`✅ onComplete callback called for item ${item.id}`);
          return;

        } finally {
          if (progressInterval) clearInterval(progressInterval);
        }

      } catch (error: any) {
        retryCount++;
        if (progressInterval) clearInterval(progressInterval);

        if (this.abortController?.signal.aborted) {
          return;
        }

        const errorMessage = error.message || 'Unknown error occurred';

        console.error(`Error processing item ${item.id} (attempt ${retryCount}/${maxRetries + 1}):`, error);

        // If this was the last retry, mark as failed
        if (retryCount > maxRetries) {
          onUpdate(item.id, {
            status: 'failed',
            progress: 0,
            error: errorMessage,
            retryCount
          });
          this.callbacks.onError?.(item.id, errorMessage);
          return;
        }

        // Wait before retrying (exponential backoff)
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        await this.delay(retryDelay);

        // Update progress to show retry attempt
        onUpdate(item.id, {
          status: 'processing',
          progress: 5,
          retryCount
        });
      }
    }
  }

  stopBulkGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
  }

  resumeBulkGeneration(
    items: BulkGenerationItem[],
    request: BulkGenerationRequest,
    onUpdate: (itemId: string, updates: Partial<BulkGenerationItem>) => void
  ): void {
    if (this.isRunning) {
      throw new Error('Bulk generation is already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    // Resume from pending items
    const pendingItems = items.filter(item => item.status === 'pending');

    if (pendingItems.length === 0) {
      this.isRunning = false;
      return;
    }

    // Start processing pending items
    this.processPendingItems(pendingItems, request, onUpdate);
  }

  private async processPendingItems(
    pendingItems: BulkGenerationItem[],
    request: BulkGenerationRequest,
    onUpdate: (itemId: string, updates: Partial<BulkGenerationItem>) => void
  ): Promise<void> {
    try {
      for (const item of pendingItems) {
        if (this.abortController.signal.aborted) {
          break;
        }

        await this.processItem(item, request, onUpdate);

        // Rate limiting: Wait between requests to avoid API limits
        if (!this.abortController.signal.aborted) {
          await this.delay(2000); // 2 second delay between requests
        }
      }
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  isBulkGenerationRunning(): boolean {
    return this.isRunning;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}

// Factory function to create service instance
export function createBulkGenerationService(callbacks: BulkGenerationCallbacks = {}): BulkGenerationService {
  return new BulkGenerationService(callbacks);
}
