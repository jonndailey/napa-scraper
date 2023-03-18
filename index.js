const express = require('express');
const Parser = require('rss-parser');

const app = express();
const port = 3000; // Change this to the desired port number

const FEEDS = ['https://atp.fm/rss', 'https://feeds.megaphone.fm/darknetdiaries', 'https://feeds.simplecast.com/1_9aBk7M', 'https://daringfireball.net/thetalkshow/rss', 'https://feeds.redcircle.com/92bf9085-a91e-49f6-81b8-5b651b52ba3f?_ga=2.40878434.1504349826.1678823285-1290121214.1678823285', 'https://feed.podbean.com/geekanddestroy/feed.xml', 'https://podcast.panic.com/index.xml', 'https://podcast.panic.com/index.xml', 'https://rss.art19.com/business-movers', 'https://rss.art19.com/bachelor-happy-hour'];

async function getLatestEpisodes(feeds) {
	const parser = new Parser();
	const latestEpisodes = [];

	for (const feed of feeds) {
		const feedData = await parser.parseURL(feed);
		const episodes = feedData.items.slice(0, 3);
		latestEpisodes.push(...episodes);
	}

	return latestEpisodes;
}

app.get('/', async (req, res) => {
	const latestEpisodes = await getLatestEpisodes(FEEDS);
	const { episodeIndex = 0 } = req.query;
	const currentEpisode = latestEpisodes[episodeIndex];

	const episodeHtml = `
	<div>
	  <h2>${currentEpisode.title}</h2>
	  <audio src="${currentEpisode.enclosure.url}" preload="none" controls></audio>
	</div>
  `;

	const previousEpisodeIndex = Math.max(0, parseInt(episodeIndex, 10) - 1);
	const nextEpisodeIndex = Math.min(latestEpisodes.length - 1, parseInt(episodeIndex, 10) + 1);

	const navigationHtml = `
	<div>
	  <a href="/?episodeIndex=${previousEpisodeIndex}">Previous</a>
	  <a href="/?episodeIndex=${nextEpisodeIndex}">Next</a>
	</div>
  `;

	const html = `
	<html>
	  <head>
		<title>Podcast Player</title>
	  </head>
	  <body>
		${episodeHtml}
		${navigationHtml}
	  </body>
	</html>
  `;

	res.send(html);
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
