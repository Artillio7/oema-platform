import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Observable, OperatorFunction, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

import { UserService } from '../../ng-services/user.service';

@Component({
  selector: 'app-user-search-by-email-name',
  templateUrl: './user-search-by-email-name.component.html',
  styleUrls: ['./user-search-by-email-name.component.scss']
})
export class UserSearchByEmailNameComponent {
  @Input() description = '';
  @Input() buttonTitle = 'Add user';
  @Input() myRole = 'Applicant';
  @Output() userFound = new EventEmitter<any>();
  enteredEmail!: string;
  enteredLastname!: string;
  searching = false;
  searchFailed = false;
  foundUserId!: string;
  foundUserEmail!: string;

  constructor(private userService: UserService,) { }

  searchByEmail: OperatorFunction<string, readonly { _id: string, email: string, lastname?: string, firstname?: string }[]>
    = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => { this.searching = true; this.enteredLastname = ''; }),
        switchMap(term =>
          this.userService.search({ id: 'email', operator: 'includes', value: term === '' ? '#' : term })
            .pipe(
              tap(() => this.searchFailed = false),
              catchError(() => {
                this.searchFailed = true;
                return of([]);
              })
            )
        ),
        tap(() => this.searching = false)
      )


  formatterEmail = (x: { _id: string, email: string, lastname: string, firstname: string }) => {
    if (x) {
      this.foundUserId = x['_id'];
      this.foundUserEmail = x['email'];
      return `${x.email}${x.lastname && x.firstname ? ' (' + x.lastname + ' ' + x.firstname + ')' : ''}`;
    }
    return '';
  }

  searchByLastname: OperatorFunction<string, readonly { _id: string, email: string, lastname?: string, firstname?: string }[]>
    = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => { this.searching = true; this.enteredEmail = ''; }),
        switchMap(term =>
          this.userService.search({ id: 'lastname', operator: 'includes', value: term === '' ? '#' : term })
            .pipe(
              tap(() => this.searchFailed = false),
              catchError(() => {
                this.searchFailed = true;
                return of([]);
              })
            )
        ),
        tap(() => this.searching = false)
      )

  formatterLastname = (x: { _id: string, email: string, lastname: string, firstname: string }) => {
    if (x) {
      this.foundUserId = x['_id'];
      this.foundUserEmail = x['email'];
      return `${x.lastname} ${x.firstname || ''} (${x.email})`;
    }
    return '';
  }

  selectUser(event: any): void {
    this.userFound.emit({
      eventTarget: event.target,
      foundUserId: this.foundUserId,
      foundUserEmail: this.foundUserEmail
    });
    this.enteredEmail = '';
    this.enteredLastname = '';
  }
}
