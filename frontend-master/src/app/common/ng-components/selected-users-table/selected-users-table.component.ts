import { Component, Input, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';

import { DataTableDirective } from 'angular-datatables';

import { User } from '../../ng-models/user';

@Component({
  selector: 'app-selected-users-table',
  templateUrl: './selected-users-table.component.html'
})
export class SelectedUsersTableComponent implements OnDestroy {
  @Input() users: User[] | null = [];
  @Input() tableReady = false;
  @Input() dtTrigger!: Subject<any>;
  @Input() dtOptions: any = {};

  @ViewChild(DataTableDirective)
  datatableElement!: DataTableDirective;

  ngOnDestroy() {
    if (this.datatableElement.dtInstance) {
      this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy(true);
      });
    }
  }

  formatEntity(entity?: string): string {
    if (!entity) {
      return '';
    }

    const depts = entity.split('/');
    if (depts.length > 4 && entity.length > 37) {
      return depts[0] + '/' + depts[1] + '/' + depts[2] + '/' + depts[3] + '/...';
    } else if (depts.length === 1 && entity.length > 37) {
      return  entity.substring(0, 37) + '...';
    } else {
      return entity;
    }
  }

  formatClassification(classification?: string): string {
    if (!classification) {
      return '';
    }

    const classifications = ['I.3', 'II.1', 'II.2', 'II.3', 'III.1', 'III.2', 'III.3', 'IV.1', 'IV.2', 'IV.3', 'IV.4', 'IV.5', 'IV.6', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'NA'];
    if (classifications.includes(classification)) {
      return classification;
    } else {
      return 'NA';
    }
  }
}
