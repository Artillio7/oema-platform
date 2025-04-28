import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanDeactivateFn, RouterModule, RouterStateSnapshot, Routes, UrlTree } from '@angular/router';

import { WelcomeComponent } from './welcome/welcome.component';
import { BeforeStartingComponent } from './before-starting/before-starting.component';
import { FormWizardComponent } from './form-wizard/form-wizard.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AppFormHistoryComponent } from './app-form-history/app-form-history.component';

import { ApplicationGuard } from '../common/ng-services/application-guard.service';
import { CanComponentDeactivate, CanDeactivateGuard } from '../common/ng-services/can-deactivate-guard.service';
import { BeforeFormResolver } from './ng-services/before-form-resolver.service';
import { FormWizardResolver } from './ng-services/form-wizard-resolver.service';
import { Observable } from 'rxjs';

const appGuard: CanActivateChildFn = (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree =>
  inject(ApplicationGuard).canActivateChild(childRoute, state)
const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component: CanComponentDeactivate,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot,
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree =>
  inject(CanDeactivateGuard).canDeactivate(component, currentRoute, currentState, nextState);

/* Valid values for :formType are new, renew, new-senior or renew-senior */
const applicationRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Application'
    },
    canActivateChild: [appGuard],
    children: [
      {
        path: '',
        component: WelcomeComponent,
        data: {
          title: 'Application'
        }
      },
      {
        path: 'before',
        component: BeforeStartingComponent,
        data: {
          title: 'Get ready'
        },
        resolve: {
          userProfile: BeforeFormResolver
        }
      },
      {
        path: 'form',
        component: FormWizardComponent,
        data: {
          title: 'Form'
        },
        canDeactivate: [canDeactivateGuard],
        resolve: {
          userProfile: FormWizardResolver
        }
      },
      {
        path: 'form/edit/:formId/:communityId/:formType',
        component: FormWizardComponent,
        data: {
          title: 'Edit form'
        },
        canDeactivate: [canDeactivateGuard],
        resolve: {
          userProfile: FormWizardResolver
        }
      },
      {
        path: 'user-profile',
        component: UserProfileComponent,
        data: {
          title: 'Edit my profile'
        }
      },
      {
        path: 'appform/:formId/:communityId',
        component: AppFormHistoryComponent,
        data: {
          title: 'History'
        }
      },
      {
        path: 'appform/:formId/:communityId/:formType',
        component: AppFormHistoryComponent,
        data: {
          title: 'History'
        }
      },
      {
        path: 'thephantomroute/:token/:formId/:communityId',
        component: AppFormHistoryComponent,
        data: {
          title: 'PDF export'
        }
      },
      {
        path: 'thephantomroute/:token/:formId/:communityId/:formType',
        component: AppFormHistoryComponent,
        data: {
          title: 'PDF export'
        }
      }
      /** route parameter :formType is optional for AppFormHistoryComponent **/
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(applicationRoutes)],
  exports: [RouterModule]
})
export class ApplicationRoutingModule { }
