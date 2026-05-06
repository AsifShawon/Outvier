import axios from 'axios';
import { CKAN_ENDPOINTS, CRICOS_CONFIG } from '../../config/cricosResources';

export interface CkanSearchParams {
  resource_id: string;
  limit?: number;
  offset?: number;
  q?: string;
  filters?: Record<string, any>;
  sort?: string;
}

export interface CkanResponse {
  help: string;
  success: boolean;
  result: {
    records: any[];
    fields: any[];
    limit: number;
    offset: number;
    total: number;
    _links: {
      start: string;
      next: string;
    };
  };
}

export const cricosCkanService = {
  /**
   * Core CKAN datastore_search call
   */
  async datastoreSearch(params: CkanSearchParams): Promise<CkanResponse['result']> {
    const url = `${CKAN_ENDPOINTS.BASE_URL}${CKAN_ENDPOINTS.DATASTORE_SEARCH}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (CRICOS_CONFIG.API_TOKEN) {
      headers['Authorization'] = CRICOS_CONFIG.API_TOKEN;
    }

    try {
      console.log(`[CRICOS] Fetching ${params.resource_id} (limit: ${params.limit}, offset: ${params.offset})`);
      const response = await axios.post<CkanResponse>(url, params, { headers });

      if (!response.data.success) {
        throw new Error(`CKAN API error: ${JSON.stringify(response.data)}`);
      }

      return response.data.result;
    } catch (error: any) {
      console.error(`[CRICOS] CKAN API request failed:`, error.message);
      if (error.response?.data) {
        console.error(`[CRICOS] Error data:`, JSON.stringify(error.response.data));
      }
      throw error;
    }
  },

  /**
   * Paginate through all records for a resource
   */
  async getAllRecords(resourceId: string, filters?: Record<string, any>): Promise<any[]> {
    let allRecords: any[] = [];
    let offset = 0;
    const limit = CRICOS_CONFIG.SYNC_LIMIT || 5000;
    let total = Infinity;
    const maxPages = 100; // Safety guard
    let page = 0;

    while (offset < total && page < maxPages) {
      const result = await this.datastoreSearch({
        resource_id: resourceId,
        limit,
        offset,
        filters,
      });

      allRecords = allRecords.concat(result.records);
      total = result.total;
      offset += result.records.length;
      page++;

      if (result.records.length === 0) break;
    }

    return allRecords;
  },

  /**
   * Helper to get field names for a resource
   */
  async getResourceFields(resourceId: string): Promise<string[]> {
    const result = await this.datastoreSearch({
      resource_id: resourceId,
      limit: 1,
    });
    return result.fields.map((f: any) => f.id);
  },

  /**
   * Query records by CRICOS Provider Code
   */
  async queryByProviderCode(resourceId: string, providerCode: string): Promise<any[]> {
    // Note: Column name might be "CRICOS Provider Code" or similar. 
    // The mapper should handle exact matching, but here we pass filters as-is.
    return this.getAllRecords(resourceId, { "CRICOS Provider Code": providerCode });
  },

  /**
   * Text search on a resource
   */
  async search(resourceId: string, q: string, limit: number = 10): Promise<any[]> {
    const result = await this.datastoreSearch({
      resource_id: resourceId,
      q,
      limit,
    });
    return result.records;
  },
};
