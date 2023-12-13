import BURGER from './burger.js';
import { COLORS, SIZES } from '../styles/variable.js';
const { Engine, Render, Runner, Composite, Bodies } = Matter;

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

// 직사각형으로 벽 만들기
// Matter.Bodies.rectangle(x, y, width, height, [options])
const wallThickness = SIZES.wallThickness;
const scoreHeight = SIZES.scoreHeight;
const wallOptions = {
  isStatic: true,
  render: { fillStyle: COLORS.gameStatic },
};

const wallStatics = [
  // ScoreLine
  Bodies.rectangle(GAME.width / 2, scoreHeight, GAME.width, 1, {
    isStatic: true,
    isSensor: true,
  }),
  //Left
  Bodies.rectangle(
    wallThickness / 2,
    GAME.height / 2,
    wallThickness,
    GAME.height,
    wallOptions,
  ),
  // Right
  Bodies.rectangle(
    GAME.width - wallThickness / 2,
    GAME.height / 2,
    wallThickness,
    GAME.height,
    wallOptions,
  ),
  // Bottom
  Bodies.rectangle(
    GAME.width / 2,
    GAME.height - wallThickness,
    GAME.width,
    wallThickness * 2,
    wallOptions,
  ),
];

Composite.add(engine.world, wallStatics);

// 게임 요소 생성
const newIngredient = () => {
  const index = Math.floor(Math.random() * 4);
  const ingredient = BURGER[index];
  const scale = (ingredient.radius * 2) / 1000;

  //Matter.Bodies.circle(x, y, radius, [options], [maxSides])
  const body = Bodies.circle(
    GAME.width / 2,
    scoreHeight - ingredient.radius,
    ingredient.radius,
    {
      render: {
        sprite: { texture: ingredient.img, xScale: scale, yScale: scale },
      },
      restitution: 0.3,
    },
  );

  Composite.add(engine.world, body);
};

newIngredient();

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
