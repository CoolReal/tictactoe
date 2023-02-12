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
   audioFiles: any = {};

   //Using array assignment for board building with ngFor directives, allows for dynamic board sizes
   boardWidth: number[] = Array(3).fill(0);
   @ViewChildren('boardSlot') boardSlotElements!: any;
   boardSlots: BoardSlot[] = [];

   symbols: any = {
      player: 'X',
      computer: 'O',
   };
   scores: any = {
      player: 0,
      computer: 0,
   };

   filledSlots: number = 0;
   latestSymbol!: string | null;
   winner!: string | null;

   constructor(
      @Inject(DOCUMENT) private document: Document,
      private renderer: Renderer2
   ) {}

   ngOnInit() {
      //Preload sounds
      let sounds = ['win', 'tie', 'loss'];
      for (let sound of sounds) {
         this.audioFiles[sound] = new Audio('/assets/audio/' + sound + '.wav');
         this.audioFiles[sound].load();
      }
   }

   ngAfterViewInit(): void {
      //Associate slots to their game values
      this.boardSlotElements.forEach((element: any) =>
         this.boardSlots.push({
            playerValue: '',
            element: element.nativeElement,
         })
      );
   }

   /**
    * Resets the board but not the scores
    */
   restartGame() {
      this.boardSlots.forEach((slot) => {
         slot.element.innerHTML = '';
         slot.playerValue = '';
      });
      this.winner = null;
      this.latestSymbol = null;
      this.filledSlots = 0;
   }

   switchSymbols(playerSymbol: string, computerSymbol: string) {
      this.symbols.player = playerSymbol;
      this.symbols.computer = computerSymbol;
   }

   /**
    * Halves the opacity of all the board slots that aren't part of the end game win solution
    *
    * @param indexes indexes of the board slots used to win
    */
   changeEndSymbolOpacity(indexes: number[]) {
      for (let i = 0; i < this.boardSlots.length; i++) {
         //Skips boards slots used to win
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

   /**
    * Plays player's turn
    * @param event
    */
   playerTurn(event: any) {
      //Prevents clicking already played slots
      if (event.target.tagName !== 'DIV') {
         return;
      }
      //If the play was not possible, prevents the computer from playing
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

   /**
    * Plays computer's turn
    * @private
    */
   private computerTurn() {
      //Prevents the computer from playing if the game is over
      if (this.winner) {
         return;
      }
      let freeSlots = this.boardSlots.filter((slot) => slot.playerValue === '');
      let randomSlot = Math.floor(Math.random() * freeSlots.length);
      let index: number = <any>(
         freeSlots[randomSlot].element.getAttribute('data-index')
      );
      this.setBoardSlot(index, this.symbols.computer);
   }

   private setWinner(winnerSymbol: string) {
      this.winner = winnerSymbol;
      if (winnerSymbol === this.symbols.player) {
         this.scores.player++;
         this.audioFiles.win.play();
      } else if (winnerSymbol === this.symbols.computer) {
         this.scores.computer++;
         this.audioFiles.loss.play();
      }
   }

   //region Game Logic
   /**
    * Fills the given slot by index with the symbol
    *
    * @param index index of the slot to fill
    * @param symbol symbol to fill the slot with
    * @returns false if it was not possible to fill slot, true if otherwise
    * @private
    */
   private setBoardSlot(index: number, symbol: string) {
      let slot = this.boardSlots[index];
      //Prevents playing a slot that has already been filled or if the game is over
      if (slot.playerValue || this.winner) {
         return false;
      }
      //Prevents the same player from playing more than once is a row
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

   /**
    * Checks the board for a win condition or a tie
    *
    * @private
    */
   private checkBoard() {
      let result = this.checkRows();
      if (!result.winner) {
         result = this.checkColumns();
         if (!result.winner) {
            result = this.checkDiagonals();
         }
      }
      if (result.winner) {
         this.setWinner(result.winner);
      } else if (this.filledSlots === this.boardSlots.length) {
         this.audioFiles.tie.play();
         this.winner = 'tie';
      }
      if (this.winner) {
         this.changeEndSymbolOpacity(result.indexes);
      }
   }

   /**
    * Checks board rows for the win condition
    *
    * Returns: <pre>
    *    {winner, indexes}
    *    winner: winning symbol, empty string if no win
    *    indexes: indexes of the slots that contributed for the win, empty array if no win
    * </pre>
    *
    * @private
    */
   private checkRows() {
      for (let i = 0; i < this.boardWidth.length; i++) {
         let indexes = [];
         let index = i * this.boardWidth.length;
         indexes.push(index);
         let symbol = this.boardSlots[index].playerValue;
         //No symbol assigned so there's no win condition, skips current iteration
         if (symbol === '') {
            continue;
         }
         let isGameOver = true;
         for (let j = 1; j < this.boardWidth.length; j++) {
            index = i * this.boardWidth.length + j;
            indexes.push(index);
            if (this.boardSlots[index].playerValue !== symbol) {
               isGameOver = false;
               break;
            }
         }
         if (isGameOver) {
            return { winner: symbol, indexes };
         }
      }
      return { winner: '', indexes: [] };
   }

   /**
    * Checks board columns for the win condition
    *
    * Returns: <pre>
    *    {winner, indexes}
    *    winner: winning symbol, empty string if no win
    *    indexes: indexes of the slots that contributed for the win, empty array if no win
    * </pre>
    *
    * @private
    */
   private checkColumns() {
      for (let i = 0; i < this.boardWidth.length; i++) {
         let indexes = [];
         indexes.push(i);
         let symbol = this.boardSlots[i].playerValue;
         //No symbol assigned so there's no win condition, skips current iteration
         if (symbol === '') {
            continue;
         }
         let isGameOver = true;
         for (let j = 1; j < this.boardWidth.length; j++) {
            let index = j * this.boardWidth.length + i;
            indexes.push(index);
            if (
               this.boardSlots[j * this.boardWidth.length + i].playerValue !==
               symbol
            ) {
               isGameOver = false;
               break;
            }
         }
         if (isGameOver) {
            return { winner: symbol, indexes };
         }
      }
      return { winner: '', indexes: [] };
   }

   /**
    * Checks both board diagonals for the win condition
    *
    * Returns: <pre>
    *    {winner, indexes}
    *    winner: winning symbol, empty string if no win
    *    indexes: indexes of the slots that contributed for the win, empty array if no win
    * </pre>
    *
    * @private
    */
   private checkDiagonals(): any {
      //check diagonal 1 for a win condition
      let symbol = this.boardSlots[0].playerValue;
      //No symbol assigned so there's no win condition, skips iteration
      if (symbol !== '') {
         let indexes = [0];
         let isGameOver = true;
         for (let i = 1; i < this.boardWidth.length; i++) {
            let index = i * (this.boardWidth.length + 1);
            indexes.push(index);
            if (this.boardSlots[index].playerValue !== symbol) {
               isGameOver = false;
               break;
            }
         }
         if (isGameOver) {
            return { winner: symbol, indexes };
         }
      }

      //check diagonal 2 for a win condition
      symbol = this.boardSlots[this.boardWidth.length - 1].playerValue;
      //No symbol assigned so there's no win condition, skips iteration
      if (symbol !== '') {
         let indexes = [this.boardWidth.length - 1];
         let isGameOver = true;
         for (let i = 1; i < this.boardWidth.length; i++) {
            let index = (i + 1) * (this.boardWidth.length - 1);
            indexes.push(index);
            if (this.boardSlots[index].playerValue !== symbol) {
               isGameOver = false;
               break;
            }
         }
         if (isGameOver) {
            return { winner: symbol, indexes };
         }
      }
      return { winner: '', indexes: [] };
   }
   //endregion
}
