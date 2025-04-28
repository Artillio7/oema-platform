import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CookieService } from 'ngx-cookie';

import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';

@Component({
  templateUrl: './unlock-account.component.html',
  styleUrls: ['./unlock-account.component.scss']
})
export class UnlockAccountComponent implements OnInit {
  expiredUserSession: any;
  form: FormGroup;

  constructor(
    private titleService: Title,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    public alertService: AlertService,
    private cookieService: CookieService,
    private router: Router) {
    this.titleService.setTitle('Unlock Session');

    this.form = this.formBuilder.group({
      password: ['', Validators.compose([Validators.required])],
      keepalive: [true]
    });
  }

  ngOnInit() {
    // Clear any alert before displaying the session unlock view
    this.alertService.clear();
    this.expiredUserSession = this.cookieService.getObject('expired');
  }

  get password() {
    return this.form.get('password') as FormControl;
  }

  get keepalive() {
    return this.form.get('keepalive') as FormControl;
  }

  onSubmit() {
    this.alertService.clear();

    if (this.form.valid) {
      this.authService.login(this.router.url.split('/')[1], this.expiredUserSession.email, this.password.value, this.keepalive.value)
        .subscribe({
          next: resp => {
            if (resp.success) {
              const messageParts = resp.message.split(' ');
              this.cookieService.remove('expired');
              this.cookieService.put('oemaEmail', this.expiredUserSession.email, { secure: true, sameSite: 'strict' });
              if (messageParts[0] === 'Applicant') {
                this.cookieService.put('oema', this.authService.hashGen('Applicant'), { secure: true, sameSite: 'strict' });

              } else if (messageParts[0] === 'Reviewer') {
                this.cookieService.put('oema', this.authService.hashGen('Reviewer'), { secure: true, sameSite: 'strict' });

              } else if (messageParts[0] === 'Referent') {
                this.cookieService.put('oema', this.authService.hashGen('Referent'), { secure: true, sameSite: 'strict' });

              } else {
                this.cookieService.put('oema', this.authService.hashGen('Admin'), { secure: true, sameSite: 'strict' });
              }

              // Redirect the user come back to its url
              if (!this.expiredUserSession.redirect.endsWith('/auth/unlock')) {
                this.router.navigate([this.expiredUserSession.redirect || '']);
              } else {
                this.router.navigate(['']);
              }
            }
          },
          error: error => {
            this.alertService.danger(error);
          }
      });
    }
  }


  logout() {
    if (!this.cookieService.get('privacyPolicy')) {
      this.cookieService.removeAll();
    } else {
      this.cookieService.removeAll();
      this.cookieService.put('privacyPolicy', '1', { secure: true, sameSite: 'strict' });
    }

    localStorage.clear();
    this.authService.getCsrfToken();

    this.router.navigate([`${this.router.url.split('/')[1]}/auth/login`]);
  }
}
