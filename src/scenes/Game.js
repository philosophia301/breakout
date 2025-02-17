import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.gameHeight = this.cameras.main.height;
        this.brickState = data.brickState;
    }

    create() {
        this.cameras.main.setBackgroundColor(0xffffff);

        this.videoStack = 0;
        this.MAX_BALL_COUNT = 500;
        this.add.frame
        this.video1 = this.add.video(512, this.gameHeight, 'video1');
        this.video1.setOrigin(0.5, 1);
        this.video1.setDepth(3);
        this.video1.setScale(0.71);
        this.video1.play(true);

        this.video2 = this.add.video(512, this.gameHeight, 'video2');
        this.video2.setOrigin(0.5, 1);
        this.video2.setDepth(3);
        this.video2.setScale(0.71);
        this.video2.setVisible(false);

        this.physics.world.setBoundsCollision(true, true, true, true);

        const brickWidth = 16;
        const brickHeight = 8;
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: ['blue1'],
            frameQuantity: 64 * 64,
            gridAlign: {
                width: 64,
                height: 64,
                cellWidth: brickWidth,
                cellHeight: brickHeight,
                x: -brickWidth * 1.5,
                y: -brickHeight * 1.5,
            }
        });
        this.bricks.children.each((brick, index) => {
            brick.setScale(0.25);
            brick.body.setSize(brickWidth, brickHeight);
            brick.body.setOffset(brickWidth * 1.5, brickHeight * 1.5);

            const row = Math.floor(index / 64);
            const col = index % 64;
            brick.setData('row', row);
            brick.setData('col', col);
            brick.setFrame(this.brickState[row][col]);
        });

        this.balls = this.physics.add.group();
        this.firstBall = this.balls.create(512, 550, 'assets', 'ball1').setScale(0.5);
        this.firstBall.setCollideWorldBounds(true).setBounce(1);
        this.firstBall.setData('onPaddle', true);
        this.firstBall.body.setCircle(11);

        this.paddle = this.physics.add.image(512, 700, 'assets', 'paddle1').setImmovable();

        // 보이지 않는 상단 벽 생성
        this.topWall = this.add.rectangle(512, 900, 1024, 50);
        this.physics.add.existing(this.topWall, true); // true는 static body로 설정
        this.topWall.setVisible(false); // 보이지 않게 설정

        // 충돌 설정
        this.physics.add.collider(this.balls, this.topWall, this.hitTopWall, null, this);
        this.physics.add.collider(this.balls, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.balls, this.paddle, this.hitPaddle, null, this);

        this.input.on('pointermove', (pointer) => {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, 974);

            if (this.firstBall.getData('onPaddle')) {
                this.firstBall.x = this.paddle.x;
            }
        }, this);

        this.input.on('pointerdown', (pointer) => {
            if (this.firstBall.getData('onPaddle')) {
                this.firstBall.setVelocity(-75, -300);
                this.firstBall.setData('onPaddle', false);
            }
        }, this);
    }

    hitBrick(ball, brick) {
        if (this.brickState[brick.getData('row')][brick.getData('col')] === 'blue1') {
            brick.disableBody(true, true);

            if (this.video1.visible) {
                this.playVideo2();
            }

            this.videoStack++;
            this.time.delayedCall(200, () => {
                this.videoStack--;

                if (this.videoStack === 0) {
                    this.playVideo1();
                }
            }, null, this);

            if (Phaser.Math.Between(1, 100) <= 50) {
                const item = this.physics.add.image(brick.x, brick.y, 'assets', 'ball2');
                item.setVelocity(0, 150);

                this.physics.add.collider(item, this.topWall, (item, topWall) => {
                    item.destroy();
                }, null, this);

                // 패들과 아이템 충돌 설정
                this.physics.add.overlap(this.paddle, item, (paddle, item) => {
                    if (this.balls.countActive() >= this.MAX_BALL_COUNT) {
                        item.destroy();
                        return;
                    }

                    const angle = [120, 240];
                    this.balls.children.each((b) => {
                        if (this.balls.countActive() >= this.MAX_BALL_COUNT) {
                            return;
                        }

                        if (b.body.y > 700) {
                            return;
                        }

                        for (let i = 0; i < 2; i++) {
                            const newBall = this.balls.create(b.x, b.y, 'assets', 'ball1')
                                .setCollideWorldBounds(true)
                                .setBounce(1).setScale(0.5);

                            newBall.body.setCircle(11);

                            // 약간 다른 각도로 발사
                            const newVelocity = b.body.velocity.clone().rotate(Phaser.Math.DegToRad(angle[i] + Phaser.Math.Between(-30, 30)));
                            newBall.setVelocity(newVelocity.x, newVelocity.y);
                        }
                    });

                    // 아이템 제거
                    item.destroy();
                }, null, this);
            }
        }
    }

    hitTopWall(topWall, ball) {
        ball.destroy();
    }

    playVideo1() {
        this.video2.setVisible(false);
        this.video2.stop();

        this.video1.seekTo(0);
        this.video1.setVisible(true);
        this.video1.play(true);
    }

    playVideo2() {
        this.video1.setVisible(false).stop();
        this.video1.stop();

        this.video2.seekTo(0);
        this.video2.setVisible(true);
        this.video2.play(true);
    }

    hitPaddle(paddle, ball) {
        const BALL_SPEED = 400; // 일정한 속도 설정
        const MAX_BOUNCE_ANGLE = Math.PI / 3; // 최대 반사각 (60도)

        let relativeIntersectX = (ball.x - paddle.x) / (paddle.width / 2);

        let bounceAngle = relativeIntersectX * MAX_BOUNCE_ANGLE;

        let velocityX = BALL_SPEED * Math.sin(bounceAngle);
        let velocityY = -BALL_SPEED * Math.cos(bounceAngle);

        ball.setVelocity(velocityX, velocityY);
    }

    update() {
        if (this.bricks.countActive() === 0 || this.balls.countActive() === 0) {
            this.scene.start('GameOver');
        }
    }
}
