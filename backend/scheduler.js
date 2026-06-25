const cron = require('node-cron');
const webScraperService = require('./services/webScraperService');
const rssAggregationService = require('./services/rssAggregationService');

const init = () => {
  // Run RSS aggregator every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running RSS Aggregator...');
    try {
      await rssAggregationService.aggregateFeeds();
      console.log('RSS Aggregation completed.');
    } catch (error) {
      console.error('Error during RSS Aggregation:', error);
    }
  });

  // Run Web Scraper every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running Web Scraper...');
    try {
      await webScraperService.scrapeAll();
      console.log('Web Scraping completed.');
    } catch (error) {
      console.error('Error during Web Scraping:', error);
    }
  });

  console.log('Scheduler initialized. Jobs are queued.');
};

module.exports = { init };
