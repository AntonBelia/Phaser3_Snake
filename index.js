// Об'єкт конфігурації для гри Phaser
let config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  backgroundColor: "#bfcc00",
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};
// Різноманітні змінні гри
let snake;
let food;
let cursors;
let score = 0;
let speedText;
let scoreText;
let speedometer;
let bestScore = localStorage.getItem("bestScore");
let bestScoreText;
let startButton;
let restartButton;
let gameOver;
// Константи для напрямків руху змійки
let UP = 0;
let DOWN = 1;
let LEFT = 2;
let RIGHT = 3;

const game = new Phaser.Game(config);
// Функція завантаження ресурсів гри
function preload() {
  this.load.image("food", "./assets/food.png");
  this.load.image("body", "./assets/body.png");
}
// Функція створення гри - ініціалізує ігрові елементи
function create() {
  // Визначення класу для (Food)
  const Food = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Food(scene, x, y) {
      Phaser.GameObjects.Image.call(this, scene); // Наслідуємо відображення ізображень у Phaser
		
      this.setTexture("food");
      this.setPosition(x * 16, y * 16);
      this.setOrigin(0);

      this.total = 0;

      this.eatEffect = {
        frequency: 523.25,
        attack: 0.05,
        decay: 0.2,
        type: "sine",
        volume: 3,
        pan: 0.8,
        pitchBend: 600,
        reverse: true,
        random: 100,
      };

      scene.children.add(this);
    },

    eat: function () {
      this.total += 1;
      scoreText.setText(`Score: ${this.total}`);
    },
  });

  // Визначення класу для змійки (Snake)
  const Snake = new Phaser.Class({
    initialize: function Snake(scene, x, y) {
      this.headPosition = new Phaser.Geom.Point(x, y);

      this.body = scene.add.group();

      this.head = this.body.create(x * 16, y * 16, "body");
      this.head.setOrigin(0);

      this.alive = true;

      this.speed = 100;
      this.speedometer = 10;

      this.moveTime = 0;

      this.tail = new Phaser.Geom.Point(x, y);

      this.heading = RIGHT;
      this.direction = RIGHT;

      this.deathEffect = {
        frequency: 16,
        decay: 1,
        type: "sawtooth",
        dissonance: 50,
      };
    },

    update: function (time) {
      if (time >= this.moveTime) {
        return this.move(time);
      }
    },

    faceLeft: function () {
      if (this.direction === UP || this.direction === DOWN) {
        this.heading = LEFT;
      }
    },

    faceRight: function () {
      if (this.direction === UP || this.direction === DOWN) {
        this.heading = RIGHT;
      }
    },

    faceUp: function () {
      if (this.direction === LEFT || this.direction === RIGHT) {
        this.heading = UP;
      }
    },

    faceDown: function () {
      if (this.direction === LEFT || this.direction === RIGHT) {
        this.heading = DOWN;
      }
    },

    move: function (time) {
      /**
       * Базуючись на властивості heading (це напрямок, у якому натиснула pgroup),
       * ми відповідно оновлюємо значення headPosition.
       * Виклик Math.wrap дозволяє змії обертатися навколо екрана, тому,
       * коли вона зникає з будь-якої сторони, вона знову з’являється на іншій.
       */
      switch (this.heading) {
        case LEFT:
          this.headPosition.x = Phaser.Math.Wrap(
            this.headPosition.x - 1,0,40);
          break;

        case RIGHT:
          this.headPosition.x = Phaser.Math.Wrap(
            this.headPosition.x + 1,0,40);
          break;

        case UP:
          this.headPosition.y = Phaser.Math.Wrap(
            this.headPosition.y - 1,0,30);
          break;

        case DOWN:
          this.headPosition.y = Phaser.Math.Wrap(
            this.headPosition.y + 1,0,30);
          break;
      }

      this.direction = this.heading;

      //  Оновіть сегменти тіла та помістіть останню координату в this.tail
      Phaser.Actions.ShiftPosition(
        this.body.getChildren(),
        this.headPosition.x * 16,
        this.headPosition.y * 16,
        1,
        this.tail
      );

      //  Перевірте, чи частина тіла має той самий х/у, що й голова
      //  Якщо роблять, то голова в тулуб наїхала

      const hitBody = Phaser.Actions.GetFirst(
        this.body.getChildren(),
        { x: this.head.x, y: this.head.y },
        1
      );

      if (hitBody) {
        console.log("dead");

        if (Number(bestScore) < scoreText.text.slice(-2)) {
          bestScore = scoreText.text.slice(-2);
          localStorage.setItem("bestScore", bestScore);
        }
        //  Game Over
        this.alive = false;

        return false;
      } else {
        //  Оновіть таймер, готовий до наступного руху
        this.moveTime = time + this.speed;

        return true;
      }
    },

    grow: function () {
      const newPart = this.body.create(this.tail.x, this.tail.y, "body");

      newPart.setOrigin(0);
    },

    collideWithFood: function (food) {
      if (this.head.x === food.x && this.head.y === food.y) {
        this.grow();

        food.eat();
        this.score += 1;

        //  За кожні 5 з’їдених продуктів ми будемо трохи збільшувати швидкість змії
        if (this.speed > 5 && food.total % 5 === 0) {
          this.speed -= 10;
          this.speedometer += 10;
          speedText.setText(`Speed: ${this.speedometer}`);
        }

        return true;
      } else {
        return false;
      }
    },

    updateGrid: function (grid) {
      //  Видаліть усі частини тіла зі списку дійсних позицій
      this.body.children.each(function (segment) {
        let bx = segment.x / 16;
        let by = segment.y / 16;

        grid[by][bx] = false;
      });

      return grid;
    },
  });

  // Створення нового екземпляра класу Food та Snake
  food = new Food(this, 3, 4);
  snake = new Snake(this, 8, 8);
  
  //  Створення елементи керування на клавіатурі
  cursors = this.input.keyboard.createCursorKeys();

  // Створення та відображення на екрані тексту з рахунком і швидкістю
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontFamily: "Arial",
    fontSize: 32,
    color: "#ffffff",
  });
  speedText = this.add.text(460, 16, "Speed: 10", {
    fontFamily: "Arial",
    fontSize: 32,
    color: "#ffffff",
  });
  bestScoreText = this.add.text(200, 16, `Best Score: ${bestScore || "0"}`, {
    fontFamily: "Arial",
    fontSize: 32,
    color: "#ffffff",
  });

  // Надпис Game Over
  gameOver = this.add.text(150, 140, "Game Over", {
    fontFamily: "Arial",
    fontSize: 64,
    color: "#f7df1e",
    backgroundColor: "#000000",
    padding: {
      x: 10,
      y: 5,
    },
  });
  gameOver.setVisible(false);

  // Додайте обробник кліку для кнопки "Рестарт"
  restartButton = this.add.text(330, 300, "Рестарт", {
    fontFamily: "Arial",
    fontSize: 32,
    color: "#f7df1e",
    backgroundColor: "#000000",
    padding: {
      x: 10,
      y: 5,
    },
  });

  restartButton.setVisible(false);
  restartButton.setOrigin(0.5);
  restartButton.setInteractive(); // Зробити кнопку інтерактивною
  restartButton.on("pointerdown", () => {
    // Перезапустити гру при кліку на кнопку "Рестарт"
    this.scene.restart();
  });
}

// Функція оновлення гри - виконує логіку гри на кожному кадрі
function update(time) {
  if (!snake.alive) {
    gameOver.setVisible(true);
    restartButton.setVisible(true);
    return;
  }

  /**
   * Перевірте, яка клавіша натиснута, а потім змініть напрямок змійки
   * заголовок на основі цього. Перевірки гарантують, що ви не подвійні назад
   * на собі, наприклад, якщо ви рухаєтесь праворуч і натискаєте
   * ЛІВИЙ курсор, він ігнорує його, оскільки єдині дійсні напрямки ви
   * може рухатися в той час вгору і вниз.
   */
  if (cursors.left.isDown) {
    snake.faceLeft();
  } else if (cursors.right.isDown) {
    snake.faceRight();
  } else if (cursors.up.isDown) {
    snake.faceUp();
  } else if (cursors.down.isDown) {
    snake.faceDown();
  }

  if (snake.update(time)) {
    //  Якщо змія оновлена, нам потрібно перевірити на зіткнення з їжею
    if (snake.collideWithFood(food)) {
      repositionFood();
    }
  }
}

// Функція для переставлення їжі після її з'їдання
function repositionFood() {
  //  Спочатку створіть масив, який приймає всі позиції
  //  дійсні для нового шматка їжі
  //  Сітка, яку ми будемо використовувати, щоб змінювати положення їжі кожного разу, коли її їдять
  let testGrid = [];

  for (let y = 0; y < 30; y++) {
    testGrid[y] = [];

    for (let x = 0; x < 40; x++) {
      testGrid[y][x] = true;
    }
  }

  snake.updateGrid(testGrid);

  //  Очистіть помилкові позиції
  let validLocations = [];

  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 40; x++) {
      if (testGrid[y][x] === true) {
        //  Чи справедлива ця позиція для їжі? Якщо так, додайте його сюди ...
        validLocations.push({ x: x, y: y });
      }
    }
  }

  if (validLocations.length > 0) {
    //  Використовуйте RNG, щоб вибрати випадкову позицію їжі
    const pos = Phaser.Math.RND.pick(validLocations);

    //  І розмістіть його
    food.setPosition(pos.x * 16, pos.y * 16);

    return true;
  } else {
    return false;
  }
}
