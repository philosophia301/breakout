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
            const saveData = JSON.stringify(this.brickState);
            localStorage.setItem('brickEditorData', saveData);
            this.scene.start('Game', { brickState: this.brickState });
        });

        this.input.on('pointerdown', () => {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                const saveData = JSON.stringify(this.brickState);
                localStorage.setItem('brickEditorData', saveData);
                this.scene.start('Game', { brickState: this.brickState });
            }
        });

        // 저장 버튼 추가
        const saveButton = this.add.text(16, 768, '저장', {
            fontSize: '60px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        saveButton.on('pointerdown', () => {
            const saveData = JSON.stringify(this.brickState);
            localStorage.setItem('brickEditorData', saveData);

            const savedText = this.add.text(20, 850, '저장완료!', { fontSize: '30px', fill: '#fff' })
                .setAlpha(1)
                .setDepth(1);
            this.time.delayedCall(1000, () => {
                savedText.destroy();
            });
        });

        // 불러오기 버튼 추가
        const loadButton = this.add.text(150, 768, '불러오기', {
            fontSize: '60px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        loadButton.on('pointerdown', () => {
            const savedData = localStorage.getItem('brickEditorData');
            if (savedData) {
                this.brickState = JSON.parse(savedData);
                // 저장된 상태로 블록들 업데이트
                this.bricks.children.each((brick) => {
                    const row = brick.getData('row');
                    const col = brick.getData('col');
                    brick.setFrame(this.brickState[row][col]);
                });
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