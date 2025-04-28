import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Route
} from '@angular/router';

import { CookieService } from 'ngx-cookie';

import { AuthService } from './auth.service';

import { AppConfig } from '../../app.config';

@Injectable()
export class DashboardGuard {
  constructor(
    public appConfig: AppConfig,
    private authService: AuthService,
    private cookieService: CookieService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url: string = state.url;

    return this.checkLogin(url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    const url = `/${route.path}`;

    return this.checkLogin(url);
  }

  checkLogin(url: string): boolean {
    const expiredUserSession: any = this.cookieService.getObject('expired');
    const urlPrefix = url.split('/')[1];

    if (this.authService.isAuthenticated() === 3 || this.authService.isAuthenticated() === 4) {
      // Referent or Admin
      if (expiredUserSession) {
        // session is locked, i.e. user token expired
        expiredUserSession.redirect = url;
        this.cookieService.putObject('expired', expiredUserSession, { secure: true, sameSite: 'strict' });
        this.router.navigate(['/' + urlPrefix + '/auth/unlock']);
        return false;
      } else {
        if (urlPrefix !== this.cookieService.get('oemaUri') &&
          urlPrefix !== this.appConfig.settings!.domains[0]) {
          this.authService.logout().subscribe({
            next: resp => {
              this.redirectToLogin(url);
            },
            error: err => {
              this.redirectToLogin(url);
            }
          });
          return false;
        }

        this.cookieService.put('oemaUri', urlPrefix, { secure: true, sameSite: 'strict' });

        return true;
      }
    } else if (this.authService.isAuthenticated() === 2) {
      // Reviewer
      /* Only two routes are authorized for reviewers:
      => /dashboard/reviews and /application
      */
      if (url.includes('/dashboard/assigned-reviews')) {
        if (expiredUserSession) {
          // session is locked, i.e. user token expired
          expiredUserSession.redirect = url;
          this.cookieService.putObject('expired', expiredUserSession, { secure: true, sameSite: 'strict' });
          this.router.navigate(['/' + urlPrefix + '/auth/unlock']);
          return false;
        } else {
          if (urlPrefix !== this.cookieService.get('oemaUri') &&
            urlPrefix !== this.appConfig.settings!.domains[0]) {
            this.authService.logout().subscribe({
              next: resp => {
                this.redirectToLogin(url);
              },
              error: err => {
                this.redirectToLogin(url);
              }
            });
            return false;
          }
          this.cookieService.put('oemaUri', urlPrefix, { secure: true, sameSite: 'strict' });

          return true;
        }
      }

    } else if (this.authService.isAuthenticated() === 1) {
      // Applicant => not authorized
      this.router.navigate(['/noway']);
      return false;

    } else {
      // not yet authenticated
      // Store the attempted URL for redirecting
      this.authService.redirectUrl = url;
      this.cookieService.put('redirect', url, { secure: true, sameSite: 'strict' });

      // Navigate to the login page with extras
      this.router.navigate(['/' + urlPrefix + '/auth/login']);
      return false;
    }


    this.router.navigate(['/noway']);
    return false;
  }

  redirectToLogin(url: string) {
    this.cookieService.removeAll();
    localStorage.clear();
    this.authService.getCsrfToken();
    this.router.navigate(['/' + url.split('/')[1] + '/auth/login']);
  }
}
