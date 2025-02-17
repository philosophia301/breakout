import { Scene } from 'phaser';

export class Editor extends Scene {
    constructor() {
        super('Editor');
    }

    create() {
        this.brickState = [];

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
            const row = Math.floor(index / 64);
            const col = index % 64;
            brick.setData('row', row);
            brick.setData('col', col);
            brick.setScale(0.25);
            brick.body.setSize(brickWidth, brickHeight);
            brick.body.setOffset(brickWidth * 1.5, brickHeight * 1.5);

            // brickState 배열이 없으면 초기화
            if (!this.brickState[row]) {
                this.brickState[row] = [];
            }

            // 초기값 설정
            this.brickState[row][col] = 'blue1';
        });


        this.bricks.children.each((brick) => {
            brick.setInteractive();
            brick.on('pointerover', (pointer) => {
                if (this.input.activePointer.isDown) {
                    if (pointer.event.ctrlKey) {
                        brick.setFrame('blank');
                        this.brickState[brick.getData('row')][brick.getData('col')] = 'blank';
                        brick.setVisible(false);
                    } else {
                        brick.setFrame('silver1');
                        this.brickState[brick.getData('row')][brick.getData('col')] = 'silver1';
                        brick.setVisible(true);
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

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Game', { brickState: this.brickState });
        });

        // this.input.on('pointerdown', () => {
        //     this.scene.start('Game', { brickState: this.brickState });
        // });
    }
}