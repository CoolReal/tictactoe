import {
   AfterViewInit,
   Component,
   Inject,
   OnInit,
   Renderer2,
   ViewChildren,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

class BoardSlot {
   playerValue: string = '';
   element!: HTMLTableCellElement;
}

@Component({
   selector: 'app-game',
   templateUrl: './game.component.html',
   styleUrls: ['./game.component.css'],
})
export class GameComponent implements AfterViewInit, OnInit {
   audios: any = {};
   boardWidth: number[] = Array(3).fill(0);
   filledSlots: number = 0;
   @ViewChildren('boardSlot') boardSlotElements!: any;
   boardSlots: BoardSlot[] = [];
   latestSymbol!: string | null;
   symbols: any = {
      player: 'X',
      computer: 'O',
   };
   scores: any = {
      player: 0,
      computer: 0,
   };
   winner!: string | null;

   constructor(
      @Inject(DOCUMENT) private document: Document,
      private renderer: Renderer2
   ) {}

   ngOnInit() {
      let sounds = ['win', 'tie', 'loss'];
      for (let sound of sounds) {
         this.audios[sound] = new Audio('/assets/audio/' + sound + '.wav');
         this.audios[sound].load();
      }
   }

   ngAfterViewInit(): void {
      this.boardSlotElements.forEach((element: any) =>
         this.boardSlots.push({
            playerValue: '',
            element: element.nativeElement,
         })
      );
   }

   setPlayer(event: any) {
      if (event.target.tagName !== 'DIV') {
         return;
      }
      if (
         !this.setBoardSlot(
            event.target.getAttribute('data-index'),
            this.symbols.player
         )
      ) {
         return;
      }
      this.computerTurn();
   }

   setBoardSlot(index: number, symbol: string) {
      let slot = this.boardSlots[index];
      if (slot.playerValue || this.winner) {
         return false;
      }
      if (this.latestSymbol === symbol) {
         return false;
      }
      this.latestSymbol = symbol;
      let image;
      if (symbol === 'X') {
         image = this.document.createElement('img');
         image.src = '/assets/icons/cross.svg';
      } else if (symbol === 'O') {
         image = this.document.createElement('img');
         image.src = '/assets/icons/circle.svg';
      }
      if (image) {
         image.setAttribute('style', 'height: 100%; display: block');
         this.renderer.appendChild(slot.element, image);
      }
      slot.playerValue = symbol;
      this.filledSlots++;
      this.checkBoard();
      return true;
   }

   private checkRows() {
      for (let i = 0; i < this.boardWidth.length; i++) {
         let indexes = [];
         let index = i * this.boardWidth.length;
         indexes.push(index);
         let symbol = this.boardSlots[index].playerValue;
         if (symbol === '') {
            continue;
         }
         let gameEnded = true;
         for (let j = 1; j < this.boardWidth.length; j++) {
            index = i * this.boardWidth.length + j;
            indexes.push(index);
            if (this.boardSlots[index].playerValue !== symbol) {
               gameEnded = false;
               break;
            }
         }
         if (gameEnded) {
            this.changeEndSymbolOpacity(indexes);
            return symbol;
         }
      }
      return '';
   }

   private checkColumns() {
      for (let i = 0; i < this.boardWidth.length; i++) {
         let indexes = [];
         indexes.push(i);
         let symbol = this.boardSlots[i].playerValue;
         if (symbol === '') {
            continue;
         }
         let gameEnded = true;
         for (let j = 1; j < this.boardWidth.length; j++) {
            let index = j * this.boardWidth.length + i;
            indexes.push(index);
            if (
               this.boardSlots[j * this.boardWidth.length + i].playerValue !==
               symbol
            ) {
               gameEnded = false;
               break;
            }
         }
         if (gameEnded) {
            this.changeEndSymbolOpacity(indexes);
            return symbol;
         }
      }
      return '';
   }

   private checkDiagonals() {
      //check diagonal 1 for a win
      let symbol = this.boardSlots[0].playerValue;
      if (symbol !== '') {
         let indexes = [0];
         let gameEnded = true;
         for (let i = 1; i < this.boardWidth.length; i++) {
            let index = i * (this.boardWidth.length + 1);
            indexes.push(index);
            if (this.boardSlots[index].playerValue !== symbol) {
               gameEnded = false;
               break;
            }
         }
         if (gameEnded) {
            this.changeEndSymbolOpacity(indexes);
            return symbol;
         }
      }

      //check diagonal 2 for a win
      symbol = this.boardSlots[this.boardWidth.length - 1].playerValue;
      if (symbol !== '') {
         let indexes = [this.boardWidth.length - 1];
         let gameEnded = true;
         for (let i = 1; i < this.boardWidth.length; i++) {
            let index = (i + 1) * (this.boardWidth.length - 1);
            indexes.push(index);
            if (this.boardSlots[index].playerValue !== symbol) {
               gameEnded = false;
               break;
            }
         }
         if (gameEnded) {
            this.changeEndSymbolOpacity(indexes);
            return symbol;
         }
      }
      return '';
   }

   checkBoard() {
      let winnerSymbol = this.checkRows();
      if (!winnerSymbol) {
         winnerSymbol = this.checkColumns();
         if (!winnerSymbol) {
            winnerSymbol = this.checkDiagonals();
         }
      }
      if (winnerSymbol) {
         this.setWinner(winnerSymbol);
         return;
      }
      if (this.filledSlots === this.boardSlots.length) {
         this.changeEndSymbolOpacity([]);
         this.audios.tie.play();
         this.winner = 'tie';
         return;
      }
   }

   setWinner(winnerSymbol: string) {
      this.winner = winnerSymbol;
      if (winnerSymbol === this.symbols.player) {
         this.scores.player++;
         this.audios.win.play();
      } else if (winnerSymbol === this.symbols.computer) {
         this.scores.computer++;
         this.audios.loss.play();
      }
   }

   restartGame() {
      this.boardSlots.forEach((slot) => {
         slot.element.innerHTML = '';
         slot.playerValue = '';
      });
      this.winner = null;
      this.latestSymbol = null;
      this.filledSlots = 0;
   }

   private computerTurn() {
      if (this.winner) {
         return;
      }
      let freeSlots = this.boardSlots.filter((slot) => slot.playerValue === '');
      let randomSlot = Math.floor(Math.random() * freeSlots.length);
      let index: number = <any>(
         freeSlots[randomSlot].element.getAttribute('data-index')
      );
      let delay = 0;
      setTimeout(() => {
         this.setBoardSlot(index, this.symbols.computer);
      }, delay);
   }

   switchSymbols(playerSymbol: string, computerSymbol: string) {
      this.symbols.player = playerSymbol;
      this.symbols.computer = computerSymbol;
   }

   changeEndSymbolOpacity(indexes: number[]) {
      for (let i = 0; i < this.boardSlots.length; i++) {
         if (indexes.includes(i)) {
            continue;
         }
         let slot = this.boardSlots[i];
         if (slot.element.children.length) {
            let image = slot.element.children[0];
            image.setAttribute(
               'style',
               image.getAttribute('style') + '; opacity: 0.5'
            );
         }
      }
   }
}
