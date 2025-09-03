import path from 'path';
import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.mp4'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  plugins: [
    {
      name: 'google-trends-middleware',
      configureServer(server: ViteDevServer) {
        server.middlewares.use('/api/google-trends', async (req, res) => {
          const logs: string[] = [];
          let error: string | null = null;

          try {
            // Import Google Trends service dynamically
            const { getKeywordTrend, estimateSearchVolume, estimateCompetition, getRelatedKeywords } = await import('./services/googleTrendsService');

            // Query parameters
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const keyword = url.searchParams.get('keyword');
            const location = url.searchParams.get('location');

            if (!keyword || !location) {
              error = 'Both keyword and location parameters are required';
              logs.push('❌ Missing keyword or location parameter');
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ logs, error }));
              return;
            }

            logs.push(`� Server-side Google Trends for: "${keyword}" in ${location}`);

            // Get all Google Trends data in parallel
            const [trend, volume, competition, related] = await Promise.all([
              getKeywordTrend(keyword, location),
              estimateSearchVolume(keyword, location),
              estimateCompetition(keyword, location),
              getRelatedKeywords(keyword, location)
            ]);

            logs.push(`✅ Google Trends data retrieved successfully`);
            logs.push(`� Trend: ${trend}, Volume: ${volume}, Competition: ${competition}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              trend,
              volume,
              competition,
              related,
              logs,
              error: null
            }));

          } catch (err: any) {
            error = err.message || 'Unknown error';
            logs.push(`❌ Server-side Google Trends error: ${error}`);
            console.error('Server-side Google Trends error:', err);

            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ logs, error }));
          }
        });
      }
    }
  ]
});
