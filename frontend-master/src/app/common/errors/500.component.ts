import { Component, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-oema-500',
  templateUrl: './500.component.html',
  encapsulation: ViewEncapsulation.None
})
export class Error500Component {

  constructor(private titleService: Title) { this.titleService.setTitle('Unexpected error!'); }

}
