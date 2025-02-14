import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init() {
        this.gameHeight = this.cameras.main.height;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        this.videoStack = 0;

        this.video1 = this.add.video(512, this.gameHeight, 'video1');
        this.video1.setOrigin(0.5, 1);
        this.video1.setDepth(3);
        this.video1.play(true);

        this.video2 = this.add.video(512, this.gameHeight, 'video2');
        this.video2.setOrigin(0.5, 1);
        this.video2.setDepth(3);
        this.video2.setVisible(false);

        this.physics.world.setBoundsCollision(true, true, true, true);

        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: ['blue1'],
            frameQuantity: 992,
            gridAlign: {
                width: 32,
                height: 31,
                cellWidth: 32,
                cellHeight: 16,
                x: -16,
                y: -8,
            }
        });
        this.bricks.children.each((brick) => {
            brick.setScale(0.5);
            brick.body.setSize(32, 16);
            brick.body.setOffset(16, 8);
        });

        this.bricks.children.each((brick) => {
            brick.setData('kind', 'blue1');

            brick.setInteractive();
            brick.on('pointerover', (pointer) => {
                if (this.input.activePointer.isDown) {
                    if (pointer.event.ctrlKey) {
                        brick.setData('kind', 'blank');
                        brick.setVisible(false);
                    } else {
                        brick.setVisible(true);
                        brick.setData('kind', 'silver1');
                        brick.setFrame('silver1');
                    }
                }
            });

            // brick.on('pointerdown', (pointer) => {
            //     if (this.input.activePointer.isDown) {
            //         if (pointer.event.ctrlKey) {
            //             brick.setData('kind', 'blank');
            //             brick.setVisible(false);
            //             brick.body.enable = false;
            //         } else {
            //             brick.setData('kind', 'silver1');
            //             brick.body.enable = true;
            //             brick.setVisible(true);
            //             brick.setFrame('silver1');
            //         }
            //     }
            // });
        })

        this.ball = this.physics.add.image(512, 550, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);
        this.ball.body.setCircle(11);

        this.paddle = this.physics.add.image(512, 700, 'assets', 'paddle1').setImmovable();

        // 보이지 않는 상단 벽 생성
        this.topWall = this.add.rectangle(512, 900, 1024, 50);
        this.physics.add.existing(this.topWall, true); // true는 static body로 설정
        this.topWall.setVisible(false); // 보이지 않게 설정
        this.physics.add.collider(this.ball, this.topWall);

        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        this.input.on('pointermove', (pointer) => {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, 974);

            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }
        }, this);

        this.input.on('pointerup', (pointer) => {
            if (this.ball.getData('onPaddle')) {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }
        }, this);
    }

    hitBrick(ball, brick) {
        if (brick.getData('kind') === 'blue1') {
            brick.disableBody(true, true);

            if (this.video1.visible) {
                this.playVideo2();
            }

            this.videoStack++;
            this.time.delayedCall(1000, () => {
                this.videoStack--;

                if (this.videoStack === 0) {
                    this.playVideo1();
                }
            }, null, this);

            if (this.bricks.countActive() === 0) {
                this.resetLevel();
            }
        }
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

    resetBall() {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    }

    resetLevel() {
        this.resetBall();

        this.bricks.children.each(brick => {
            brick.enableBody(false, 0, 0, true, true);
        });
    }

    hitPaddle(ball, paddle) {
        const BALL_SPEED = 400; // 일정한 속도 설정
        const MAX_BOUNCE_ANGLE = Math.PI / 3; // 최대 반사각 (60도)

        let relativeIntersectX = (ball.x - paddle.x) / (paddle.width / 2);

        let bounceAngle = relativeIntersectX * MAX_BOUNCE_ANGLE;

        let velocityX = BALL_SPEED * Math.sin(bounceAngle);
        let velocityY = -BALL_SPEED * Math.cos(bounceAngle);

        ball.setVelocity(velocityX, velocityY);
    }

    update() {
        if (this.ball.y > 2000) {
            // this.resetLevel();
            this.scene.start('GameOver');
        }
    }
}
