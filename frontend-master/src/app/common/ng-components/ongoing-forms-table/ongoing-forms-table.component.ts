import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';

import { DataTableDirective } from 'angular-datatables';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { saveAs } from 'file-saver';

import { MailComposeComponent } from '../modal-mail-compose/mail-compose.component';

import { FormService } from '../../ng-services/form.service';
import { ReviewService } from '../../ng-services/review.service';

import { AppForm } from '../../ng-models/form';

@Component({
  selector: 'app-ongoing-forms-table',
  templateUrl: './ongoing-forms-table.component.html'
})
export class OngoingFormsTableComponent implements OnInit, OnDestroy {
  @Input() urlPrefix = '';
  //@Input() myCommunityId: string = '';
  @Input() myEmail = '';
  @Input() isSeniorApp = false;
  @Input() forms: AppForm[] | null = [];
  @Input() tableReady = false;
  @Input() dtTrigger!: Subject<any>;
  @Output() appMenuSelected = new EventEmitter<any>();

  @ViewChild(DataTableDirective)
  datatableElement!: DataTableDirective;
  dtOptions: any = {};

  constructor(
    private modalService: NgbModal,
    private formService: FormService,
    private reviewService: ReviewService
  ) { }

  ngOnInit() {
    $.extend($.fn['dataTable'].ext.oSort, {

      'non-empty-string-asc': function (s1: string, s2: string) {
        const tmp = document.createElement('div');
        tmp.innerHTML = s1;
        const str1 = tmp.textContent || tmp.innerText || '';
        tmp.innerHTML = s2;
        const str2 = tmp.textContent || tmp.innerText || '';

        if (!str1.replace(/\s/g, '').length) {
          return 1;
        }
        if (!str2.replace(/\s/g, '').length) {
          return -1;
        }
        return ((str1 < str2) ? -1 : ((str1 > str2) ? 1 : 0));
      },

      'non-empty-string-desc': function (s1: string, s2: string) {
        const tmp = document.createElement('div');
        tmp.innerHTML = s1;
        const str1 = tmp.textContent || tmp.innerText || '';
        tmp.innerHTML = s2;
        const str2 = tmp.textContent || tmp.innerText || '';

        if (!str1.replace(/\s/g, '').length) {
          return 1;
        }
        if (!str2.replace(/\s/g, '').length) {
          return -1;
        }
        return ((str1 < str2) ? 1 : ((str1 > str2) ? -1 : 0));
      }
    });

    this.dtOptions = {
      orderClasses: false,
      deferRender: true,
      columnDefs: [
        {
          orderable: false,
          className: 'control',
          targets: 0
        },
        {
          orderable: false,
          className: 'select-checkbox',
          targets: 1
        },
        { orderable: false, targets: -1 },
        { type: 'non-empty-string', targets: [2, 3] },
        { visible: false, targets: [5] },
        { responsivePriority: 1, targets: 2 },
        { responsivePriority: 2, targets: -1 },
        { responsivePriority: 3, targets: -2 },
        { responsivePriority: 4, targets: -3 }
      ],
      select: {
        style: 'os',
        selector: 'td.row-selector',
        blurable: true
      },
      paging: true,
      pageLength: 25,
      lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
      order: [[2, 'asc']],
      stateSave: true,
      responsive: {
        details: {
          type: 'column'
        }
      },
      drawCallback: function (_settings: DataTables.Settings) {
        const api = this.api();

        api.columns.adjust()
          .responsive.recalc();
      },
      // Declare the use of the extension in the dom parameter
      dom: 'lBftipr',
      // Configure the buttons
      buttons: [
        {
          extend: 'collection',
          text: 'Actions',
          className: 'user-actions-button',
          buttons: [
            {
              extend: 'selected',
              text: '<i class="fa fa-envelope-o" aria-hidden="true"></i> Send an email',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const self = this;
                const recipients: string[] = [];
                dt.rows({ selected: true }).every(function (_rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  const data = this.data() as any[];
                  recipients.push(data[4]);
                });

                if (recipients.length) {
                  // display modal view for writing mail to users
                  const modalRef = self.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                  modalRef.componentInstance.recipients = recipients;
                  modalRef.componentInstance.emailFrom = self.myEmail;
                }

              }
            }
          ]
        },
        'selectAll',
        'selectNone'
      ]
    }
  }

  ngOnDestroy() {
    if (this.datatableElement.dtInstance) {
      this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy(true);
        this.dtOptions = null;
      });
    }
  }

  downloadArchive(event: any, formIdx: number) {
    event.target.disabled = true;
    const formType = this.forms![formIdx].formType;
    const email = this.forms![formIdx].email;
    this.formService.getFormArchive(this.urlPrefix, this.forms![formIdx]['_id'], this.forms![formIdx].communityId, undefined, this.isSeniorApp).subscribe({
      next: (resp: Blob) => {
        saveAs(new Blob([resp], { type: 'application/zip' }),
          `${(formType === 'new' ? 'new' : 'renewal') + (this.isSeniorApp ? '-senior' : '')}-application-${email}.zip`);
        event.target.disabled = false;
      },
      error: error => {
        this.appMenuSelected.emit({ type: 'danger', message: 'Failed to download the form archive.' });
        event.target.disabled = false;
      }
    });
  }

  addApplicationToBeReviewed(event: any, formIdx: number) {
    event.target.disabled = true;
    this.reviewService.createReview(this.forms![formIdx].communityId, this.forms![formIdx]['_id'], this.isSeniorApp).subscribe({
      next: (_resp) => {
        this.appMenuSelected.emit({
          type: 'success',
          message: `The application by ${this.forms![formIdx].email} has been successfully added to be reviewed.`
        });
        event.target.disabled = false;
      },
      error: error => {
        this.appMenuSelected.emit({ type: 'danger', message: error });
        event.target.disabled = false;
      }
    });
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
}
