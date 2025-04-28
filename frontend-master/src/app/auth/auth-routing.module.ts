import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, RouterModule, RouterStateSnapshot, Routes, UrlTree } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AccountActivationComponent } from './account-activation/account-activation.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { PasswordChangeComponent } from './password-change/password-change.component';
import { UnlockAccountComponent } from './unlock-account/unlock-account.component';
import { AccountRecoveryComponent } from './account-recovery/account-recovery.component';
import { EmailChangeComponent } from './email-change/email-change.component';

import { AuthGuard } from '../common/ng-services/auth-guard.service';
import { Observable } from 'rxjs';

const authGuard: CanActivateChildFn = (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree =>
  inject(AuthGuard).canActivateChild(childRoute, state);

const authRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Authentication'
    },
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        component: LoginComponent,
        data: {
          title: 'Login page'
        }
      },
      {
        path: 'register',
        component: RegisterComponent,
        data: {
          title: 'Register page'
        }
      },
      {
        path: 'activate/:token',
        component: AccountActivationComponent,
        data: {
          title: 'Activate account'
        }
      },
      {
        path: 'reset-password',
        component: PasswordResetComponent,
        data: {
          title: 'Reset password'
        }
      },
      {
        path: 'change-password/:token',
        component: PasswordChangeComponent,
        data: {
          title: 'Change password'
        }
      },
      {
        path: 'unlock',
        component: UnlockAccountComponent,
        data: {
          title: 'Unlock account'
        }
      },
      {
        path: 'account-recovery',
        component: AccountRecoveryComponent,
        data: {
          title: 'Account recovery'
        }
      },
      {
        path: 'change-email/:token',
        component: EmailChangeComponent,
        data: {
          title: 'Change account email'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(authRoutes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
