import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Route
} from '@angular/router';

import { CookieService } from 'ngx-cookie';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard {
  constructor(private authService: AuthService, private cookieService: CookieService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url: string = state.url;

    return this.isUserAlreadyLogged(url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    const url = `/${route.path}`;

    return this.isUserAlreadyLogged(url);
  }

  isUserAlreadyLogged(url: string): boolean {
    if (url.endsWith('/auth/unlock')) {
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/' + url.split('/')[1] + '/auth/login']);
        return false;
      }
      if (this.cookieService.get('expired')) {
        return true;
      }
    }

    if (url.endsWith('/auth/activate') || url.endsWith('/auth/change-password')) {
      if (!this.cookieService.get('privacyPolicy')) {
        this.cookieService.removeAll();
      } else {
        this.cookieService.removeAll();
        this.cookieService.put('privacyPolicy', '1', { secure: true, sameSite: 'strict' });
      }
      return true;
    }

    const urlPrefix = this.cookieService.get('oemaUri') || ''; // this.router.url.split('/')[1];

    switch (this.authService.isAuthenticated()) {
      case 1:
        this.router.navigate(['/' + urlPrefix + '/application']);
        return false;
      case 2:
        this.router.navigate(['/' + urlPrefix + '/application']);
        return false;
      case 3:
        this.router.navigate(['/' + urlPrefix + '/dashboard']);
        return false;
      case 4:
        this.router.navigate(['/' + urlPrefix + '/dashboard']);
        return false;
      default:
        return true;
    }
  }

}
