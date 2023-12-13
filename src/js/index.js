import { COLORS, SIZES } from '../styles/variable.js';
const { Engine, Render, Runner } = Matter;

export const GAME = {
  width: 600,
  height: 900,
};

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.getElementById('game-display'),
  options: {
    width: GAME.width,
    height: GAME.height,
    wireframes: false,
    background: COLORS.gameBack,
  },
});

Render.run(render);
Runner.run(engine);

const resize = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - SIZES.menuHeight;

  let gameWidth;
  let gameHeight;
  if (screenWidth * 1.5 > screenHeight) {
    gameHeight = screenHeight;
    gameWidth = screenHeight / 1.5;
  } else {
    gameWidth = screenWidth;
    gameHeight = screenWidth * 1.5;
  }
  render.canvas.style.width = `${gameWidth}px`;
  render.canvas.style.height = `${gameHeight}px`;
};

document.body.onload = resize;
document.body.onresize = resize;


// 게임 선택
const loadGame = (event) => {
  const gameTitle = event.target.value;
};

document.querySelector('select').addEventListener('change', loadGame);
