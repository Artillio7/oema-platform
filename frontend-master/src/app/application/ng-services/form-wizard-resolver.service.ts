/* Route resolver for /application/form
 * Delay rendering the routed FormWizardComponent until all necessary data have been fetched
 * Before activating the route /application/form:
 * If the user has a pending form application with status === "preparing" or "writing", then display the route
 * Else display the route /application to let the user selects a community and a form type.
 */

import { inject } from '@angular/core';
import { ResolveFn, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

import { UserProfileService } from '../../common/ng-services/user-profile.service';

export const FormWizardResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  userProfileService: UserProfileService = inject(UserProfileService)
  ): Observable<any> => {
    if (route.params['formId']) {
      return of({user: userProfileService.user});

    /*} else if (!this.userProfileService.profileLoaded) {
      return this.userProfileService.hasPendingForm(state.url.split('/')[1]);
    } else {
      if (this.userProfileService.pendingCommunity === '') {
        this.router.navigate(['/' + state.url.split('/')[1] + '/application']);
        return of({});
      } else {
        return of({
          user: this.userProfileService.user,
          pendingCommunity: this.userProfileService.pendingCommunity,
          pendingFormType: this.userProfileService.pendingFormType
        });
      }
    }*/
    } else {
      return userProfileService.hasPendingForm(state.url.split('/')[1]);
    }
  }
