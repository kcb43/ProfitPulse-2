/**
 * Base processor class for marketplace listing automation
 */

export class BaseProcessor {
  constructor(browser, job, cookies, userAgent) {
    this.browser = browser;
    this.job = job;
    this.cookies = cookies;
    this.userAgent = userAgent;
    this.page = null;
  }

  /**
   * Initialize the browser page
   */
  async init() {
    const context = await this.browser.newContext({
      userAgent: this.userAgent,
      viewport: { width: 1280, height: 720 },
    });

    // Set cookies
    if (this.cookies && this.cookies.length > 0) {
      await context.addCookies(this.cookies);
    }

    this.page = await context.newPage();
  }

  /**
   * Process the listing job
   * Must be implemented by subclasses
   */
  async process() {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
  }
}

