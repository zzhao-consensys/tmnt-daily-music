const schedule = require('node-schedule');
const axios = require('axios');
const express = require('express');
const app = express();

const url = 'https://hooks.slack.com/services/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';
const hourlyUrl = 'https://hooks.slack.com/services/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';
const config = {
  headers: {
    'Content-Type': 'application/json',
  }
};
const proxy = 'http://116.199.115.79:80';

const getRandomSong = (hourly, callback) => {
  axios.get(`https://zhongwzhao.me:4000/top/playlist/highquality?cat=%E6%AC%A7%E7%BE%8E&proxy=${proxy}`)
    .then((res) => {
      const playlists = res.data.playlists;
      const playlist = playlists[Math.floor(Math.random() * playlists.length)];
      const playlistId = playlist.id;
      console.log(playlistId);
      axios.get(`https://zhongwzhao.me:4000/playlist/detail?id=${playlistId}&proxy=${proxy}`)
        .then((res) => {
          const tracks = res.data.playlist.tracks;
          const track = tracks[Math.floor(Math.random() * tracks.length)];
          const songId = track.id;
          const songName = track.name;
          const songArtists = track.ar.map(x => x.name).join(', ');
          console.log(songId);
          axios.get(`https://zhongwzhao.me:4000/lyric?id=${songId}&proxy=${proxy}`)
            .then((res) => {
              const re = /\[.*?\]/;
              if (!res.data.lrc) {
                return getRandomSong();
                return;
              }
              let lyrics = res.data.lrc.lyric.trim().split(re);
              lyrics = lyrics.map(x => x.trim());
              lyrics = lyrics.filter(x => x.length > 10);
              lyrics = lyrics.filter(x => x.indexOf('\n') < 0);
              if (lyrics.length === 0) {
                return getRandomSong();
              }
              console.log(lyrics);
              const lyric = lyrics[Math.floor(Math.random() * lyrics.length)].trim();
              const text = `\`${lyric}\` -- ${songArtists}, _${songName}_`
              console.log(text);
              if (callback) {
                callback({ text, mrkdwn: true });
                return;
              }
              if (hourly) {
                axios.post(hourlyUrl, { text, mrkdwn: true }, config);
              } else {
                axios.post(url, { text, mrkdwn: true }, config);
              }
            })
        })
    })
}

const job = schedule.scheduleJob('0 12 * * *', () => {
  console.log('It\'s time for a daily lyric~');
  getRandomSong(false);
});

const hourlyJob = schedule.scheduleJob('0 9-17 * * *', () => {
  console.log('It\'s time for a hourly lyric~');
  getRandomSong(true);
});

app.post('/lyric', (req, res) => {
  console.log(req);
  res.json({ text: 'Ok. Lyric incoming.' })
  // getRandomSong(false);
});

app.listen(9216, () => console.log('App listening on port 9216!'))
