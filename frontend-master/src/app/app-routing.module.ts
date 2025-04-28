import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Layouts
import { FullLayoutComponent } from './layouts/full-layout.component';
import { SimpleLayoutComponent } from './layouts/simple-layout.component';
import { ComposeMessageComponent } from './common/ng-components/contact/compose-message.component';
import { HelloComponent } from './common/errors/hello.component';
import { Error401Component } from './common/errors/401.component';
import { Error403Component } from './common/errors/403.component';
import { Error404Component } from './common/errors/404.component';
// import { Error500Component } from './common/errors/500.component';

import { AuthService } from './common/ng-services/auth.service';
import { ContactService } from './common/ng-services/contact.service';
import { UserProfileService } from './common/ng-services/user-profile.service';
import { UserService } from './common/ng-services/user.service';
import { CommunityService } from './common/ng-services/community.service';
import { FormService } from './common/ng-services/form.service';
import { ReviewService } from './common/ng-services/review.service';
import { FormWizardService } from './common/ng-services/form-wizard.service';
import { FileUploadService } from './common/ng-services/file-upload.service';
import { FormValidationService } from './common/ng-services/form-validation.service';
import { WindowService } from './common/ng-services/window.service';
import { AuthGuard } from './common/ng-services/auth-guard.service';
import { ApplicationGuard } from './common/ng-services/application-guard.service';
import { DashboardGuard } from './common/ng-services/dashboard-guard.service';
import { CanDeactivateGuard } from './common/ng-services/can-deactivate-guard.service';
import { SelectivePreloadingStrategy } from './common/ng-services/selective-preloading-strategy';

export const routes: Routes = [
  { path: '', redirectTo: '/hello', pathMatch: 'full' },
  { path: 'orange-experts', redirectTo: '/orange-experts/auth/login', pathMatch: 'full' },
  { path: 'senior-orange-experts', redirectTo: '/senior-orange-experts/auth/login', pathMatch: 'full' },
  { path: 'experts-dtsi', redirectTo: '/experts-dtsi/auth/login', pathMatch: 'full' },
  { path: 'security-school', redirectTo: '/security-school/auth/login', pathMatch: 'full' },
  {
    path: '',
    component: FullLayoutComponent,
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'orange-experts/dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)/*,
        canLoad: [DashboardGuard]*/
      },
      {
        path: 'orange-experts/application',
        loadChildren: () => import('./application/application.module').then(m => m.ApplicationModule),
        data: { preload: true }/*,
        canLoad: [ApplicationGuard]*/
      },
      {
        path: 'senior-orange-experts/dashboard',
        redirectTo: 'orange-experts/dashboard'
      },
      {
        path: 'senior-orange-experts/application',
        loadChildren: () => import('./application/application.module').then(m => m.ApplicationModule),
        data: { preload: true }/*,
        canLoad: [ApplicationGuard]*/
      },
      {
        path: 'experts-dtsi/dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)/*,
        canLoad: [DashboardGuard]*/
      },
      {
        path: 'experts-dtsi/application',
        loadChildren: () => import('./application/application.module').then(m => m.ApplicationModule),
        data: { preload: true }/*,
        canLoad: [ApplicationGuard]*/
      },
      {
        path: 'security-school/dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)/*,
        canLoad: [DashboardGuard]*/
      },
      {
        path: 'security-school/application',
        loadChildren: () => import('./application/application.module').then(m => m.ApplicationModule),
        data: { preload: true }/*,
        canLoad: [ApplicationGuard]*/
      }
    ]
  },
  {
    path: 'orange-experts/auth',
    component: SimpleLayoutComponent,
    data: {
      title: 'Auth'
    },
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)/*,
    canLoad: [AuthGuard]*/
  },
  {
    path: 'senior-orange-experts/auth',
    component: SimpleLayoutComponent,
    data: {
      title: 'Auth'
    },
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)/*,
    canLoad: [AuthGuard]*/
  },
  {
    path: 'experts-dtsi/auth',
    component: SimpleLayoutComponent,
    data: {
      title: 'Auth'
    },
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)/*,
    canLoad: [AuthGuard]*/
  },
  {
    path: 'security-school/auth',
    component: SimpleLayoutComponent,
    data: {
      title: 'Auth'
    },
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)/*,
    canLoad: [AuthGuard]*/
  },
  {
    path: 'compose',
    component: ComposeMessageComponent,
    outlet: 'contact'
  },
  { path: 'hello', component: HelloComponent },
  { path: 'nothing', component: Error401Component },
  { path: 'noway', component: Error403Component },
  { path: '**', component: Error404Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: SelectivePreloadingStrategy })],
  exports: [RouterModule],
  providers: [
    AuthService,
    ContactService,
    UserProfileService,
    UserService,
    CommunityService,
    FormService,
    ReviewService,
    FormWizardService,
    FileUploadService,
    FormValidationService,
    WindowService,
    AuthGuard,
    ApplicationGuard,
    DashboardGuard,
    CanDeactivateGuard,
    SelectivePreloadingStrategy
  ]
})

export class AppRoutingModule { }
