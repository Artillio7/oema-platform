import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';

@Component({
  templateUrl: './password-change.component.html',
  styles: [`
    .form-group .input-group .input-group-addon {
      width:36px;
    }
    .form-group .input-group .input-group-addon i {
      margin: 0 auto;
    }
  `],
  providers: [FormValidationService]
})
export class PasswordChangeComponent {
  form: FormGroup;
  urlPrefix: string;

  constructor(
    private titleService: Title,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public alertService: AlertService) {

    this.urlPrefix = this.router.url.split('/')[1];
    this.titleService.setTitle('Change Password');

    this.form = this.formBuilder.group({
      password: ['', Validators.compose([Validators.required, this.formValidationService.passwordValidator])],
      confirmPassword: ['', Validators.required]
    }, { validators: this.formValidationService.matchingPasswords('password', 'confirmPassword') });
  }

  onSubmit() {
    if (this.form.valid) {
      const token = this.route.snapshot.params['token'];
      this.authService.resetPassword(token, this.password.value).subscribe({
        next: result => {
          if (result.success) {
            this.form.reset();
            this.alertService.success('Your password has been modified successfully.');
          }
        },
        error: error => {
          this.alertService.danger(error);
        }
      });
    }
  }

  get password() {
    return this.form.get('password') as FormControl;
  }

  get confirmPassword() {
    return this.form.get('confirmPassword') as FormControl;
  }
}
