import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PlatformLocation } from '@angular/common';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie';

import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';


@Component({
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [FormValidationService]
})
export class RegisterComponent implements AfterViewInit {
  registerForm: FormGroup;
  successfulRegistration = false;
  modalWindow!: NgbModalRef;

  urlPrefix: string;
  appDomain: Domain;

  @ViewChild('privacyPolicy') private privacyPolicy!: ElementRef;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private router: Router,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private cookieService: CookieService,
    private formValidationService: FormValidationService,
    private authService: AuthService,
    private alertService: AlertService,
    private location: PlatformLocation) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle('Register to OEMA');

    this.registerForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, this.formValidationService.excludeExternEmailValidator])],
      password: ['', Validators.compose([Validators.required, this.formValidationService.passwordValidator])],
      confirmPassword: ['', Validators.required]
    }, { validators: this.formValidationService.matchingPasswords('password', 'confirmPassword') });

    this.location.onPopState(() => {
      this.modalWindow.close('back');
    });
  }

  ngAfterViewInit(): void {
    if (!this.cookieService.get('privacyPolicy')) {
      setTimeout(() => {
        this.modalWindow =
          this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
      }, 1000);
    }
  }

  get email() {
    return this.registerForm.get('email') as FormControl;
  }

  get password() {
    return this.registerForm.get('password') as FormControl;
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword') as FormControl;
  }

  acceptPrivacyPolicy() {
    this.modalWindow.close('I accept');
    this.cookieService.put('privacyPolicy', '1', { secure: true, sameSite: 'strict' });
  }

  declinePrivacyPolicy() {
    this.cookieService.remove('privacyPolicy');
    window.location.href = 'https://www.orange.com';
  }

  openPrivacyPolicy() {
    this.modalWindow = this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
  }

  signInWithOrangeConnect() {
    this.cookieService.put('oemaUri', this.urlPrefix, { secure: true, sameSite: 'none' });
  }

  onSubmit() {
    this.alertService.clear();
    this.successfulRegistration = false;

    if (this.registerForm.valid) {
      this.authService.register(this.urlPrefix, this.email.value.toLowerCase(), this.password.value).subscribe({
        next: result => {
          if (result.success) {
            this.registerForm.reset();
            this.alertService.success('Great! We have just sent you an email: please read it to activate your account.');
            this.successfulRegistration = true;
          }
        },
        error: error => {
          this.alertService.danger(error);
        }
      });
    }
  }

  closeNotification() {
    this.alertService.clear();
    if (this.successfulRegistration) {
      this.router.navigate([`/${this.urlPrefix}/auth/login`]);
    }
  }
}
