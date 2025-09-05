import * as cheerio from 'cheerio';
import chromium from '@sparticuz/chromium';
import puppeteer, { Browser, Page } from 'puppeteer-core';

export interface CrawlResult {
  success: boolean;
  issueCount?: number;
  regularIssues?: number;
  annuals?: number;
  run?: string;
  error?: string;
  url: string;
  crawledAt: string;
}

export class LOCGCrawlerVercel {
  private static instance: LOCGCrawlerVercel;
  private browser?: Browser;

  private constructor() {}

  public static getInstance(): LOCGCrawlerVercel {
    if (!LOCGCrawlerVercel.instance) {
      LOCGCrawlerVercel.instance = new LOCGCrawlerVercel();
    }
    return LOCGCrawlerVercel.instance;
  }

  public async initialize(): Promise<void> {
    console.log('LOCG Crawler (Vercel) initialized');
  }

  public async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      console.log('LOCG Crawler browser closed');
    }
  }

  public async crawlSeries(url: string, credentials?: { username: string; password: string }): Promise<CrawlResult> {
    const crawledAt = new Date().toISOString();
    
    try {
      // Validate URL
      if (!url || !url.includes('leagueofcomicgeeks.com')) {
        return {
          success: false,
          error: 'Invalid LOCG URL',
          url,
          crawledAt
        };
      }

      console.log(`Crawling LOCG URL: ${url}`);

      // First, try with simple HTTP fetch + cheerio
      const result = await this.crawlWithCheerio(url);
      if (result.success) {
        return { ...result, crawledAt };
      }

      // If cheerio fails (likely due to JavaScript rendering), try Puppeteer
      console.log('Cheerio failed, trying Puppeteer...');
      const puppeteerResult = await this.crawlWithPuppeteerVercel(url, credentials);
      return { ...puppeteerResult, crawledAt };

    } catch (error) {
      console.error('Error crawling LOCG URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url,
        crawledAt
      };
    }
  }

  /**
   * Try to crawl with Cheerio (faster, but won't work with JS-rendered content)
   */
  private async crawlWithCheerio(url: string): Promise<Omit<CrawlResult, 'crawledAt'>> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          url
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Count li elements inside the comic-list-issues ul, excluding those with variant toggles
      const allIssues = $('#comic-list-issues li');
      const issuesWithoutVariants = allIssues.filter((i, el) => {
        return $(el).find('.variant-toggle').length === 0;
      });
      const issueCount = issuesWithoutVariants.length;

      // Extract year range from the page (look for pattern like "2022 - 2023")
      let run: string | undefined;
      const pageText = $('body').text();
      const yearRangeMatch = pageText.match(/(\d{4}\s*-\s*\d{4})/);
      if (yearRangeMatch) {
        run = yearRangeMatch[1].trim();
        console.log(`Found year range with cheerio: ${run}`);
      }

      console.log(`Found ${allIssues.length} total issues, ${issueCount} unique issues (excluding variants) with cheerio`);

      // If we found issues, return success
      if (issueCount > 0) {
        return {
          success: true,
          issueCount,
          run,
          url
        };
      }

      // If no issues found, it might be JS-rendered content
      return {
        success: false,
        error: 'No issues found in #comic-list-issues - content might be JavaScript-rendered',
        url
      };

    } catch (error) {
      console.error('Cheerio crawling failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cheerio parsing failed',
        url
      };
    }
  }

  /**
   * Crawl with Puppeteer using Vercel-compatible chrome
   */
  private async crawlWithPuppeteerVercel(url: string, credentials?: { username: string; password: string }): Promise<Omit<CrawlResult, 'crawledAt'>> {
    let page: Page | undefined;
    
    try {
      // Use chromium for Vercel
      const isLocal = process.env.NODE_ENV === 'development';
      
      this.browser = await puppeteer.launch({
        args: isLocal ? [] : chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: isLocal
          ? undefined // Use local Puppeteer Chrome
          : await chromium.executablePath(),
        headless: isLocal ? false : true, // Visible locally, headless on Vercel
      });

      page = await this.browser.newPage();
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set extra HTTP headers to handle HTTPS errors gracefully
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });
      
      // Handle login if credentials are provided
      if (credentials) {
        console.log('Navigating to LOCG login page...');
        await page.goto('https://leagueofcomicgeeks.com/login', { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });

        // Fill in the login form
        console.log('Filling login credentials...');
        await page.type('input[name="username"]', credentials.username);
        await page.type('input[name="password"]', credentials.password);
        
        // Submit the form
        console.log('Submitting login form...');
        try {
          await page.focus('input[name="password"]');
          await page.keyboard.press('Enter');
        } catch (error) {
          console.log('Enter key submit failed, trying button click...');
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.submit();
          });
        }
        
        // Wait for navigation after login
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        console.log('Login successful, proceeding with crawl...');
      }
      
      // Now navigate to the actual series page
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Wait a bit for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Click the filter button to show the filter options
      console.log('Clicking filter button to show options...');
      try {
        await page.click('#comic-filter-menu');
        console.log('Filter button clicked successfully');
        
        // Wait a moment for the filters to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn('Could not click filter button:', error);
      }

      // Lazy load more issues by scrolling down multiple times
      console.log('Starting lazy loading process...');
      for (let i = 1; i <= 5; i++) {
        console.log(`Lazy loading attempt ${i}/5...`);
        
        // Scroll to bottom of page to trigger lazy loading
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        // Wait for new content to potentially load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('Lazy loading complete, getting final counts and year range...');

      // Get counts from filter options badges and extract year range
      const issueCounts = await page.evaluate(() => {
        let regularIssues = 0;
        let annuals = 0;
        let run: string | undefined;
        
        // Target the specific filter list with badges
        const filterList = document.querySelector('#filter-options-formats-list-series');
        
        if (filterList) {
          const filterOptions = filterList.querySelectorAll('li.filter-options-formats');
          
          filterOptions.forEach(option => {
            const optionName = option.querySelector('.option-name')?.textContent?.trim();
            const badge = option.querySelector('.badge')?.textContent?.trim();
            const count = badge ? parseInt(badge, 10) : 0;
            
            if (optionName === 'Regular Issues') {
              regularIssues = count;
            } else if (optionName === 'Annuals') {
              annuals = count;
            }
          });
        }
        
        // Extract year range from the page (look for pattern like "2022 - 2023")
        const pageText = document.body.textContent || '';
        const yearRangeMatch = pageText.match(/(\d{4}\s*-\s*\d{4})/);
        if (yearRangeMatch) {
          run = yearRangeMatch[1].trim();
        }
        
        return {
          regularIssues,
          annuals,
          total: regularIssues + annuals,
          run,
          foundFilterList: !!filterList
        };
      });
      
      const issueCount = issueCounts.total;

      console.log(`Found Regular Issues: ${issueCounts.regularIssues}, Annuals: ${issueCounts.annuals}, Total: ${issueCounts.total}${issueCounts.run ? `, Run: ${issueCounts.run}` : ''}`);

      return {
        success: true,
        issueCount,
        regularIssues: issueCounts.regularIssues,
        annuals: issueCounts.annuals,
        run: issueCounts.run,
        url
      };

    } catch (error) {
      console.error('Puppeteer crawling failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Puppeteer crawling failed',
        url
      };
    } finally {
      // Always clean up browser in Vercel environment
      if (this.browser && process.env.NODE_ENV !== 'development') {
        await this.browser.close();
        this.browser = undefined;
      }
    }
  }

  public static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default LOCGCrawlerVercel.getInstance();