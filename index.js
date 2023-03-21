const express = require('express');
const Parser = require('rss-parser');

const app = express();
const port = 3000;

//const FEEDS = ['https://rss.art19.com/morbid-a-true-crime-podcast', 'https://rss.art19.com/erm-mfm', 'https://rss.art19.com/48-hours', 'https://rss.art19.com/somethingwaswrong', 'https://rss.art19.com/smalltownmurder', 'https://rss.art19.com/this-is-actually-happening-podcast', 'https://rss.art19.com/stolen-hearts', 'https://rss.art19.com/american-scandal', 'https://rss.art19.com/the-vanished-podcast-wondery', 'https://rss.art19.com/generation-why-podcast', 'https://rss.art19.com/scamfluencers', 'https://rss.art19.com/scamfluencers', 'https://rss.art19.com/true-crime-all-the-time', 'https://rss.art19.com/killer-psyche'];

const FEEDS = ['https://atp.fm/rss', 'https://feeds.megaphone.fm/darknetdiaries', 'https://feeds.simplecast.com/1_9aBk7M', 'https://daringfireball.net/thetalkshow/rss', 'https://feeds.redcircle.com/92bf9085-a91e-49f6-81b8-5b651b52ba3f?_ga=2.40878434.1504349826.1678823285-1290121214.1678823285', 'https://feed.podbean.com/geekanddestroy/feed.xml', 'https://podcast.panic.com/index.xml', 'https://rss.art19.com/business-movers'];

const CACHE_TTL = 60 * 60 * 1000; // cache feed data for 1 hour
let cache = {
	timestamp: 0,
	data: [],
};

async function getLatestEpisodes(feeds) {
	const parser = new Parser();
	const latestEpisodes = [];

	for (const feed of feeds) {
		const feedData = await parser.parseURL(feed);
		const episodes = feedData.items.slice(0, 10);
		latestEpisodes.push(...episodes);
	}

	// Randomize the episode list
	latestEpisodes.sort(() => Math.random() - 0.5);
	console.log(latestEpisodes);
	return latestEpisodes;
}

async function getCachedEpisodes() {
	const now = Date.now();
	if (cache.timestamp + CACHE_TTL > now) {
		return cache.data;
	}

	const latestEpisodes = await getLatestEpisodes(FEEDS);
	cache = {
		timestamp: now,
		data: latestEpisodes,
	};
	return latestEpisodes;
}

app.get('/', async (req, res) => {
	const latestEpisodes = await getCachedEpisodes();
	const episodeIndex = Math.floor(Math.random() * latestEpisodes.length);
	const currentEpisode = latestEpisodes[episodeIndex];

	const episodeHtml = `
    <div style='width:300px;margin:0 auto;border:3px solid #ddd;padding:10px;border-radius:8px;'>
      <h2>${currentEpisode.itunes.author}</h2>
      <h2><img src='${currentEpisode.itunes.image}' /style='width:300px;height:300px;'></h2>
      <h3>${currentEpisode.title}</h3>
      <audio src="${currentEpisode.enclosure.url}" preload="none" controls autoplay></audio>
	  <input type="range" id="progress-bar" min="0" max="100" value="0">
      <div id="countdown" style="font-size: 24px; margin-top: 20px;text-align:center;"></div>
    </div>
  `;

	const navigationHtml = `
	<div style='width:300px;margin:0 auto;text-align:center;margin-top:20px;margin-bottom:20px;border-radius:8px;'><button id='startFromBeginning'>Start episode from beginning</button></div>
	<div style='width:300px;margin:0 auto;text-align:center;margin-top:20px;margin-bottom:20px;border-radius:8px;'> 
			
			<button id="skipButton"><a href="/?episodeIndex=${episodeIndex}" id="previousButton">Previous</a></button>
			
			<button><a href="#" id="continuePlaying">Continue Playing</a></button>

			<button id="skipButton"><a href="/?episodeIndex=${episodeIndex}" id="nextButton">Next</a></button>
			</div>
		</div>
	`;

	const html = `
			<html>
			   <head>
				  <title>Podcast Player</title>
				  <style>
					 /* Hide the original progress bar */
					 audio::-webkit-media-controls-timeline {
					 display: none !important;
					 }
					 #progress-bar {
					 margin-top:30px;
					 width:100%;
					 }
				  </style>
			   </head>
			   <body>
				  <a href='http://localhost:3000/'>Home</a>	
				  ${episodeHtml}
				  ${navigationHtml}
			   </body>
			   <script>
				let skipTimer = null;
				const audio = document.querySelector('audio');
				const previousButton = document.querySelector('#previousButton');
				const continuePlayingButton = document.querySelector('#continuePlaying');
				const nextButton = document.querySelector('#nextButton');
				const countdownElement = document.querySelector('#countdown');
				const startFromBeginning = document.querySelector('#startFromBeginning');
				const progressBar = document.getElementById('progress-bar');
				let isDragging = false;
				const startTimer = () => {
					let remainingTime = 15;
				
					countdownElement.textContent = remainingTime;
				
					skipTimer = setInterval(() => {
						remainingTime--;
						if (remainingTime >= 0) {
							countdownElement.textContent = remainingTime;
						}
						if (remainingTime === 0) {
							clearInterval(skipTimer);
							window.location.href = nextButton.href;
						}
					}, 1000);
				};
				
				const resetTimer = () => {
					clearInterval(skipTimer);
					startTimer();
				};
				
				audio.addEventListener('loadedmetadata', () => {
					const startTime = Math.floor(Math.random() * audio.duration);
					audio.currentTime = startTime;
					audio.play();
					startTimer();
				});
				
				audio.addEventListener('pause', () => {
					clearInterval(skipTimer);
				});
				
				audio.addEventListener('play', () => {
					resetTimer();
				});
				
				audio.addEventListener('timeupdate', () => {
					if (!isDragging) {
						const currentTime = audio.currentTime;
						const duration = audio.duration;
						const progress = (currentTime / duration) * 100;
						progressBar.value = progress;
					}
				});
				
				progressBar.addEventListener('input', () => {
					isDragging = true;
					clearInterval(skipTimer);
				});
				
				progressBar.addEventListener('change', () => {
					isDragging = false;
					const progress = progressBar.value;
					const duration = audio.duration;
					const currentTime = (progress / 100) * duration;
					audio.currentTime = currentTime;
				});
				
				startFromBeginning.addEventListener('click', () => {
					clearInterval(skipTimer);
					audio.currentTime = 0;
					audio.play();
				});
				
				continuePlayingButton.addEventListener('click', event => {
					event.preventDefault();
					clearInterval(skipTimer);
					countdownElement.style.display = 'none';
				});
				
				nextButton.addEventListener('click', () => {
					resetTimer();
				});
				
				previousButton.addEventListener('click', () => {
					resetTimer();
				});

			   </script>
			</html>
				;`;

	res.send(html);
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
