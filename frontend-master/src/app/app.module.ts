import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieModule } from 'ngx-cookie';
import { AlertModule } from './common/ng-services/alert';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppConfig } from './app.config';

import { EnableAnchorDirective } from './common/ng-directives/enable-anchor.directive';
import { NAV_DROPDOWN_DIRECTIVES } from './common/ng-directives/nav-dropdown.directive';
import { SIDEBAR_TOGGLE_DIRECTIVES } from './common/ng-directives/sidebar.directive';
import { AsideToggleDirective } from './common/ng-directives/aside.directive';
import { BreadcrumbsComponent } from './common/ng-components/breadcrumb.component';
import { BackToTopComponent } from './common/ng-components/back-to-top/back-to-top.component';
import { ComposeMessageComponent } from './common/ng-components/contact/compose-message.component';

// Layouts
import { FullLayoutComponent } from './layouts/full-layout.component';
import { SimpleLayoutComponent } from './layouts/simple-layout.component';
import { HelloComponent } from './common/errors/hello.component';
import { Error401Component } from './common/errors/401.component';
import { Error403Component } from './common/errors/403.component';
import { Error404Component } from './common/errors/404.component';
import { Error500Component } from './common/errors/500.component';

import { httpInterceptorProviders } from './http-interceptors/index';

export function initializeApp(appConfig: AppConfig) {
  return () => appConfig.load();
}

@NgModule({
  declarations: [
    AppComponent,
    FullLayoutComponent,
    SimpleLayoutComponent,
    HelloComponent,
    Error401Component,
    Error403Component,
    Error404Component,
    Error500Component,
    EnableAnchorDirective,
    NAV_DROPDOWN_DIRECTIVES,
    SIDEBAR_TOGGLE_DIRECTIVES,
    AsideToggleDirective,
    BreadcrumbsComponent,
    BackToTopComponent,
    ComposeMessageComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: '_csrf',
      headerName: 'x-csrf-token'
    }),
    NgbModule,
    CookieModule.forRoot(),
    AlertModule,
    AppRoutingModule
  ],
  providers: [
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfig],
      multi: true
    },
    Title,
    httpInterceptorProviders
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
