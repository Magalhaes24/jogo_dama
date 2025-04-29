const clientId = "e1141482037c4c08a0d9670a936a0a9d";
const clientSecret = "9862fc5d083d42af8c3035035b55cb57";

const spotifyEmbed = document.getElementById("spotify-embed");
const guessInput = document.getElementById("guessInput");
const submitGuess = document.getElementById("submitGuess");
const guessResult = document.getElementById("guessResult");
const scoreDisplay = document.getElementById("score");
const attemptsDisplay = document.getElementById("attempts");
const nextBtn = document.getElementById("next");
const listenBtn = document.getElementById("listen");
const songNameDisplay = document.getElementById("song-name");

const choosePlaylistContainer = document.getElementById("choosePlaylistContainer");
const playlistInput = document.getElementById("playlistInput");
const confirmPlaylistBtn = document.getElementById("confirmPlaylist");

let playlistTracks = [];
let playlistUrl = "";
let currentSongIndex = 0;
let guessedCorrectly = false;
let score = 0;
let attempts = 0;
const maxAttempts = 3;
let readyForNextSong = false;
let playStage = 0; // 0 = 1s, 1 = 5s, 2 = 10s

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const an = a.length, bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => []);
  for (let i = 0; i <= bn; i++) matrix[i][0] = i;
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,
        matrix[i][j-1] + 1,
        matrix[i-1][j-1] + cost
      );
    }
  }
  return matrix[bn][an];
}

function similarity(a, b) {
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function updateScore(points) {
  score += points;
  scoreDisplay.textContent = `Score: ${score}`;
}

function updateAttempts() {
  attemptsDisplay.textContent = `❌ Tentativas: ${attempts} / ${maxAttempts}`;
}

function showAnswer(success) {
  const track = playlistTracks[currentSongIndex];
  songNameDisplay.textContent = `🎶 Era: ${track.name} - ${track.artists}`;
  songNameDisplay.classList.remove("hidden");
  spotifyEmbed.style.visibility = "visible";

  guessResult.textContent = success ? '✅ Correcto!' : '❌ Falhaste!';
  guessResult.style.color = success ? 'lightgreen' : 'tomato';
  readyForNextSong = true;
  submitGuess.disabled = true;
  nextBtn.textContent = "⏭️ Próxima Música";
}

function loadSong(index) {
  if (index >= playlistTracks.length) {
    alert(`🎉 Jogo terminado! Pontuação final: ${score}`);
    return;
  }

  const track = playlistTracks[index];
  spotifyEmbed.src = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;
  spotifyEmbed.style.visibility = "hidden";

  guessInput.value = "";
  guessResult.textContent = "";
  songNameDisplay.classList.add("hidden");
  attempts = 0;
  guessedCorrectly = false;
  readyForNextSong = false;
  playStage = 0;
  submitGuess.disabled = false;
  nextBtn.textContent = "⏭️ Avançar";
  updateListenButton();
  updateAttempts();
}

function updateListenButton() {
  if (playStage === 0) {
    listenBtn.textContent = "🔊 Ouvir 1s";
  } else if (playStage === 1) {
    listenBtn.textContent = "🔊 Ouvir 5s";
  } else if (playStage === 2) {
    listenBtn.textContent = "🔊 Ouvir 10s";
  }
}

submitGuess.onclick = () => {
  const userGuess = normalize(guessInput.value.trim());
  const correct = normalize(playlistTracks[currentSongIndex].name);
  const sim = similarity(userGuess, correct);

  if (sim > 0.75) {
    if (!guessedCorrectly) {
      if (playStage === 0) updateScore(10);
      else if (playStage === 1) updateScore(3);
      else updateScore(1);
    }
    guessedCorrectly = true;
    showAnswer(true);
  } else {
    attempts++;
    updateAttempts();
    if (attempts >= maxAttempts) {
      showAnswer(false);
    } else {
      guessResult.textContent = '❌ Tenta outra vez!';
      guessResult.style.color = 'tomato';
    }
  }
};

listenBtn.onclick = async () => {
  if (readyForNextSong) return;

  if (playStage === 0) {
    await playPreview(1000);
  } else if (playStage === 1) {
    await playPreview(5000);
  } else if (playStage === 2) {
    await playPreview(10000);
  }
};

nextBtn.onclick = () => {
  if (readyForNextSong) {
    currentSongIndex++;
    loadSong(currentSongIndex);
    return;
  }

  if (playStage === 0) {
    playStage = 1;
    updateListenButton();
  } else if (playStage === 1) {
    playStage = 2;
    updateListenButton();
  } else if (playStage === 2) {
    showAnswer(false);
  }
};

async function playPreview(durationMs) {
  const iframe = document.getElementById("spotify-embed");
  const track = playlistTracks[currentSongIndex];

  iframe.src = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;

  // Do not make visible, only sound
  await new Promise(resolve => setTimeout(resolve, durationMs));

  iframe.src = '';
}

async function getAccessToken() {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  return data.access_token;
}

function extractPlaylistId(url) {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function fetchTracks(token, playlistId) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.items
    .filter(item => item.track && item.track.id)
    .map(item => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map(a => a.name).join(", ")
    }));
}

window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  const startBtn = document.getElementById("startGame");
  const gameContainer = document.getElementById("gameContainer");

  startBtn.addEventListener("click", () => {
    popup.style.display = "none";
    choosePlaylistContainer.classList.remove("hidden");
  });

  confirmPlaylistBtn.addEventListener("click", async () => {
    const inputUrl = playlistInput.value.trim();
    if (!inputUrl.includes("playlist/")) {
      alert("Por favor insere um link de playlist válido do Spotify!");
      return;
    }
    playlistUrl = inputUrl;

    choosePlaylistContainer.style.display = "none";
    gameContainer.classList.remove("hidden");

    const token = await getAccessToken();
    const playlistId = extractPlaylistId(playlistUrl);
    playlistTracks = await fetchTracks(token, playlistId);

    playlistTracks = playlistTracks.sort(() => Math.random() - 0.5);

    console.log("🎧 Ordem das músicas para adivinhar:");
    playlistTracks.forEach((track, index) => {
      console.log(`${index + 1}. ${track.name} - ${track.artists}`);
    });

    loadSong(currentSongIndex);
  });
});
