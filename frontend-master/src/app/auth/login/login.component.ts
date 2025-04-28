import { Component, ElementRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie';

import { AuthMsg, AuthService } from '../../common/ng-services/auth.service';
import { UserService } from '../../common/ng-services/user.service';
import { AlertService } from '../../common/ng-services/alert';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';


@Component({
  templateUrl: './login.component.html',
  styles: [`
    .input-group .input-group-addon {
      width:36px;
    }
    .input-group .input-group-addon i {
      margin: 0 auto;
    }
  `]
})
export class LoginComponent {
  credentials = { email: '', password: '', keepalive: false };
  modalWindow!: NgbModalRef;

  urlPrefix: string;
  modifiedUrlPrefix: string; // to handle the senior-orange-experts url...
  appDomain: Domain;
  redirectUrl!: string; /* redirect url after successful login */
  userId!: string;
  userRole!: string;

  @ViewChild('privacyPolicy') private privacyPolicy!: ElementRef;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private cookieService: CookieService,
    private authService: AuthService,
    private userService: UserService,
    public alertService: AlertService,
    private router: Router,
    private modalService: NgbModal) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.modifiedUrlPrefix = this.urlPrefix === this.appConfig.settings!.domains[3] ?
      this.appConfig.settings!.domains[0] : this.urlPrefix;
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle('Login to OEMA');
  }

  acceptPrivacyPolicy() {
    this.modalWindow.close('I accept');

    // Save acceptance of policy in the db
    this.userService.hasAcceptedPolicy(this.userId).subscribe({
      next: user => {
        this.setCookies();
      },
      error: err => {
        this.alertService.danger(err);
        this.cookieService.removeAll();
      }
    });
  }

  declinePrivacyPolicy() {
    window.location.href = 'https://www.orange.com';
    this.cookieService.removeAll();
  }

  signInWithOrangeConnect() {
    this.cookieService.put('oemaUri', this.urlPrefix, { secure: true, sameSite: 'none' });
  }

  login() {
    this.authService.login(this.urlPrefix, this.credentials.email.toLowerCase(), this.credentials.password, this.credentials.keepalive)
      .subscribe({
        next: result => {
          this.setUpAfterLogin(result);
        },
        error: error => {
          this.alertService.danger(error);
        }
    });
  }

  setUpAfterLogin(result: AuthMsg) {
    if (result.success) {
      document.querySelector('body')!.classList.add('aside-menu-hidden');

      this.userId = result.id;
      // Get the redirect URL from our auth service
      // If no redirect has been set, use the default

      const messageParts = result.message.split(' ');

      switch(messageParts[0]) {
        case 'Applicant':
          this.userRole = this.authService.hashGen('Applicant');
          this.redirectUrl = this.authService.redirectUrl && !this.authService.redirectUrl.includes('/dashboard') ?
            this.authService.redirectUrl : '/' + this.urlPrefix + '/application';
          break;
        case 'Reviewer':
          this.userRole = this.authService.hashGen('Reviewer');
          this.redirectUrl = this.authService.redirectUrl
            && (this.authService.redirectUrl.includes('/application')
              || this.authService.redirectUrl.includes('/dashboard/assigned-reviews'))
            ? this.authService.redirectUrl : '/' + this.modifiedUrlPrefix + '/application';
          break;
        case 'Referent':
          this.userRole = this.authService.hashGen('Referent');
          this.redirectUrl =
            this.authService.redirectUrl ? this.authService.redirectUrl : '/' + this.modifiedUrlPrefix + '/dashboard';
          break;
        case 'Admin':
          this.userRole = this.authService.hashGen('Admin');
          this.redirectUrl =
            this.authService.redirectUrl ? this.authService.redirectUrl : '/' + this.modifiedUrlPrefix + '/dashboard';
          break;
        default:
          this.alertService.danger('Not authorized!');
          return;
      }

      if (this.cookieService.get('redirect')) {
        this.redirectUrl = this.cookieService.get('redirect')!;
        this.cookieService.remove('redirect');
      }

      // Check if the user has accepted our privacy policy ?
      if (!result.policy) {
        this.modalWindow =
          this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
      } else {
        this.setCookies();
      }


      // Reset the redirectUrl
      this.authService.redirectUrl = '';
    }
  }

  setCookies() {
    // Set some cookies
    this.cookieService.put('oemaEmail', this.credentials.email.toLowerCase(), { secure: true, sameSite: 'strict' });
    this.cookieService.put('oema', this.userRole, { secure: true, sameSite: 'strict' });
    this.cookieService.put('oemaUri', this.redirectUrl.split('/')[1], { secure: true, sameSite: 'strict' });
    this.cookieService.put('privacyPolicy', '1', { secure: true, sameSite: 'strict' });
    // Redirect the user
    this.router.navigate([this.redirectUrl]);
  }
}
