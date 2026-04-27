import * as cheerio from 'cheerio';
import { BaseConnector, ConnectorResult } from './base.connector';
import { IUniversity } from '../../models/University.model';

export class UniversityOfficialConnector extends BaseConnector<Partial<IUniversity>> {
  constructor() {
    super('UniversityOfficial');
  }

  async execute(targetId: string, context?: Record<string, any>): Promise<ConnectorResult<Partial<IUniversity>>[]> {
    if (!context?.website) {
      return [{
        success: false,
        error: 'No website URL provided in context',
        sourceUrl: '',
        confidence: 0,
      }];
    }

    const url = context.website as string;

    try {
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      // Attempt to extract description from meta tags
      const metaDescription = $('meta[name="description"]').attr('content') || 
                              $('meta[property="og:description"]').attr('content');

      // Extracted fields
      const updates: Partial<IUniversity> = {};
      
      if (metaDescription) {
        updates.description = metaDescription.trim();
      }

      // Try to find an established year in the footer or text (very basic regex)
      // Look for "Established 19xx" or "Est. 19xx"
      const bodyText = $('body').text();
      const estMatch = bodyText.match(/(?:established|est\.?)\s*(?:in\s*)?([1-2][0-9]{3})/i);
      
      if (estMatch && estMatch[1]) {
        updates.establishedYear = parseInt(estMatch[1], 10);
      }

      if (Object.keys(updates).length === 0) {
        return [{
          success: true,
          data: updates,
          sourceUrl: url,
          confidence: 0.1, // Very low confidence if we found nothing useful
        }];
      }

      return [{
        success: true,
        data: updates,
        sourceUrl: url,
        confidence: 0.85, // Direct from official website meta tags
      }];

    } catch (error: any) {
      return [{
        success: false,
        error: error.message,
        sourceUrl: url,
        confidence: 0,
      }];
    }
  }
}

export const universityOfficialConnector = new UniversityOfficialConnector();
