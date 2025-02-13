import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        this.physics.world.setBoundsCollision(true, true, true, true);

        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: ['blue1'],
            frameQuantity: 500,
            gridAlign: {
                width: 25,
                height: 20,
                cellWidth: 32,
                cellHeight: 16,
                x: 112,
                y: 100,
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

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        this.input.on('pointermove', (pointer) => {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

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

            if (this.bricks.countActive() === 0) {
                this.resetLevel();
            }
        }
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
        let diff = 0;

        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    update() {
        if (this.ball.y > 1000) {
            // this.resetLevel();
            this.scene.start('GameOver');
        }
    }
}
