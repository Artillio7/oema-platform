import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';
import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './account-recovery.component.html',
  providers: [FormValidationService]
})
export class AccountRecoveryComponent {
  form: FormGroup;
  urlPrefix: string;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private authService: AuthService,
    public alertService: AlertService) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.titleService.setTitle('Account Recovery');

    this.form = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, this.formValidationService.emailValidator])]
    });
  }

  onSubmit() {
    this.alertService.clear();

    if (this.route.snapshot.queryParams['newEmail'] && this.form.valid) {
      this.authService.sendAccountRecoveryEmail(this.urlPrefix, this.email.value.toLowerCase(), this.route.snapshot.queryParams['newEmail']).subscribe({
        next: result => {
          if (result.success) {
            this.form.reset();
            this.alertService.success('We have just sent you an email to recover your account. Please check your mail.');
          }
        },
        error: error => {
          this.alertService.danger(error);
        }
      });
    }
  }

  get email() {
    return this.form.get('email') as FormControl;
  }
}
