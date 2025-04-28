import { Component, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { CookieService } from 'ngx-cookie';
import { AuthService } from '../../common/ng-services/auth.service';

@Component({
  selector: 'app-oema-401',
  templateUrl: './401.component.html',
  encapsulation: ViewEncapsulation.None
})
export class Error401Component {
  urlPrefix?: string;
  isAuthed = false;

  constructor(
    private titleService: Title,
    private cookieService: CookieService,
    private authService: AuthService) {
    this.titleService.setTitle('Unauthorized!');
    this.urlPrefix = this.cookieService.get('oemaUri');
    this.isAuthed = this.authService.isAuthenticated() > 0;
    // When (urlPrefix && !isAuthed),
    // user has signed in with Orange Connect, but something was wrong
    // the auth process couldn't be completed correctly (may happen with Orange Connect).
    // So just try again or reload the page.
  }

}
