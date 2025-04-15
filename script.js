
// Mostrar o jogo após clicar em "Compreendi"
window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('popup');
  const gameContainer = document.getElementById('gameContainer');
  const startBtn = document.getElementById('startGame');

  startBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    gameContainer.classList.remove('hidden');
  });
});

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const nextBtn = document.getElementById('next');
const songNameDisplay = document.getElementById('song-name');
const guessInput = document.getElementById('guessInput');
const submitGuess = document.getElementById('submitGuess');
const guessResult = document.getElementById('guessResult');
const scoreDisplay = document.getElementById('score');
const attemptsDisplay = document.getElementById('attempts');

// Lista de músicas
const songList = [
  { path: 'songs/D.A.M.A - Agora é Tarde (Official Lyric Video).mp3', answer: 'Agora é Tarde' },
  { path: 'songs/D.A.M.A - Às Vezes (Official Lyric Video).mp3', answer: 'Às Vezes' },
  { path: 'songs/D.A.M.A - Casa feat Buba Espinho.mp3', answer: 'Casa' },
  { path: 'songs/D.A.M.A - Era Eu.mp3', answer: 'Era Eu' },
  { path: 'songs/D.A.M.A - Luísa.mp3', answer: 'Luísa' },
  { path: 'songs/D.A.M.A - Mentiras.mp3', answer: 'Mentiras' },
  { path: 'songs/D.A.M.A - Na Na Na (Official Lyric Video).mp3', answer: 'Na Na Na' },
  { path: 'songs/D.A.M.A - Não Dá (Official Lyric Video).mp3', answer: 'Não Dá' },
  { path: 'songs/D.A.M.A - Não Faço Questão ft. Gabriel O Pensador (Official Lyric Video).mp3', answer: 'Não Faço Questão' },
  { path: 'songs/D.A.M.A - Secrets in Silence ft. Mia Rose.mp3', answer: 'Secrets in Silence' },
  { path: 'songs/D.A.M.A - Sente a Minha Magia.mp3', answer: 'Sente a Minha Magia' },
  { path: 'songs/D.A.M.A - Tempo pra Quê ft. Player (Official Lyric Video).mp3', answer: 'Tempo pra Quê' },
  { path: 'songs/D.A.M.A - Balada do Desajeitado feat. Salvador Seixas.mp3', answer: 'Balada do Desajeitado' },
  { path: 'songs/D.A.M.A - Popless.mp3', answer: 'Popless' },
  { path: 'songs/D.A.M.A - Quer.mp3', answer: 'Quer' },
  { path: 'songs/D.A.M.A - JNQF.mp3', answer: 'JNQF' },
  { path: 'songs/D.A.M.A - O Maior (Official Lyric Video).mp3', answer: 'O Maior' },
];

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const shuffledList = shuffleArray(songList);

let currentSongIndex = 0;
let stage = 1; // 1: 2s, 2: 10s, 3: 30s
let guessedCorrectly = false;
let score = 0;
let attempts = 0;
const maxAttempts = 3;
let readyForNextSong = false;

function loadSong(index) {
  if (index >= shuffledList.length) {
    alert("🎉 Game over! Final Score: " + score);
    nextBtn.disabled = true;
    playBtn.disabled = true;
    submitGuess.disabled = true;
    return;
  }

  audio.src = shuffledList[index].path;
  stage = 1;
  guessedCorrectly = false;
  attempts = 0;
  readyForNextSong = false;

  updatePlayButton();

  guessInput.value = '';
  guessResult.textContent = '';
  songNameDisplay.classList.add('hidden');
  nextBtn.textContent = 'Next';
  playBtn.disabled = false;
  submitGuess.disabled = false;
  updateAttemptsDisplay();
}

function updateAttemptsDisplay() {
  attemptsDisplay.textContent = `❌ Attempts: ${attempts} / ${maxAttempts}`;
}

function playClip(seconds) {
  audio.currentTime = 0;
  audio.play();
  setTimeout(() => {
    audio.pause();
  }, seconds * 1000);
}

function updatePlayButton() {
  if (stage === 1) {
    playBtn.textContent = 'Play 2s';
    playBtn.classList.remove('hidden');
  } else if (stage === 2) {
    playBtn.textContent = 'Play 10s';
    playBtn.classList.remove('hidden');
  } else if (stage === 3) {
    playBtn.textContent = 'Play 30s';
    playBtn.classList.remove('hidden');
  } else {
    playBtn.classList.add('hidden');
  }
}

playBtn.onclick = () => {
  if (stage === 1) playClip(2);
  if (stage === 2) playClip(10);
  if (stage === 3) playClip(30);
};

nextBtn.onclick = () => {
  if (!guessedCorrectly && !readyForNextSong) {
    // Avança de fase (2s → 10s → 30s)
    if (stage < 3) {
      stage++;
      updatePlayButton();
      nextBtn.textContent = stage === 3 ? 'Show Answer' : 'Next';
    } else {
      // Mostra solução se já está no 30s
      showAnswer(false);
    }
  } else {
    // Carrega a próxima música
    currentSongIndex++;
    loadSong(currentSongIndex);
  }
};

function similarity(a, b) {
  const clean = s => s.toLowerCase().replace(/[^a-z0-9]/gi, '');
  a = clean(a);
  b = clean(b);
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

function updateScore(points) {
  score += points;
  scoreDisplay.textContent = `Score: ${score}`;
}

function showAnswer(success) {
  const fullAnswer = shuffledList[currentSongIndex].answer;
  songNameDisplay.textContent = `🎶 It was: ${fullAnswer}`;
  songNameDisplay.classList.remove('hidden');
  nextBtn.textContent = 'Next Song';
  playBtn.classList.add('hidden');
  submitGuess.disabled = true;
  readyForNextSong = true;

  if (!success) {
    guessResult.textContent = '❌ You lost this round!';
    guessResult.style.color = 'tomato';
  }
}

submitGuess.onclick = () => {
  const userGuess = guessInput.value.trim();
  const fullAnswer = shuffledList[currentSongIndex].answer;

  const featSplit = fullAnswer.split(/ft\.|feat\./i);
  const mainTitle = featSplit[0].trim();
  const featuredPart = featSplit[1] ? featSplit[1].trim() : null;

  const normalize = s => s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '');

  const sim = similarity(normalize(userGuess), normalize(mainTitle));

  if (sim > 0.6) {
    if (!guessedCorrectly) {
      let points = 0;
      if (stage === 1) points = 10;
      else if (stage === 2) points = 3;
      else if (stage === 3) points = 1;

      if (featuredPart) {
        const includesFeat = normalize(userGuess).includes(normalize(featuredPart));
        if (includesFeat) {
          points += 1;
        }
      }

      updateScore(points);
    }

    guessResult.textContent = '✅ Correct!';
    guessResult.style.color = 'lightgreen';
    guessedCorrectly = true;

    showAnswer(true);
  } else {
    attempts++;
    updateAttemptsDisplay();

    if (attempts >= maxAttempts) {
      showAnswer(false);
    } else {
      guessResult.textContent = '❌ Try again!';
      guessResult.style.color = 'tomato';
    }
  }
};

loadSong(currentSongIndex);
