const Parser = require('rss-parser');
const Internship = require('../models/Internship');
const parser = new Parser();

const feeds = [
  'https://www.reddit.com/r/csmajors/search.rss?q=internship&restrict_sr=1',
  'https://www.reddit.com/r/EngineeringStudents/search.rss?q=internship&restrict_sr=1'
];

const aggregateFeeds = async () => {
  let addedCount = 0;

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      for (const item of feed.items) {
        const title = item.title.toLowerCase();
        // Check if it's actually an internship posting and not just a question
        if ((title.includes('hiring') || title.includes('opening') || title.includes('application')) && title.includes('intern')) {
          
          const existing = await Internship.findOne({ url: item.link });
          if (!existing) {
            await Internship.create({
              title: item.title,
              company: 'Unknown (Reddit)', // Reddit posts usually don't have structured company
              description: item.contentSnippet || item.content,
              url: item.link,
              source: feed.title || 'Reddit RSS',
              isRemote: title.includes('remote'),
              postedAt: new Date(item.pubDate)
            });
            addedCount++;
          }
        }
      }
    } catch (err) {
      console.error(`Error parsing feed ${feedUrl}:`, err.message);
    }
  }

  console.log(`Added ${addedCount} new internships from RSS feeds`);
};

module.exports = { aggregateFeeds };
