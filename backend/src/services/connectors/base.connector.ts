export interface ConnectorResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string; // legacy alias for error/info
  sourceUrl?: string;
  confidence?: number;
}

export abstract class BaseConnector<T = unknown> {
  protected sourceName: string;

  constructor(sourceName?: string) {
    this.sourceName = sourceName || 'BaseConnector';
  }

  /**
   * Main execution point for the connector.
   * @param targetId The ID of the entity (e.g. university ID, program ID)
   * @param context Additional context needed for scraping (e.g. specific URLs)
   */
  execute(targetId: string, context?: Record<string, any>): Promise<ConnectorResult<T>[]> {
    // Default implementation — subclasses that use fetch() instead can override
    return Promise.resolve([]);
  }

  /**
   * Normalizes URLs, fetches HTML, handles retries, etc.
   */
  protected async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': process.env.CRAWLER_USER_AGENT ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    return response.text();
  }
}
