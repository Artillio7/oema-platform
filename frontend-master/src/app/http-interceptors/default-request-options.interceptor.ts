import { Injectable } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpEvent, HttpErrorResponse, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CookieService } from 'ngx-cookie';

@Injectable()
export class DefaultRequestOptions implements HttpInterceptor {
  ignoredRequests: Array<any>;

  constructor(private cookieService: CookieService, private router: Router) {
    this.ignoredRequests = [
      { method: 'POST', url: '^\/api\/upload' },
      { method: 'GET', url: '^\/api\/auth\/login\/oidc' }
    ];
  }

  private handleError(error: HttpErrorResponse) {
    // [Todo] Add a remote logging handler here?

    let errMsg: string;

    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      errMsg = error.error.message;

    } else {
      // The backend returned an unsuccessful response code.

      if (error.statusText === 'Gateway Timeout') {
        return throwError(() => 'Backend Timeout. Please check your network connection, or contact us for support.');
      }

      const err = error.error;

      if (!err.stack || !Object.keys(err.stack).length) {
        errMsg = err.message || '';

        if (!errMsg) {
          errMsg = error.message || '';

        } else if ((errMsg.startsWith('Invalid token for user') || errMsg === 'Plase authenticate with your login credentials.')
          && this.cookieService.get('oema')) {
          if (!this.cookieService.get('expired')) {
            const user = errMsg.replace('Invalid token for user ', '').split(';');
            const email = this.cookieService.get('oemaEmail');

            let userEmail;
            if (user.length === 2) {
              userEmail = user[0];
            } else if (email) {
              userEmail = email;
            } else {
              userEmail = '';
            }

            if (userEmail) {
              this.cookieService.putObject(
                'expired',
                { email: userEmail, firstname: user[1] || '', redirect: this.router.url },
                { secure: true, sameSite: 'strict' }
              );
              this.router.navigate(['/' + this.router.url.split('/')[1] + '/auth/unlock']);

            } else {
              this.cookieService.put('redirect', this.router.url, { secure: true, sameSite: 'strict' });
              this.cookieService.remove('oema');
              this.router.navigate(['/' + this.router.url.split('/')[1] + 'auth/login']);
            }

          } else {
            errMsg = 'Your session may expire. Please go back to the login page and enter your credentials again.';
          }
        }


      } else if (err.stack && err.stack.includes('APIError: E11000 duplicate key error collection')) {
        errMsg = `${error.status}${error.statusText ? ' - ' + error.statusText : ''} - Document already created.`;

      } else {
        const re = /.*APIError:\s+(.*)\s+at */;
        const tmpMsg = (err.stack).match(re);
        if (tmpMsg) {
          errMsg = tmpMsg[1];
        } else {
          errMsg = `${error.status}${error.statusText ? ' - ' + error.statusText : ''}`;
        }
      }
    }

    return throwError(() => errMsg);
  }

  private validRequestForInterceptor(requestMethod: string, requestUrl: string): boolean {
    for (const req of this.ignoredRequests) {
      if (requestMethod === req.method && new RegExp(req.url).test(requestUrl)) {
        return false;
      }
    }

    return true;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const csrfToken = !["GET", "HEAD", "OPTIONS"].includes(req.method) ? localStorage.getItem('ctn') : null;

    if (this.validRequestForInterceptor(req.method, req.url)) {
      // Clone the request and replace the original headers with
      // cloned headers, updated with the 'Content-Type' header
      let headers = req.headers.set('Content-Type', 'application/json');
      if (csrfToken) {
        headers = headers.set('x-csrf-token', csrfToken)
      }
      const modifiedReq = req.clone({
        headers,
        withCredentials: true /* !!! important for CORS */
      });

      // send cloned request with header to the next handler.
      return next.handle(modifiedReq).pipe(
        catchError(error => this.handleError(error))
      );
    }

    let modifiedReq = req;
    if (csrfToken) {
      modifiedReq = req.clone({ headers: req.headers.set('x-csrf-token', csrfToken) });
    }

    return next.handle(modifiedReq).pipe(
      catchError(error => this.handleError(error))
    );
  }
}

export const requestOptionsProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: DefaultRequestOptions,
  multi: true,
  deps: [CookieService, Router]
};
