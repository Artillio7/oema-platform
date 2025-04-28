import { Component, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-oema-404',
  templateUrl: './404.component.html',
  encapsulation: ViewEncapsulation.None
})
export class Error404Component {

  constructor(private titleService: Title) { this.titleService.setTitle('Not found!'); }

}
