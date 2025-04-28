import { Component, OnInit } from '@angular/core';

import { AuthService } from '../common/ng-services/auth.service';

@Component({
  selector: 'app-oema',
  template: '<router-outlet></router-outlet>',
})
export class SimpleLayoutComponent implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.getCsrfToken();
  }
}
