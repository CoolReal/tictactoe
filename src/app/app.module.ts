import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {GameComponent} from './components/game/game.component';

@NgModule({
   declarations: [GameComponent],
   imports: [BrowserModule],
   providers: [],
   bootstrap: [GameComponent],
})
export class AppModule {
}
