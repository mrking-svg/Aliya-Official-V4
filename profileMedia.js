'use strict';

// Shared profile-picture source for pfp.js and every pair command.
// Uses the same stalk API as pfp.js; callers decide how to render the images.

const axios = require('axios');

const API_URL = 'https://stalk-six.vercel.app/api/stalk';

function imageUrls(profile) {
	if (!profile || typeof profile !== 'object') return [];
	const urls = [profile.profilePictureUrl, profile.coverPhotoUrl]
		.filter((url, i, all) => Boolean(url && String(url).trim()) && all.indexOf(url) === i);
	return urls;
}

async function getProfile(query) {
	const response = await axios.get(API_URL, {
		params: { userId: String(query) },
		timeout: 15000
	});
	const profile = response.data && response.data.data;
	return profile && typeof profile === 'object' ? profile : null;
}

async function getImageUrls(query) {
	return imageUrls(await getProfile(query));
}

async function getImages(profile) {
	const results = await Promise.all(
		imageUrls(profile).map(url =>
			axios.get(url, { responseType: 'stream', timeout: 10000 })
				.then(response => response.data)
				.catch(() => null)
		)
	);
	return results.filter(Boolean);
}

module.exports = { API_URL, imageUrls, getProfile, getImageUrls, getImages };
