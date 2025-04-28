import { Component, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-oema-403',
  templateUrl: './403.component.html',
  encapsulation: ViewEncapsulation.None
})
export class Error403Component {

  constructor(private titleService: Title) { this.titleService.setTitle('Forbidden!'); }

}
