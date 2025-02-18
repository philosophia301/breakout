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
                if (pointer.event.ctrlKey) {
                    brick.setFrame('blank');
                    this.brickState[brick.getData('row')][brick.getData('col')] = 'blank';
                } else if (pointer.event.shiftKey) {
                    brick.setFrame('silver1');
                    this.brickState[brick.getData('row')][brick.getData('col')] = 'silver1';
                } else if (pointer.event.altKey) {
                    brick.setFrame('blue1');
                    this.brickState[brick.getData('row')][brick.getData('col')] = 'blue1';
                }
            });

            brick.on('pointerdown', (pointer) => {
                if (pointer.leftButtonDown()) {
                    if (this.firstAxis) {
                        this.firstAxis[0].setFrame(this.brickState[this.firstAxis[1]][this.firstAxis[2]]);
                    }
                    brick.setFrame('red2');
                    this.firstAxis = [brick, brick.getData('row'), brick.getData('col')];
                } else if (pointer.rightButtonDown()) {
                    if (this.secondAxis) {
                        this.secondAxis[0].setFrame(this.brickState[this.secondAxis[1]][this.secondAxis[2]]);
                    }
                    brick.setFrame('red2');
                    this.secondAxis = [brick, brick.getData('row'), brick.getData('col')];
                }

                console.log('첫번째 축:', this.firstAxis);
                console.log('두번째 축:', this.secondAxis);
            });
        })

        this.input.keyboard.on('keydown-Z', () => {
            this.handleSelectArea('blank');
        });

        this.input.keyboard.on('keydown-X', () => {
            this.handleSelectArea('silver1');
        });

        this.input.keyboard.on('keydown-C', () => {
            this.handleSelectArea('blue1');
        });


        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Game', { brickState: this.brickState });
        });

        this.input.on('pointerdown', () => {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                this.scene.start('Game', { brickState: this.brickState });
            }
        });
    }

    handleSelectArea(frame) {
        if (this.firstAxis && this.secondAxis) {
            const startRow = Math.min(this.firstAxis[1], this.secondAxis[1]);
            const endRow = Math.max(this.firstAxis[1], this.secondAxis[1]);
            const startCol = Math.min(this.firstAxis[2], this.secondAxis[2]);
            const endCol = Math.max(this.firstAxis[2], this.secondAxis[2]);

            const [finalStartRow, finalEndRow] = [startRow, endRow].sort((a, b) => a - b);
            const [finalStartCol, finalEndCol] = [startCol, endCol].sort((a, b) => a - b);

            for (let row = finalStartRow; row <= finalEndRow; row++) {
                for (let col = finalStartCol; col <= finalEndCol; col++) {
                    this.bricks.children.each((brick) => {
                        if (brick.getData('row') === row && brick.getData('col') === col) {
                            brick.setFrame(frame);
                            this.brickState[row][col] = frame;
                        }
                    });
                }
            }

            this.firstAxis = null;
            this.secondAxis = null;
        }
    }
}