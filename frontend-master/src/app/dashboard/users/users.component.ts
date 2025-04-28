import { Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { DataTableDirective } from 'angular-datatables';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { UserService } from '../../common/ng-services/user.service';
import { AlertService } from '../../common/ng-services/alert';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { WindowService } from '../../common/ng-services/window.service';
import { MailComposeComponent } from '../../common/ng-components/modal-mail-compose/mail-compose.component';

import { User } from '../../common/ng-models/user';

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [FormValidationService]
})
export class UsersComponent implements OnInit, OnDestroy {
  dtOptions: any = {};
  users: User[] | null = [];
  deletedUserIds: string[] = [];

  deleteAccountsForm!: FormGroup;
  deleteAccountsHasError = false;
  accountsDeletionModalWindow!: NgbModalRef;

  urlPrefix: string;

  collapsedTableViews = 0;

  tableReady = false;
  onResizeTimeout: any;

  excelExportBtn = 'fa-file-excel-o';

  @ViewChild(DataTableDirective) private datatableElement!: DataTableDirective;
  @ViewChild('accountDeletion') private accountDeletion!: TemplateRef<any>;

  @HostListener('document:click', ['$event'])
  public documentClick(event: Event): void {
    this.manageClicksOnDocument(event);
  }

  constructor(
    private titleService: Title,
    private modalService: NgbModal,
    private windowService: WindowService,
    private userService: UserService,
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.titleService.setTitle('User Accounts');

    this.windowService.onresize(() => {
      clearTimeout(this.onResizeTimeout);
      this.onResizeTimeout = setTimeout(() => {
        this.redrawTable();
      }, 500);
    });
  }

  ngOnInit() {
    const that = this;

    this.dtOptions = {
      orderClasses: false,
      deferRender: true,
      serverSide: true,
      processing: true,
      /*search: {
        return: true
      },*/
      ajax: (dataTablesParameters: any, callback: any) => {
        //console.log(dataTablesParameters);
        const order = dataTablesParameters.order[0].dir === 'asc' ? 1 : -1;
        let sort = 'created';
        if (dataTablesParameters.order[0].column === 1) {
          sort = 'lastname';
        } else if (dataTablesParameters.order[0].column === 2) {
          sort = 'firstname';
        }

        that.userService.listUsers({skip: dataTablesParameters.start, limit: dataTablesParameters.length},
          { sort }, { order }, {searchValue: dataTablesParameters.search.value}).subscribe({
          next: resp => {
            that.users = resp.users;

            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.users,
            });

            that.collapsedTableViews = 0;

            that.tableReady = true;
          },
          error: error => {
            that.alertService.danger(error);
            if (that.users?.length === 0) {
              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: 0,
              });
            }
            that.tableReady = true;
          }
        });
      },
      columnDefs: [
        {
          orderable: false,
          data: null,
          defaultContent: '',
          className: 'select-checkbox row-selector',
          targets: 0
        },
        { className: 'username expandable', targets: [1, 2] },
        { data: ( row: any, _type: any, _val: any, _meta: any ) => {
          if (row.role?.admin ?? 0 > 0) {
            return `<span class="is-admin">${row.lastname?.toUpperCase() ?? ''}</span>`;
          } else if (row.role?.referent ?? 0 > 0) {
            return `<span class="is-referent">${row.lastname?.toUpperCase() ?? ''}</span>`;
          } else if (row.role?.reviewer ?? 0 > 0) {
            return `<span class="is-reviewer">${row.lastname?.toUpperCase() ?? ''}</span>`;
          } else {
            return row.lastname?.toUpperCase() ?? '';
          }
        }, targets: 1 },
        {
          data: ( row: any, _type: any, _val: any, _meta: any ) => {
            const userLastname = row.firstname?.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) ?? '';
            if (row.role?.admin ?? 0 > 0) {
              return `<span class="is-admin">${userLastname}</span>`;
            } else if (row.role?.referent ?? 0 > 0) {
              return `<span class="is-referent">${userLastname}</span>`;
            } else if (row.role?.reviewer ?? 0 > 0) {
              return `<span class="is-reviewer">${userLastname}</span>`;
            } else {
              return userLastname;
            }
          },
          targets: 2
        },
        { data: ( row: any, _type: any, _val: any, _meta: any ) => row.gender?.charAt(0) ?? '', orderable: false, className: 'text-center', targets: 3 },
        { data: 'birthday', defaultContent: '', orderable: false, targets: 4 },
        {
          data: ( row: any, _type: any, _val: any, _meta: any ) => {
            const classification = row.classification || '';
            const classifications = ['I.3', 'II.1', 'II.2', 'II.3', 'III.1', 'III.2', 'III.3', 'IV.1', 'IV.2', 'IV.3', 'IV.4', 'IV.5', 'IV.6', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'NA'];
            if (classifications.includes(classification)) {
              return classification;
            } else {
              return classification ? 'NA' : '';
            }
          },
          defaultContent: '',
          className: 'text-center',
          orderable: false,
          targets: 5
        },
        {
          data: ( row: any, _type: any, _val: any, _meta: any ) => {
            if (row.entity) {
              let entity = row.entity;
              const depts = entity.split('/');
              if (depts.length > 4 && entity.length > 37) {
                entity = depts[0] + '/' + depts[1] + '/' + depts[2] + '/' + depts[3] + '/...';
              } else if (depts.length === 1 && entity.length > 37) {
                entity = entity.substring(0, 37) + '...';
              }

              return `<a href="${ row.directoryUrl || '' }" target="_blank" class="hint">${entity}<span class="hint-text hint-left" style="right: 100%;">${row.entity}</span></a>`;
            } else {
              return '';
            }
          },
          defaultContent: '',
          orderable: false,
          className: 'user-entity',
          targets: 6 },
        {
          data: ( row: any, _type: any, _val: any, _meta: any ) => row.location?.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) ?? '',
          orderable: false,
          targets: 7 },
        { data: 'country', defaultContent: '', orderable: false, targets: 8 },
        { data: ( row: any, _type: any, _val: any, _meta: any ) => row.cuid?.toLowerCase() ?? '', orderable: false, targets: 9 },
        { data: 'email', orderable: false, targets: 10 },
        { data: 'phone', defaultContent: '', orderable: false, targets: 11 },
        {
          data: ( row: any, _type: any, _val: any, _meta: any ) =>
            (row.managerFirstname?.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) || '')
            + ' ' + (row.managerLastname?.toUpperCase() || ''),
          orderable: false,
          targets: 12
        },
        { data: 'managerEmail', orderable: false, defaultContent: '', targets: 13 },
        {
          data: ( row: any, _type: any, _val: any, _meta: any ) =>
            (row.hrFirstname?.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) || '')
            + ' ' +  (row.hrLastname?.toUpperCase() || ''),
          orderable: false,
          targets: 14
        },
        { data: 'hrEmail', orderable: false, defaultContent: '', targets: 15 },
        { data: ( row: any, _type: any, _val: any, _meta: any ) => row.createdAt.substr(0, 16).replace('T', ' '), targets: 16 }
      ],
      select: {
        style: 'os',
        selector: 'td.row-selector',
        blurable: true
      },
      paging: true,
      pageLength: 25,
      lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
      order: [[1, 'asc']],
      stateSave: true,
      scrollX: true,
      fixedColumns: {
        leftColumns: 3,
        //rightColumns: 1,
        heightMatch: 'none'
      },
      initComplete: function (_settings: DataTables.Settings, _json: any) {
        const api = this.api();

        const el = document.createElement('a'),
          mStyle = el.style;
        mStyle.cssText = 'position:sticky;position:-webkit-sticky;position:-ms-sticky;';
        const positionStickySupport = mStyle.position.indexOf('sticky') !== -1;

        /*api.on('order.dt', function () {
          api.rows().every(function (rowIdx: number, tableLoop: number, rowLoop: number) {
            if (this.child.isShown()) {
              setTimeout(function () {
                const collapseHeight = $('td.details-' + rowIdx).outerHeight(true)!;
                $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! + collapseHeight);
                const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! + collapseHeight;
                $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
                $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
                $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');
                const rightWrapperHeight = $('.DTFC_RightBodyWrapper').height()! + collapseHeight;
                $('.DTFC_RightBodyWrapper').height(rightWrapperHeight);
                $('.DTFC_RightBodyLiner').height(rightWrapperHeight);
                $('.DTFC_RightBodyLiner').css('maxHeight', rightWrapperHeight + 'px');

                $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
                  '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + rowLoop + ')'
                );
                $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + rowLoop + ')').next().height(collapseHeight);

                $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
                  '.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + rowLoop + ')'
                );
                $('.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + rowLoop + ')').next().height(collapseHeight);
              }, 0);
            }
          });
        });*/

        api.on('user-select', ( e: any, _dt: any, _type: any, _cell: any, _originalEvent: any ) => {
          // disable row checkbox when applicant panel overt
          if (that.collapsedTableViews > 0) {
            e.preventDefault();
          }
        });

        if (!positionStickySupport) {
          $('.dataTables_scrollBody').on('scroll', function () {
            if ($('.application-collapse-view').length) {
              // if ($('.application-collapse-view').length) {
              $('.application-collapse-view').each(function () {
                const topPosition = $(this).offset()!.top - $(window).scrollTop()!;
                const leftPosition = $(this).offset()!.left;
                $(this).addClass('fix-it');
                $(this).css('top', topPosition + 'px');
                $(this).css('left', leftPosition + 'px');
                $(this).css('marginLeft', '0');
              });

            }
            // $('.application-collapse-view').css("marginLeft", $(this).scrollLeft());
          });

          window.addEventListener('scroll', function () {
            $('.application-collapse-view').each(function () {
              $(this).removeClass('fix-it');
              $(this).css('top', '0');
              $(this).css('left', '15px');
              $(this).css('marginLeft', $('.dataTables_scrollBody').scrollLeft() + 'px');
            });
          });
        }
      },
      rowCallback: (row: Node, _data: any[] | Object, index: number) => {
        // Unbind first in order to avoid any duplicate handler
        // (see https://github.com/l-lin/angular-datatables/issues/87)
        $('td.username', row).off('click');
        $('td.username', row).on('click', () => {
          that.userClickedHandler(row, index);
        });
        return row;
      },
      drawCallback: function (_settings: DataTables.Settings) {
        // const api = this.api();
        setTimeout(() => {
          $('.fixed-padding').remove();

          $('.DTFC_ScrollWrapper').height($('.dataTables_scroll').height()!);

          $('.application-collapse-view').each(function () {
            const idx = $(this).parent().parent().prev().index();

            const collapseHeight = $(this).parent().outerHeight(true)!;

            // $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height() + collapseHeight);

            const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! + collapseHeight;
            $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
            $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
            $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + "px");

            const rightWrapperHeight = $('.DTFC_RightBodyWrapper').height()! + collapseHeight;
            $('.DTFC_RightBodyWrapper').height(rightWrapperHeight);
            $('.DTFC_RightBodyLiner').height(rightWrapperHeight);
            $('.DTFC_RightBodyLiner').css('maxHeight', rightWrapperHeight + "px");

            $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
              '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:eq(' + idx + ')'
            );
            $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:eq(' + idx + ')').next().height(collapseHeight);

            $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
              '.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:eq(' + idx + ')'
            );
            $('.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:eq(' + idx + ')').next().height(collapseHeight);

            $(this).css('width', ($('.oema-datatables').width()! - 50) + 'px');
          });

          // Fix CSS issue with the dropdown list hidden by the fixed columns of datatable
          $('.dropdown-toggle').on('click', () => {
            $('.dataTables_wrapper').append($('.dt-button-background'));
            $('.dataTables_wrapper').append($('.dropdown-menu'));
          });
        }, 0);
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
                const recipients: string[] = [];
                dt.rows({ selected: true }).every(function (_rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  const data = this.data() as any[];
                  // email--> console.log(data[11]);
                  recipients.push(data[11]);
                });

                if (recipients.length) {
                  // display modal view for writing mail to users
                  const modalRef = that.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                  modalRef.componentInstance.recipients = recipients;
                }

              }
            },
            {
              extend: 'selected',
              text: '<i class="fa fa-user-times" aria-hidden="true"></i> Delete account(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                //alert(dt.rows({ selected: true }).indexes().length + ' row(s) selected');
                that.deletedUserIds = [];
                dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  that.deletedUserIds.push(that.users![rowIdx]['_id']);
                });
                if (that.deletedUserIds.length) {
                  that.openAccountsDeletionModal(that.accountDeletion);
                }
              }
            }
          ]
        },
        {
          text: 'Close all sub-panels',
          className: 'close-subpanels',
          action: (_e: any, _dt: DataTables.Api, _node: JQuery, _config: any) => {
            $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
          }
        },
        'selectNone'
      ]
    }


    this.deleteAccountsForm = this.formBuilder.group({
      'confirm': ['',
        Validators.compose([Validators.required, this.formValidationService.deleteAccountConfirmationValidator('delete the account(s)')])
      ]
    });
  }

  ngOnDestroy() {
    clearTimeout(this.onResizeTimeout);
    this.windowService.onresize();

    if (this.datatableElement.dtInstance) {
      this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy(true);
        this.users = null;
        this.dtOptions = null;
      });
    }
  }

  onExcelExport(event: string) {
    if (event === 'Loading...') {
      this.excelExportBtn = 'fa-spinner fa-pulse fa-fw';
    } else if (event === 'Ending...') {
      this.excelExportBtn = 'fa-file-excel-o';
    } else {
      this.alertService.danger(event);
      this.excelExportBtn = 'fa-file-excel-o';
    }
  }

  manageClicksOnDocument(event: Event) {
    const element = event.target as Element;

    if (element.className.includes('c-hamburger')
      || element.className.includes('transition')
      || element.className.includes('fa-expand')
      || element.className.includes('fa-compress')) {
      setTimeout(() => {
        this.redrawTable();
      }, 500);
    }
  }

  redrawTable() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.columns.adjust();
      $('.application-collapse-view').each(function () {
        $(this).css('width', ($('.oema-datatables').width()! - 50) + 'px');
      });
    });
  }

  format(_row: any, rowIndex: number) {
    let appFormsListHTML = '<ul class="collapse-list">';
    let idx = 0;
    let submitDate;
    const history = this.users![rowIndex].history.map((x: any) => x);
    history.reverse();
    for (const appform of history) {
      if (appform.submittedAt) {
        const d = new Date(appform.submittedAt);
        submitDate = ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      } else {
        submitDate = '';
      }

      appFormsListHTML += `
        <li>
          <input class="collapse-open" type="checkbox" id="collapse-${rowIndex}-${idx}">
          <label class="collapse-btn" for="collapse-${rowIndex}-${idx}">
            <span>${appform.community + ' @ ' + appform.year}</span>
            <a href="/${this.urlPrefix}/application/appform/${appform.formId}/${appform.communityId}/${appform.formType}" target="_blank" role="button" class="btn btn-outline-primary"><i class="fa fa-external-link" aria-hidden="true"></i> &nbsp;View application</a>
          </label>

          <div class="collapse-panel">
            <div class="collapse-inner">
              <div class="form-content">
                <div class="left-info">
                  <div class="left-item"><strong>Community</strong></div>
                  <div class="right-item">${appform.community}</div>
                  <div class="left-item"><strong>Status</strong></div>
                  <div class="right-item">${appform.status.charAt(0).toUpperCase() + appform.status.slice(1)}</div>
                </div>
                <div class="right-info">
                  <div class="left-item"><strong>Application type</strong></div>
                  <div class="right-item">${appform.formType === 'new' ? 'New' : 'Renewal'}</div>
                  <div class="left-item"><strong>Last updated after submission</strong></div>
                  <div class="right-item">${submitDate}</div>
                 </div>
              </div>
            </div>
          </div>
        </li>`;

      idx++;
    }
    appFormsListHTML += '</ul>';

    return `
      <main class="application-collapse-view">
        <section class="app-form-history">
          <div class="section-part-header">
            <h6>
              <i class="fa fa-angle-right" aria-hidden="true"></i>
              <span>Application forms by ${!this.users![rowIndex].firstname || !this.users![rowIndex].lastname ? this.users![rowIndex].email : '<span style="text-transform: capitalize;margin-left:0;">' + this.users![rowIndex].lastname!.toUpperCase() + ' ' + this.users![rowIndex].firstname + '</span>'}</span>
            </h6>
            <a href="/${this.urlPrefix}/dashboard/users/user-profile/${this.users![rowIndex]['_id']}" target="_blank" role="button" class="btn btn-primary"><i class="fa fa-user-circle-o" aria-hidden="true"></i> &nbsp;Edit profile</a>
          </div>
          <div class="content-body">
            ${appFormsListHTML}
          </div>
        </section>
      </main>`;
  }

  userClickedHandler(tr: any, index: number): void {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      const row = dtInstance.row(tr);
      const rowData = row.data() as any[];
      const rowIndex = row.index();

      const el = document.createElement('a'),
        mStyle = el.style;
      mStyle.cssText = 'position:sticky;position:-webkit-sticky;position:-ms-sticky;';
      const positionStickySupport = mStyle.position.indexOf('sticky') !== -1;

      if (row.child.isShown()) {
        // This row is already open - close it
        // const collapseHeight = $(tr).next().height();
        const collapseHeight = $(`td.details-${rowIndex}`).outerHeight(true)!;
        row.child.hide();
        $(tr).removeClass('shown');
        $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! - collapseHeight);

        const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! - collapseHeight;
        $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');
        $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')').next().remove();

        const rightWrapperHeight = $('.DTFC_RightBodyWrapper').height()! - collapseHeight;
        $('.DTFC_RightBodyWrapper').height(rightWrapperHeight);
        $('.DTFC_RightBodyLiner').height(rightWrapperHeight);
        $('.DTFC_RightBodyLiner').css('maxHeight', rightWrapperHeight + 'px');
        $('.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')').next().remove();

        this.collapsedTableViews -= 1;

      } else {
        // Open this row
        this.collapsedTableViews += 1;

        row.child(this.format(rowData, rowIndex), 'details-' + rowIndex).show();
        $(tr).addClass('shown');

        // const collapseHeight = $(tr).next().height();
        const collapseHeight = $(`td.details-${rowIndex}`).outerHeight(true)!;

        $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! + collapseHeight);

        const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! + collapseHeight;
        $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');

        const rightWrapperHeight = $('.DTFC_RightBodyWrapper').height()! + collapseHeight;
        $('.DTFC_RightBodyWrapper').height(rightWrapperHeight);
        $('.DTFC_RightBodyLiner').height(rightWrapperHeight);
        $('.DTFC_RightBodyLiner').css('maxHeight', rightWrapperHeight + 'px');

        $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
          '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')'
        );
        $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')').next().height(collapseHeight);

        $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
          '.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')'
        );
        $('.DTFC_RightBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')').next().height(collapseHeight);

        $(`td.details-${rowIndex} .application-collapse-view`).css('width', ($('.oema-datatables').width()! - 50) + 'px');
        $(`tr.details-${rowIndex}`).css('background', '#F2F4F8');

        if (!positionStickySupport) {
          $(`td.details-${rowIndex} .application-collapse-view`).css('marginLeft', $('.dataTables_scrollBody').scrollLeft()!);
          $(`td.details-${rowIndex} .application-collapse-view`).css('top', 0);
          $(`td.details-${rowIndex} .application-collapse-view`).css('left', 15 + 'px');
        }
      }
    });
  }

  get deleteAccountsFormConfirm() {
    return this.deleteAccountsForm.get('confirm') as FormControl;
  }

  deleteSelectedUserAccounts() {
    this.deleteAccountsHasError = !this.deleteAccountsForm.valid;

    if (!this.deleteAccountsHasError) {
      // delete the account(s)
      this.userService.deleteUsers(this.deletedUserIds).subscribe({
        next: deletedUsers => {
          for (const deletedUser of deletedUsers) {
            this.users = this.users!.filter(u => u._id != deletedUser._id);
          }
          this.accountsDeletionModalWindow.close('bye bye users!');
          this.alertService.success('The selected accounts have been deleted successfully.');

          this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
            // Reload the table from the backend
            dtInstance.ajax.reload();
          });
        },
        error: error => {
          this.accountsDeletionModalWindow.close('error when deleting accounts :(');
          this.alertService.danger(error);
        }
      });
    }
  }

  openAccountsDeletionModal(content: any) {
    this.accountsDeletionModalWindow = this.modalService.open(content, { windowClass: 'modal-danger' });
  }
}
