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
  flag: 0,
  combo: 5,
  elements: {
    display: document.getElementById('game-display'),
    ui: document.getElementById('game-combo-ui'),
    valueScore: document.getElementById('value-score'),
    valueCombo: document.getElementById('value-combo'),
    valueRecord: document.getElementById('value-record'),
  },
};

const lastIndex = BURGER.length - 1;

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

// 터지는 효과
const popEffect = (bodies) => {
  const pops = bodies.map((body) => {
    const { position, index } = body;
    const radius = BURGER[index].radius;
    return Bodies.circle(position.x, position.y, radius, {
      isStatic: true,
      render: {
        sprite: {
          texture: '/assets/burger/pop1.png',
          xScale: (radius * 2) / 1000,
          yScale: (radius * 2) / 1000,
        },
      },
    });
  });
  Composite.add(engine.world, pops);
  setTimeout(() => {
    Composite.remove(engine.world, pops);
  }, 100);
};

// 콤보 알림 요소
const noticeCombo = Bodies.rectangle(GAME.width / 2, GAME.height / 2, 500, 500, {
  name: 'notice',
  isSensor: true,
  isStatic: true,
  render: {
    sprite: {
      xScale: 0.3,
      yScale: 0.3,
      texture: '/assets/burger/notice-combo.png',
    },
  },
});

const comboItem = Bodies.circle(GAME.width / 2, SIZES.scoreHeight / 2, 45, {
  name: 'combo',
  render: {
    sprite: {
      texture: '/assets/burger/combo.png',
      xScale: 90 / 1000,
      yScale: 90 / 1000,
    },
  },
});

const checkCombo = () => {
  if (GAME.flag !== 1) return;

  const all = Composite.allBodies(engine.world).filter(
    (body) => body.isStatic !== true && body.index > lastIndex - 3,
  );

  const burger = all.find((item) => item.index === lastIndex);
  const fries = all.find((item) => item.index === lastIndex - 1);
  const coke = all.find((item) => item.index === lastIndex - 2);

  if (burger && fries && coke) {
    GAME.status = STATUS.PAUSE;
    const combo = [burger, fries, coke];

    GAME.combo -= 1;
    GAME.score += 100;
    Composite.add(engine.world, noticeCombo);

    setTimeout(() => {
      Composite.remove(engine.world, noticeCombo);
    }, 1000);

    // 기존 콤보 아이템 처리
    setTimeout(() => {
      popEffect(combo);
      Composite.add(engine.world, comboItem);
      Composite.remove(engine.world, combo);
    }, 500);

    if (GAME.combo === 0) {
      endGame();
    } else {
      setTimeout(() => {
        const isLast = Composite.allBodies(engine.world).filter(
          (body) => body.isStatic !== true && body.index === lastIndex,
        );
        GAME.flag = isLast.length > 0 ? 1 : 0;
        GAME.status = STATUS.READY;
      }, 1800);
    }
  }
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
  GAME.score += BURGER[currentIndex].point / 2;
  displayScore();
  Composite.remove(engine.world, readyItem);

  // 새로운 readyItem 할당 후 0.5초 후 표시
  readyItem = newIngredient({ x });
  currentIndex = readyItem.index;
  setTimeout(() => {
    if (GAME.status === STATUS.DROP || GAME.status === STATUS.PAUSE) {
      Composite.add(engine.world, readyItem);
      if (GAME.status === STATUS.DROP) {
        GAME.status = STATUS.READY;
      }
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
  if (GAME.status === STATUS.READY) {
    dropItem(e.mouse.position.x);
  }
});

// 충돌시
Events.on(engine, 'collisionStart', (e) => {
  if (GAME.status === STATUS.PAUSE) return;

  e.pairs.forEach((collision) => {
    const { bodyA, bodyB } = collision;
    // static, 마지막 아이템 충돌은 제외
    if (bodyA.isStatic || bodyA.name || bodyB.isStatic || bodyB.name) return;
    if (bodyA.index === lastIndex || bodyB.index === lastIndex) return;

    // 종료 조건
    const aHeight = bodyA.position.y + BURGER[bodyA.index].radius;
    const bHeight = bodyB.position.y + BURGER[bodyB.index].radius;

    // 에러처리
    const side =
      bodyA.position.y < scoreHeight && bodyB.position.y < scoreHeight;

    // 게임종료
    if (aHeight < scoreHeight || bHeight < scoreHeight) {
      if (!side) {
        endGame();
      }
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

      // combo 확인하도록 조건 생성
      if (newIndex === lastIndex) {
        GAME.flag = 1;
      }
      checkCombo();
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
