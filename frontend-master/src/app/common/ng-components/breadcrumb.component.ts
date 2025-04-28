import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, Event } from '@angular/router';

import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumbs',
  template: `
  <ng-template ngFor let-breadcrumb [ngForOf]="breadcrumbs" let-last = last>
    <li class="breadcrumb-item"
        *ngIf="breadcrumb['label'].title && breadcrumb['url'].substring(breadcrumb['url'].length - 1) === '/' || breadcrumb['label'].title && last"
        [ngClass]="{active: last}">
      <a *ngIf="!last" [routerLink]="breadcrumb['url'] === '/' ? '/' + urlPrefix : breadcrumb['url']">{{breadcrumb['label'].title}}</a>
      <span *ngIf="last" [routerLink]="breadcrumb['url']">{{breadcrumb['label'].title}}</span>
    </li>
  </ng-template>`
})
export class BreadcrumbsComponent {
  urlPrefix: string;
  breadcrumbs!: Array<{ [key: string]: any }>;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.urlPrefix = this.router.url.split('/')[1];

    this.router.events.pipe(filter((event: Event) => event instanceof NavigationEnd)).subscribe(event => {
      this.breadcrumbs = [];
      let currentRoute: ActivatedRoute | null = this.route.root;
      let url = '';
      do {
        const childrenRoutes = currentRoute.children;
        currentRoute = null;
        childrenRoutes.forEach(cRoute => {
          if (cRoute.outlet === 'primary') {
            const routeSnapshot = cRoute.snapshot;
            url += '/' + routeSnapshot.url.map(segment => segment.path).join('/');
            if (!this.breadcrumbs.length || routeSnapshot.data['title'] !== this.breadcrumbs[this.breadcrumbs.length - 1]['label'].title) {
              if (routeSnapshot.data['title'] === 'Edit form template') {
                const urlParts = url.split('/');
                this.breadcrumbs.push({
                  label: { title: 'Communities' },
                  url: `/${urlParts[2]}/${urlParts[3]}/${urlParts[5]}/`
                });
              } else if (routeSnapshot.data['title'] === 'Edit user profile' || routeSnapshot.data['title'] === 'Create a user') {
                const urlParts = url.split('/');
                this.breadcrumbs.push({
                  label: { title: 'Users' },
                  url: `/${urlParts[2]}/${urlParts[3]}/${urlParts[5]}/`
                });
              }

              this.breadcrumbs.push({
                label: routeSnapshot.data,
                url
              });
            }
            currentRoute = cRoute;
          }
        });
      } while (currentRoute);
    });
  }
}
