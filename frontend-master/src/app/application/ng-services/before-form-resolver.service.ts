/* Route resolver for /application/before
 * Delay rendering the routed BeforeStartingComponent until all necessary data have been fetched
 * Before activating the route /application/before:
 * If the user has a pending form application with status === "preparing" or "writing", then display the routed /application/before component
 * Else display the route /application to let the user selects a community and a form type.
 */

import { inject } from '@angular/core';
import { Router, ResolveFn, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

import { UserProfileService } from '../../common/ng-services/user-profile.service';

export const BeforeFormResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  userProfileService: UserProfileService = inject(UserProfileService),
  router: Router = inject(Router)
  ): Observable<any> => {
    if (!userProfileService.profileLoaded) {
      return userProfileService.hasPendingForm(state.url.split('/')[1]);
    } else {
      if (userProfileService.pendingCommunity === '') {
        router.navigate(['/' + state.url.split('/')[1] + '/application']);
        return of({});
      } else {
        return of({
          user: userProfileService.user,
          pendingCommunity: userProfileService.pendingCommunity,
          pendingFormType: userProfileService.pendingFormType
        });
      }
    }
  }

