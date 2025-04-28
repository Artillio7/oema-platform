import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // directive ngFor...
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AccountActivationComponent } from './account-activation/account-activation.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { PasswordChangeComponent } from './password-change/password-change.component';
import { UnlockAccountComponent } from './unlock-account/unlock-account.component';
import { AccountRecoveryComponent } from './account-recovery/account-recovery.component';
import { EmailChangeComponent } from './email-change/email-change.component';

import { AuthRoutingModule } from './auth-routing.module';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    AccountActivationComponent,
    PasswordResetComponent,
    PasswordChangeComponent,
    UnlockAccountComponent,
    AccountRecoveryComponent,
    EmailChangeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }
