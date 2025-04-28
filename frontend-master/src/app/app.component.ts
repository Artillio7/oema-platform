import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location, PopStateEvent } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private lastPoppedUrl?: string;
  private isNamedOutletActive = false;
  private disableScrolling = false;

  constructor(private router: Router, private location: Location) { }

  ngOnInit() {
    this.location.subscribe((ev: PopStateEvent) => {
      this.lastPoppedUrl = ev.url?.replace(/\(contact:compose\)/g, '');
    });
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        if (ev.url.includes('(contact:compose)') && !this.isNamedOutletActive) {
          this.isNamedOutletActive = true;
          this.disableScrolling = true;
        }
        if (!ev.url.includes('(contact:compose)') && this.isNamedOutletActive) {
          this.isNamedOutletActive = false;
          this.disableScrolling = true;
        }
        if (ev.url.replace(/\(contact:compose\)/g, '') === this.lastPoppedUrl) {
          this.lastPoppedUrl = undefined;
        } else {
          if (!this.disableScrolling) {
            window.scrollTo(0, 0);
          } else {
            this.disableScrolling = false;
          }
        }
      }
    });
  }
}
