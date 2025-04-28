import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { CookieService } from 'ngx-cookie';

import { User } from '../ng-models/user';

export interface AuthMsg {
  success: boolean;
  id: string;
  state: number;
  message: string;
  policy: boolean;
  user: User;
}

@Injectable()
export class AuthService {
  private authRoute = '/api/auth';

  // store the URL so we can redirect after logging in
  redirectUrl!: string;

  constructor(private http: HttpClient, private cookieService: CookieService) { }

  hashGen(value: string) {
    let hash = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 25; i++) {
      hash += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    if (value === 'Applicant') {
      return hash.substring(0, 8) + '1' + hash.substring(9);
    } else if (value === 'Reviewer') {
      return hash.substring(0, 8) + '2' + hash.substring(9);
    } else if (value === 'Referent') {
      return hash.substring(0, 8) + '3' + hash.substring(9);
    } else {
      return hash.substring(0, 8) + '4' + hash.substring(9);
    }
  }

  getCsrfToken() {
    this.http.get<any>('/api/csrf').subscribe({
      next: result => {
        localStorage.setItem('ctn', result.csrfToken);
      },
      error: error => { }
    });
  }

  isAuthenticated(): number {
    if (this.cookieService.get('oema')) {
      return +this.cookieService.get('oema')!.charAt(8); /* ;) */
    } else {
      return 0;
    }
  }

  login(communitiesGroup: string, email: string, password: string, keepalive: boolean) {
    return this.http.post<AuthMsg>(`${this.authRoute}/login?group=${communitiesGroup}`, { email, password, keepalive });
  }

  register(communitiesGroup: string, email: string, password: string) {
    return this.http.post<AuthMsg>(`${this.authRoute}/register?group=${communitiesGroup}`, { email, password });
  }

  getOidcUserInfo(communitiesGroup: string) {
    return this.http.get<AuthMsg>(`${this.authRoute}/oidc/userinfo?group=${communitiesGroup}`);
  }

  activate(token: string) {
    return this.http.get<AuthMsg>(`${this.authRoute}/activate/${token}`);
  }

  sendPasswordResetEmail(communitiesGroup: string, email: string) {
    return this.http.post<AuthMsg>(`${this.authRoute}/passwd?group=${communitiesGroup}`, { email });
  }

  sendAccountRecoveryEmail(communitiesGroup: string, email: string, newEmail: string) {
    return this.http.post<AuthMsg>(`${this.authRoute}/oidc/recover?group=${communitiesGroup}`, { email, newEmail });
  }

  createNewOidcAccount(email: string,) {
    return this.http.post<AuthMsg>(`${this.authRoute}/oidc/create`, { email });
  }

  changeOidcAccountEmail(token: string) {
    return this.http.put<AuthMsg>(`${this.authRoute}/oidc/recover/${token}`, {});
  }

  resetPassword(token: string, password: string) {
    return this.http.post<AuthMsg>(`${this.authRoute}/passwd/${token}`, { password });
  }

  profile(communitiesGroup: string) {
    return this.http.get<User>(`${this.authRoute}/profile?group=${communitiesGroup}`);
  }

  logout() {
    return this.http.delete<AuthMsg>(`${this.authRoute}/logout`);
  }

  canSubmitForms(communitiesGroup: string, applicant?: string) {
    return this.http.get<AuthMsg>(`${this.authRoute}/cansubmitforms?group=${communitiesGroup}${applicant ? '&user=' + applicant : ''}`);
  }

  openCloseSubmission(communitiesGroup: string, state: number, userId?: string, usermail?: string) {
    return this.http.put<AuthMsg>(`${this.authRoute}/openclosesubmission?group=${communitiesGroup}${userId ? '&user=' + userId : ''}${usermail ? '&usermail=' + usermail : ''}`, { state });
  }

  getLatecomers(communitiesGroup: string) {
    return this.http.get<User[]>(`${this.authRoute}/latecomers?group=${communitiesGroup}`);
  }

  removeLatecomers(communitiesGroup: string, userIds: string) {
    return this.http.delete<any>(`${this.authRoute}/latecomers?group=${communitiesGroup}&ids=${userIds}`);
  }
}
