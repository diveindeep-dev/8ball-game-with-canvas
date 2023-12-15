import BURGER from './burger.js';
import { COLORS, SIZES } from '../styles/variable.js';
const { Engine,  Render,  Runner,  Composite,  Bodies,  Mouse,  MouseConstraint,  Events } = Matter;

const STATUS = {
  READY: 1,
  DROP: 2,
  PAUSE: 3,
  END: 4,
};

export const GAME = {
  width: 600,
  height: 900,
  status: STATUS.READY,
  score: 0,
  record: 0,
  combo: 5,
  elements: {
    display: document.getElementById('game-display'),
    ui: document.getElementById('game-combo-ui'),
    valueScore: document.getElementById('value-score'),
    valueCombo: document.getElementById('value-combo'),
    valueRecord: document.getElementById('value-record'),
  },
};

const engine = Engine.create();
const render = Render.create({
  engine,
  element: GAME.elements.display,
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
    GAME.height - wallThickness * 2,
    GAME.width,
    wallThickness * 4,
    wallOptions,
  ),
];

Composite.add(engine.world, wallStatics);

const displayScore = () => {
  GAME.elements.valueScore.innerText = GAME.score;
  GAME.elements.valueCombo.innerText = GAME.combo;
};

const displayRecord = () => {
  GAME.elements.valueRecord.innerText = GAME.record;
};

const getRecord = () => {
  const stored = localStorage.getItem('8ball-combo');
  if (stored) {
    GAME.record = JSON.parse(stored);
  } else {
    GAME.record = 0;
  }
};

const saveRecord = () => {
  if (GAME.status !== STATUS.END) return;

  if (GAME.score > GAME.record) {
    GAME.record = GAME.score;
    localStorage.setItem('8ball-combo', JSON.stringify(GAME.record));
  }
  displayRecord();
};

const endGame = () => {
  GAME.status = STATUS.END;
  saveRecord();
};

let readyItem = null;
let currentIndex = null;

// 아이템 생성
const newIngredient = (position, fixedIndex, option) => {
  const index =
    GAME.score === 0
      ? 0
      : fixedIndex !== undefined
      ? fixedIndex
      : Math.floor(Math.random() * 4);

  const ingredient = BURGER[index];
  const scale = (ingredient.radius * 2) / 1000;
  const positionY =
    position.y !== undefined
      ? position.y
      : scoreHeight - ingredient.radius * 1.5;
  const options = option || { isSleeping: true, isStatic: true };

  //Matter.Bodies.circle(x, y, radius, [options], [maxSides])
  const body = Bodies.circle(position.x, positionY, ingredient.radius, {
    index: index,
    render: {
      sprite: { texture: ingredient.img, xScale: scale, yScale: scale },
    },
    restitution: 0.3,
    ...options,
  });

  return body;
};

// 아이템 drop
const dropItem = (x) => {
  if (GAME.status !== STATUS.READY) return;

  GAME.status = STATUS.DROP;

  // readyItem과 같은 모양의 droppedItem을 만들어 떨어뜨린 후 기존 readyItem 삭제
  const droppedItem = newIngredient({ x }, currentIndex, {
    isSleeping: false,
    isStatic: false,
  });
  Composite.add(engine.world, droppedItem);
  GAME.score += BURGER[currentIndex].point;
  displayScore();
  Composite.remove(engine.world, readyItem);

  // 새로운 readyItem 할당 후 0.5초 후 표시
  readyItem = newIngredient({ x });
  currentIndex = readyItem.index;
  setTimeout(() => {
    if (GAME.status === STATUS.DROP) {
      Composite.add(engine.world, readyItem);
      GAME.status = STATUS.READY;
    }
  }, 500);
};

const startGame = () => {
  if (GAME.score > 0) return;

  getRecord();
  displayRecord();
  displayScore();
  readyItem = newIngredient({ x: GAME.width / 2 });
  currentIndex = readyItem.index;
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
  const radius = BURGER[currentIndex].radius;
  const minX = radius + SIZES.wallThickness;
  const maxX = GAME.width - SIZES.wallThickness - radius;
  if (e.mouse.position.x < minX || e.mouse.position.x > maxX) return;

  readyItem.position.x = e.mouse.position.x;
});

// 마우스 클릭 or 터치 후 drop
Events.on(mouseConstraint, 'mouseup', (e) => {
  dropItem(e.mouse.position.x);
});

// 충돌시
Events.on(engine, 'collisionStart', (e) => {
  e.pairs.forEach((collision) => {
    const { bodyA, bodyB } = collision;
    // static, 마지막 아이템 충돌은 제외
    if (bodyA.isStatic || bodyB.isStatic) return;
    const lastIndex = BURGER.length - 1;
    if (bodyA.index === lastIndex || bodyB.index === lastIndex) return;

    // 종료 조건
    const aHeight = bodyA.position.y + BURGER[bodyA.index].radius;
    const bHeight = bodyB.position.y + BURGER[bodyB.index].radius;

    //게임종료
    if (aHeight < scoreHeight || bHeight < scoreHeight) {
      endGame();
    }

    if (GAME.status === STATUS.END) return;

    if (bodyA.index === bodyB.index) {
      // 충돌한 두개 삭제하고, 다음 인덱스 아이템을 충돌 위치에서 생성
      const newIndex = bodyA.index + 1;
      Composite.remove(engine.world, [bodyA, bodyB]);
      const nextItem = newIngredient(
        {
          x: collision.collision.supports[0].x,
          y: collision.collision.supports[0].y,
        },
        newIndex,
        {
          isSleeping: false,
          isStatic: false,
        },
      );
      Composite.add(engine.world, nextItem);
      GAME.score += BURGER[newIndex].point;
      displayScore();
    }
  });
});

const resize = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - SIZES.menuHeight;

  let gameWidth;
  let gameHeight;
  let scale;
  if (screenWidth * 1.5 > screenHeight) {
    gameHeight = screenHeight;
    gameWidth = screenHeight / 1.5;
    scale = gameHeight / GAME.height;
  } else {
    gameWidth = screenWidth;
    gameHeight = screenWidth * 1.5;
    scale = gameWidth / GAME.width;
  }

  render.canvas.style.width = `${gameWidth}px`;
  render.canvas.style.height = `${gameHeight}px`;
  GAME.elements.ui.style.width = `${GAME.width}px`;
  GAME.elements.ui.style.height = `${GAME.height}px`;
  GAME.elements.ui.style.transform = `scale(${scale})`;
};

document.body.onload = resize;
document.body.onresize = resize;


// 게임 선택
const loadGame = (event) => {
  const gameTitle = event.target.value;
};

document.querySelector('select').addEventListener('change', loadGame);
