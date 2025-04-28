import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanDeactivateFn, RouterModule, RouterStateSnapshot, Routes, UrlTree } from '@angular/router';

import { SpotlightComponent } from './spotlight/spotlight.component';
import { CommunitiesComponent } from './communities/communities.component';
import { ExpertsComponent } from './experts/experts.component';
import { UsersComponent } from './users/users.component';
import { UserProfileComponent } from '../application/user-profile/user-profile.component';
import { CreateUserAccountComponent } from '../dashboard/create-user-account/create-user-account.component';
import { FormsComponent } from './forms/forms.component';
import { SubmissionsComponent } from './submissions/submissions.component';
import { NewApplicantsComponent } from './new-applicants/new-applicants.component';
import { JuryComponent } from './jury/jury.component';
import { ReviewArchiveComponent } from './review-archive/review-archive.component';
import { SettingsComponent } from './settings/settings.component';
import { AppFormReviewComponent } from './app-form-review/app-form-review.component';
import { FormTemplateWizardComponent } from './form-template-wizard/form-template-wizard.component';

import { DashboardGuard } from '../common/ng-services/dashboard-guard.service';
import { CanComponentDeactivate, CanDeactivateGuard } from '../common/ng-services/can-deactivate-guard.service';
import { Observable } from 'rxjs';

const dashboardGuard: CanActivateChildFn = (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree =>
  inject(DashboardGuard).canActivateChild(childRoute, state);
const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component: CanComponentDeactivate,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot,
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree =>
  inject(CanDeactivateGuard).canDeactivate(component, currentRoute, currentState, nextState);

const dashboardRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Dashboard'
    },
    canActivateChild: [dashboardGuard],
    children: [
      {
        path: '',
        component: SpotlightComponent,
        data: {
          title: 'Dashboard'
        }
      },
      {
        path: 'communities',
        component: CommunitiesComponent,
        data: {
          title: 'Communities'
        }
      },
      {
        path: 'communities/template/edit/:formType/:communityId',
        component: FormTemplateWizardComponent,
        data: {
          title: 'Edit form template'
        },
        canDeactivate: [canDeactivateGuard]
      },
      {
        path: 'experts',
        component: ExpertsComponent,
        data: {
          title: 'Experts'
        }
      },
      {
        path: 'users',
        component: UsersComponent,
        data: {
          title: 'Users'
        }
      },
      {
        path: 'users/user-profile/:id',
        component: UserProfileComponent,
        data: {
          title: 'Edit user profile'
        }
      },
      {
        path: 'users/create-account',
        component: CreateUserAccountComponent,
        data: {
          title: 'Create a user'
        }
      },
      {
        path: 'candidates',
        component: FormsComponent,
        data: {
          title: 'Candidates'
        }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: {
          title: 'Settings'
        }
      },
      {
        path: 'submissions',
        component: SubmissionsComponent,
        data: {
          title: 'Submissions'
        }
      },
      {
        path: 'reviews',
        component: NewApplicantsComponent,
        data: {
          title: 'Reviews'
        }
      },
      {
        path: 'assigned-reviews/:communityFlag',
        component: NewApplicantsComponent,
        data: {
          title: 'Reviews'
        }
      },
      {
        path: 'reviewers',
        component: JuryComponent,
        data: {
          title: 'Reviewers'
        }
      },
      {
        path: 'archive',
        component: ReviewArchiveComponent,
        data: {
          title: 'Archive'
        }
      },
      {
        path: 'archive/review/:formId/:communityId',
        component: AppFormReviewComponent,
        data: {
          title: 'Viewing a review'
        }
      },

      {
        path: 'senior-submissions',
        component: SubmissionsComponent,
        data: {
          title: 'Submissions'
        }
      },
      {
        path: 'senior-reviews',
        component: NewApplicantsComponent,
        data: {
          title: 'Reviews'
        }
      },
      {
        path: 'senior-reviewers',
        component: JuryComponent,
        data: {
          title: 'Reviewers'
        }
      },
      {
        path: 'senior-archive',
        component: ReviewArchiveComponent,
        data: {
          title: 'Archive'
        }
      },
      {
        path: 'senior-archive/review/:formId/:communityId',
        component: AppFormReviewComponent,
        data: {
          title: 'Viewing a review'
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(dashboardRoutes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
