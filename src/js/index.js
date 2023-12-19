import { gameTitles, gameInit } from '../config.js';
import { SIZES } from '../styles/variable.js';
const { Engine, Render, Runner, Composite, Mouse, MouseConstraint, Events } =
  Matter;

const STATUS = {
  MENU: 0,
  GAME: 1,
  END: 2,
};

const COMMON = {
  width: SIZES.width,
  height: SIZES.height,
  title: null,
  status: STATUS.MENU,
  elements: {
    display: document.getElementById('game-display'),
    ui: document.getElementById('game-ui'),
    startingScreen: document.getElementById('game-starting-screen'),
    endContainer: document.getElementById('game-end-container'),
    gameTitleOptions: document.getElementById('game-title-options'),
    startButton: document.getElementById('button-start'),
    restartButton: document.getElementById('button-restart'),
  },
};

const engine = Engine.create();
const runner = Runner.create();
const render = Render.create({
  engine,
  element: COMMON.elements.display,
  options: {
    width: COMMON.width,
    height: COMMON.height,
    wireframes: false,
  },
});

// 마우스 설정
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.1,
  },
});

render.mouse = mouse;

// 마우스 이동 or 터치 이동
Events.on(mouseConstraint, 'mousemove', (e) => {
  gameInit[COMMON.title].mouse.move(e);
});

// 마우스 클릭 or 터치 후
Events.on(mouseConstraint, 'mouseup', (e) => {
  gameInit[COMMON.title].mouse.up(e, engine);
});

// 충돌시
Events.on(engine, 'collisionStart', (e) => {
  gameInit[COMMON.title].collisionStart(e, engine);
});

// 시작, 종료, 재시작
COMMON.elements.restartButton.addEventListener('click', (event) => {
  event.preventDefault();
  restart();
});

const restart = () => {
  Composite.clear(engine.world);
  Engine.clear(engine);
  Render.stop(render);
  Runner.stop(runner);
  COMMON.status = STATUS.GAME;
  startGame();
};

const startGame = () => {
  if (COMMON.status !== STATUS.GAME) return;
  if (!COMMON.title) return;

  COMMON.elements.endContainer.style.display = 'none';
  COMMON.elements.startingScreen.style.display = 'none';
  gameInit[COMMON.title].start(engine, render);
  Render.run(render);
  Runner.run(runner, engine);
};

// 게임 선택
const getTitle = (event) => {
  const gameTitle = event.target.value;
  COMMON.title = gameTitle;
};

gameTitles.map((title, i) => {
  const titleOption = document.createElement('div');
  const titleInput = document.createElement('input');
  const titleLabel = document.createElement('label');

  titleOption.classList.add('game-title-option');
  titleInput.setAttribute('type', 'radio');
  titleInput.setAttribute('name', 'game');
  titleInput.setAttribute('id', title.id);
  titleInput.setAttribute('value', title.id);
  titleLabel.textContent = title.title;
  titleLabel.setAttribute('for', title.id);
  if (i === 0) {
    titleInput.setAttribute('checked', 'checked');
    COMMON.title = title.id;
  }

  titleOption.appendChild(titleInput);
  titleOption.appendChild(titleLabel);

  COMMON.elements.gameTitleOptions.appendChild(titleOption);
});

const radios = document.querySelectorAll('input[type=radio][name=game]');

radios.forEach((radio) => {
  radio.addEventListener('change', getTitle);
});

COMMON.elements.startButton.addEventListener('click', (event) => {
  event.preventDefault();
  COMMON.status = STATUS.GAME;
  startGame();
});

// 리사이즈
const resize = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  let gameWidth;
  let gameHeight;
  let scale;
  if (screenWidth * 1.5 > screenHeight) {
    gameHeight = screenHeight;
    gameWidth = screenHeight / 1.5;
    scale = gameHeight / COMMON.height;
  } else {
    gameWidth = screenWidth;
    gameHeight = screenWidth * 1.5;
    scale = gameWidth / COMMON.width;
  }

  render.canvas.style.width = `${gameWidth}px`;
  render.canvas.style.height = `${gameHeight}px`;
  COMMON.elements.ui.style.width = `${COMMON.width}px`;
  COMMON.elements.ui.style.height = `${COMMON.height}px`;
  COMMON.elements.ui.style.transform = `scale(${scale})`;
};

document.body.onload = resize;
document.body.onresize = resize;
