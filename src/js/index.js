import BURGER from './burger.js';
import { COLORS, SIZES } from '../styles/variable.js';
const { Engine,  Render,  Runner,  Composite,  Bodies,  Mouse,  MouseConstraint,  Events } = Matter;

const STATUS = {
  READY: 1,
  DROP: 2,
};

export const GAME = {
  width: 600,
  height: 900,
  status: STATUS.READY,
  score: 0,
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

let readyItem = null;
let currentIndex = null;

// 아이템 생성
const newIngredient = (x, isReady = true, latestIndex) => {
  const index =
    GAME.score === 0
      ? 0
      : latestIndex !== undefined
      ? latestIndex
      : Math.floor(Math.random() * 4);

  currentIndex = index;

  const ingredient = BURGER[index];
  const scale = (ingredient.radius * 2) / 1000;

  //Matter.Bodies.circle(x, y, radius, [options], [maxSides])
  const body = Bodies.circle(
    x,
    scoreHeight - ingredient.radius,
    ingredient.radius,
    {
      isSleeping: isReady,
      isStatic: isReady,
      render: {
        sprite: { texture: ingredient.img, xScale: scale, yScale: scale },
      },
      restitution: 0.3,
    },
  );

  return body;
};

// 아이템 drop
const dropItem = (x) => {
  if (GAME.status !== STATUS.READY) return;

  GAME.status = STATUS.DROP;

  // readyItem과 같은 모양의 droppedItem을 만들어 떨어뜨린 후 기존 readyItem 삭제
  const droppedItem = newIngredient(x, false, currentIndex);
  Composite.add(engine.world, droppedItem);
  GAME.score += BURGER[currentIndex].score;
  Composite.remove(engine.world, readyItem);

  // 새로운 readyItem 할당 후 0.5초 후 표시
  readyItem = newIngredient(x);
  setTimeout(() => {
    if (GAME.status === STATUS.DROP) {
      Composite.add(engine.world, readyItem);
      GAME.status = STATUS.READY;
    }
  }, 500);
};

const startGame = () => {
  if (GAME.score > 0) return;
  readyItem = newIngredient(GAME.width / 2);
  Composite.add(engine.world, readyItem);
};

startGame();

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
  readyItem.position.x = e.mouse.position.x;
});

// 마우스 클릭 or 터치 후 drop
Events.on(mouseConstraint, 'mouseup', (e) => {
  dropItem(e.mouse.position.x);
});

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
