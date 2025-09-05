import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

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

export class LOCGCrawler {
  private static instance: LOCGCrawler;
  private browser?: puppeteer.Browser;

  private constructor() {}

  public static getInstance(): LOCGCrawler {
    if (!LOCGCrawler.instance) {
      LOCGCrawler.instance = new LOCGCrawler();
    }
    return LOCGCrawler.instance;
  }

  /**
   * Initialize the crawler (start browser if using Puppeteer)
   */
  public async initialize(): Promise<void> {
    // We'll start with cheerio-only approach, initialize browser only if needed
    console.log('LOCG Crawler initialized');
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      console.log('LOCG Crawler browser closed');
    }
  }

  /**
   * Crawl a single LOCG URL and count li.issues elements
   */
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
      const puppeteerResult = await this.crawlWithPuppeteer(url, credentials);
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
      const pageText = $.text();
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
   * Crawl with Puppeteer (slower, but handles JS-rendered content)
   */
  private async crawlWithPuppeteer(url: string, credentials?: { username: string; password: string }): Promise<Omit<CrawlResult, 'crawledAt'>> {
    let page: puppeteer.Page | undefined;
    
    try {
      // Always create a fresh browser for each crawl to avoid connection issues
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (error) {
          console.warn('Error closing existing browser:', error);
        }
        this.browser = undefined;
      }
      
      this.browser = await puppeteer.launch({
        headless: false, // Make it visible so you can see what's happening
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--start-maximized' // Start browser maximized
        ],
        devtools: true, // Enable dev tools
        slowMo: 100, // Add some delay to see what's happening
        defaultViewport: null // Use full available screen space
      });

      page = await this.browser.newPage();
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
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
        
        // Submit the form - try multiple approaches
        console.log('Submitting login form...');
        try {
          // Try pressing Enter on the password field first
          await page.focus('input[name="password"]');
          await page.keyboard.press('Enter');
        } catch (error) {
          console.log('Enter key submit failed, trying button click...');
          try {
            // Try various submit button selectors
            await page.click('button[type="submit"]');
          } catch (error2) {
            try {
              await page.click('input[type="submit"]');
            } catch (error3) {
              try {
                // Try to find submit button by text content
                await page.evaluate(() => {
                  const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
                  const submitButton = buttons.find(button => {
                    const text = button.textContent?.toLowerCase() || button.getAttribute('value')?.toLowerCase() || '';
                    return text.includes('log in') || text.includes('sign in') || text.includes('login') || text.includes('submit');
                  });
                  if (submitButton) {
                    (submitButton as HTMLElement).click();
                  } else {
                    // Last resort - submit the form directly
                    const form = document.querySelector('form');
                    if (form) form.submit();
                  }
                });
              } catch (error4) {
                throw new Error('Could not submit login form with any method');
              }
            }
          }
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

      // Wait a bit for any dynamic content to load (using the new method)
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
        
        // Check if new issues have loaded by getting current badge counts
        const currentCounts = await page.evaluate(() => {
          const filterList = document.querySelector('#filter-options-formats-list-series');
          if (filterList) {
            const regularIssuesElement = Array.from(filterList.querySelectorAll('li.filter-options-formats'))
              .find(li => li.querySelector('.option-name')?.textContent?.trim() === 'Regular Issues');
            const annualsElement = Array.from(filterList.querySelectorAll('li.filter-options-formats'))
              .find(li => li.querySelector('.option-name')?.textContent?.trim() === 'Annuals');
            
            const regularCount = regularIssuesElement?.querySelector('.badge')?.textContent?.trim() || '0';
            const annualCount = annualsElement?.querySelector('.badge')?.textContent?.trim() || '0';
            
            return {
              regular: parseInt(regularCount, 10),
              annuals: parseInt(annualCount, 10),
              total: parseInt(regularCount, 10) + parseInt(annualCount, 10)
            };
          }
          return { regular: 0, annuals: 0, total: 0 };
        });
        
        console.log(`After scroll ${i}: Regular: ${currentCounts.regular}, Annuals: ${currentCounts.annuals}, Total: ${currentCounts.total}`);
        
        // Log progress for debugging
        console.log(`Lazy load attempt ${i}/5 - Regular: ${currentCounts.regular}, Annuals: ${currentCounts.annuals}, Total: ${currentCounts.total}`);
      }
      
      console.log('Lazy loading complete, getting final counts and year range...');

      // Get counts from filter options badges and extract year range (target the correct HTML structure)
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

      // Add a success message to the page for inspection
      await page.evaluate((counts) => {
        const message = document.createElement('div');
        message.innerHTML = `
          <div style="position: fixed; top: 10px; right: 10px; background: #28a745; color: white; padding: 15px; border-radius: 8px; z-index: 9999; font-family: Arial, sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0;">🎉 Crawler Success!</h3>
            <p style="margin: 0; font-size: 14px;"><strong>Regular Issues: ${counts.regularIssues}</strong></p>
            <p style="margin: 0; font-size: 14px;"><strong>Annuals: ${counts.annuals}</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Total: ${counts.total}</strong></p>
            ${counts.run ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Years: ${counts.run}</strong></p>` : ''}
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.9;">You can now close this browser window</p>
          </div>
        `;
        document.body.appendChild(message);
      }, issueCounts);

      // Don't close the browser - let user inspect the results
      console.log('Browser window left open for inspection - close manually when done');

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
      
      // Add error message to the page if it exists
      if (page) {
        try {
          await page.evaluate((errorMsg) => {
            const message = document.createElement('div');
            message.innerHTML = `
              <div style="position: fixed; top: 10px; right: 10px; background: #dc3545; color: white; padding: 15px; border-radius: 8px; z-index: 9999; font-family: Arial, sans-serif; max-width: 300px;">
                <h3 style="margin: 0 0 10px 0;">❌ Crawler Error</h3>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${errorMsg}</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.9;">You can inspect the page and close this browser window</p>
              </div>
            `;
            document.body.appendChild(message);
          }, error instanceof Error ? error.message : 'Unknown error');
        } catch (evalError) {
          console.warn('Could not add error message to page:', evalError);
        }
      }
      
      // Don't close browser on error - let user inspect what went wrong
      console.log('Browser window left open for error inspection - close manually when done');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Puppeteer crawling failed',
        url
      };
    }
  }

  /**
   * Add delay between requests to be respectful to the server
   */
  public static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default LOCGCrawler.getInstance();