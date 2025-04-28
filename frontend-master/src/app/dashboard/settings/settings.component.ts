import { Component, ViewChild, OnDestroy, OnInit, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { Subject } from 'rxjs';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { SelectedUsersTableComponent } from '../../common/ng-components/selected-users-table/selected-users-table.component';
import { MailComposeComponent } from '../../common/ng-components/modal-mail-compose/mail-compose.component';

import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';
import { WindowService } from '../../common/ng-services/window.service';

import { User, FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [FormValidationService]
})
export class SettingsComponent implements OnInit, OnDestroy {
  @ViewChild(SelectedUsersTableComponent)
  private latecomersTable!: SelectedUsersTableComponent;

  myCommunityId!: string;
  myCommunity!: string;
  myRole = '';

  submissionClosed: boolean | null = null;
  closeSubmissionForm!: FormGroup;
  closeSubmissionHasError = false;
  modalWindow!: NgbModalRef;

  grantAccessNotification = { message: '', type: '' };
  grantAccessTableInfoMessage = '';

  isSeniorExpert = false;
  urlPrefix: string;
  appDomain: Domain;

  dtOptions: any = {};
  latecomers: User[] | null = [];

  collapsedTableViews = 0;

  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger: Subject<any> = new Subject();
  tableReady = false;


  @HostListener('document:click', ['$event'])
  public documentClick(event: Event): void {
    this.manageClicksOnDocument(event.target as Element);
  }

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private router: Router,
    private windowService: WindowService,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    public userProfileService: UserProfileService,
    private communityService: CommunityService,
    private authService: AuthService,
    private alertService: AlertService,
    private modalService: NgbModal) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    if (this.router.url.includes('/dashboard/senior-')) {
      this.isSeniorExpert = true;
    }
    this.titleService.setTitle('OEMA Settings');

    this.windowService.onresize(() => {
      setTimeout(() => {
        this.redrawTable();
      }, 500);
    });
  }

  ngOnInit() {
    const that = this;

    this.userProfileService.getProfile(this.getSettings);

    this.dtOptions = {
      orderClasses: false,
      deferRender: true,
      columnDefs: [
        {
          orderable: false,
          className: 'select-checkbox',
          targets: 0
        },
        { visible: false, targets: [3] }
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
        heightMatch: 'none'
      },
      initComplete: function (_settings: DataTables.Settings, _json: any) {
        const api = this.api();

        const el = document.createElement('a'),
          mStyle = el.style;
        mStyle.cssText = 'position:sticky;position:-webkit-sticky;position:-ms-sticky;';
        const positionStickySupport = mStyle.position.indexOf('sticky') !== -1;

        api.on('order.dt', function () {
          api.rows().every(function (rowIdx: number, _tableLoop: number, rowLoop: number) {
            if (this.child.isShown()) {
              setTimeout(function () {
                const collapseHeight = $('td.details-' + rowIdx).outerHeight(true)!;
                $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! + collapseHeight);
                const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! + collapseHeight;
                $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
                $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
                $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');

                $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
                  '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + rowLoop + ')'
                );
                $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + rowLoop + ')').next().height(collapseHeight);
              }, 0);
            }
          });
        });

        api.on('user-select', ( e: any, _dt: any, _type: any, _cell: any, _originalEvent: any ) => {
          // disable row checkbox when applicant panel overt
          if (that.collapsedTableViews > 0) {
            e.preventDefault();
          }
        });

        if (!positionStickySupport) {
          $('.dataTables_scrollBody').on('scroll', function () {
            if ($('.application-collapse-view').length) {
              $('.application-collapse-view').each(function () {
                const topPosition = $(this).offset()!.top - $(window).scrollTop()!;
                const leftPosition = $(this).offset()!.left;
                $(this).addClass('fix-it');
                $(this).css('top', topPosition + 'px');
                $(this).css('left', leftPosition + 'px');
                $(this).css('marginLeft', '0');
              });

            }
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
            $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');

            $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
              '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:eq(' + idx + ')'
            );
            $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:eq(' + idx + ')').next().height(collapseHeight);


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
                  recipients.push(data[5]);
                });

                if (recipients.length) {
                  // display modal view for writing mail to users
                  const modalRef = that.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                  modalRef.componentInstance.recipients = recipients;
                  modalRef.componentInstance.emailFrom = that.userProfileService.user!.email;
                }

              }
            },
            {
              extend: 'selected',
              text: '<i class="fa fa-user-times" aria-hidden="true"></i> Remove latecomer(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const userIds: string[] = [];
                dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  userIds.push(that.latecomers![rowIdx]['_id']);
                });
                // TODO
                if (userIds.length) {
                  that.authService.removeLatecomers(
                    this.urlPrefix, userIds.toString()
                  ).subscribe({
                    next: _answer => {
                      that.latecomers = that.latecomers!.filter(item => !userIds.includes(item['_id']));
                      if (userIds.length === 1) {
                        that.alertService.success('The access has been successfully removed for the selected user.');
                      } else {
                        that.alertService.success('The access has been successfully removed for the selected users.');
                      }

                      //that.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
                      // Destroy the table first
                      dt.destroy();
                      // Call the dtTrigger to rerender again
                      that.dtTrigger.next(this.dtOptions);
                      if (that.latecomers!.length) {
                        that.grantAccessTableInfoMessage = `You have ${that.latecomers!.length === 1 ? '1 latecomer' : that.latecomers!.length + ' latecomers'}.`;
                      } else {
                        that.grantAccessTableInfoMessage = 'No latecomer found.';
                        that.tableReady = false;
                      }
                      //});
                    },
                    error: error => {
                      that.alertService.danger(error);
                    }
                  });
                }
              }
            }
          ]
        },
        'selectAll',
        'selectNone'
      ]
    };
  }

  ngOnDestroy() {
    this.dtTrigger.unsubscribe();

    this.windowService.onresize();
  }

  getSettings = (error: any): void => {
    if (error) {
      this.alertService.danger(error);

    } else {
      this.myCommunity = this.userProfileService.user!.community;

      if (this.userProfileService.user!.role !== 'Referent') {
        if ((this.userProfileService.user!.referent! & this.appDomain.communitiesGroupFlag) ||
          (this.isSeniorExpert && [FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(this.userProfileService.user!.referent! & FAKE_SENIOR_ORANGE_EXPERTS_FLAG))) {
          this.myRole = 'Referent';
        } else {
          this.dtOptions.buttons = [
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
                      // email--> console.log(data[11]);
                      recipients.push(data[5]);
                    });

                    if (recipients.length) {
                      // display modal view for writing mail to users
                      const modalRef = self.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                      modalRef.componentInstance.recipients = recipients;
                      modalRef.componentInstance.emailFrom = self.userProfileService.user!.email;
                    }

                  }
                }
              ]
            },
            'selectAll',
            'selectNone'
          ];
        }
      } else {
        this.myRole = 'Referent';
      }

      this.communityService.listCommunities(
        [FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(this.userProfileService.user!.referent! & FAKE_SENIOR_ORANGE_EXPERTS_FLAG) ?
        { id: 'flag', value: 1 } :
        { id: 'name', operator: 'includes', value: this.myCommunity }, { id: '_id', includes: 1 }
      ).subscribe({
        next: communities => {
          this.myCommunityId = communities[0]['_id'];

          this.authService.canSubmitForms(this.urlPrefix, undefined).subscribe({
            next: answer => {
              this.submissionClosed = answer.message === 'OK' ? false : true;
              if (this.submissionClosed) {
                this.closeSubmissionForm = this.formBuilder.group({
                  confirm: ['',
                    Validators.compose([Validators.required,
                    this.formValidationService.deleteAccountConfirmationValidator('open submission')])
                  ]
                });
              } else {
                this.closeSubmissionForm = this.formBuilder.group({
                  confirm: ['',
                    Validators.compose([Validators.required,
                    this.formValidationService.deleteAccountConfirmationValidator('close submission')])
                  ]
                });
              }
              // TODO
              this.tableReady = false;
              this.grantAccessTableInfoMessage = ' ';
              this.authService.getLatecomers(this.urlPrefix)
                .subscribe({
                  next: users => {
                    this.latecomers = users;
                    this.dtTrigger.next(this.dtOptions);
                    if (users.length) {
                      this.tableReady = true;
                      this.grantAccessTableInfoMessage = `You have ${users.length === 1 ? '1 latecomer' : users.length + ' latecomers'}.`;
                    } else {
                      this.tableReady = false;
                      this.grantAccessTableInfoMessage = 'No latecomer found.';
                    }
                  },
                  error: err => {
                    this.grantAccessTableInfoMessage = err;
                    this.tableReady = false;
                  }
              });
            },
            error: _ => {
              this.alertService.warning('Cannot determine whether the form submission is open or closed.');

            }
          });
        },
        error: err => {
          this.alertService.danger(err);
        }
      });
    }
  }

  manageClicksOnDocument(element: Element) {
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
    if (this.latecomersTable.datatableElement.dtInstance) {
      this.latecomersTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.columns.adjust();
        $('.application-collapse-view').each(function () {
          $(this).css('width', ($('.oema-datatables').width()! - 50) + 'px');
        });
      });
    }
  }

  format(row: any) {
    let appFormsListHTML = '<ul class="collapse-list">';
    let idx = 0;
    let submitDate;
    for (const appform of this.latecomers![row[3]].history) {
      if (appform.submittedAt) {
        const d = new Date(appform.submittedAt);
        submitDate = ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      } else {
        submitDate = '';
      }

      appFormsListHTML += `
        <li>
          <input class="collapse-open" type="checkbox" id="collapse-${row[3]}-${idx}">
          <label class="collapse-btn" for="collapse-${row[3]}-${idx}">
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

    return `
      <main class="application-collapse-view">
        <section class="app-form-history">
          <div class="section-part-header">
            <h6>
              <i class="fa fa-angle-right" aria-hidden="true"></i>
              <span>
                Application forms by ${!this.latecomers![row[3]].firstname || !this.latecomers![row[3]].lastname ? this.latecomers![row[3]].email : '<span style="text-transform: capitalize;margin-left:0;">' + this.latecomers![row[3]].lastname!.toUpperCase() + ' ' + this.latecomers![row[3]].firstname + '</span>'}
              </span>
            </h6>
            <a href="/${this.urlPrefix}/dashboard/users/user-profile/${this.latecomers![row[3]]['_id']}" target="_blank" role="button" class="btn btn-primary"><i class="fa fa-user-circle-o" aria-hidden="true"></i> &nbsp;Edit profile</a>
          </div>
          <div class="content-body">
            ${appFormsListHTML}
          </div>
        </section>
      </main>`;
  }

  userClickedHandler(tr: any, index: number): void {
    this.latecomersTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      const row = dtInstance.row(tr);
      const rowData = row.data() as any[];

      const el = document.createElement('a'),
        mStyle = el.style;
      mStyle.cssText = 'position:sticky;position:-webkit-sticky;position:-ms-sticky;';
      const positionStickySupport = mStyle.position.indexOf('sticky') !== -1;

      if (row.child.isShown()) {
        // This row is already open - close it
        // const collapseHeight = $(tr).next().height();
        const collapseHeight = $(`td.details-${rowData[3]}`).outerHeight(true)!;
        row.child.hide();
        $(tr).removeClass('shown');
        $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! - collapseHeight);
        const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! - collapseHeight;
        $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');
        $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')').next().remove();

        this.collapsedTableViews -= 1;
        if (!this.collapsedTableViews) {
          $('#latecomers-list_filter input').prop('disabled', false);
        }

      } else {
        // Open this row
        this.collapsedTableViews += 1;
        if (this.collapsedTableViews) {
          $('#latecomers-list_filter input').prop('disabled', true);
        }

        row.child(this.format(rowData), 'details-' + rowData[3]).show();
        $(tr).addClass('shown');

        // const collapseHeight = $(tr).next().height();
        const collapseHeight = $(`td.details-${rowData[3]}`).outerHeight(true)!;

        $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! + collapseHeight);

        const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! + collapseHeight;
        $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');

        $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
          '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')'
        );
        $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding):eq(' + index + ')').next().height(collapseHeight);

        $(`td.details-${rowData[3]} .application-collapse-view`).css('width', ($('.oema-datatables').width()! - 50) + 'px');
        $(`tr.details-${rowData[3]}`).css('background', '#F2F4F8');

        if (!positionStickySupport) {
          $(`td.details-${rowData[3]} .application-collapse-view`).css('marginLeft', $('.dataTables_scrollBody').scrollLeft()!);
          $(`td.details-${rowData[3]} .application-collapse-view`).css('top', 0);
          $(`td.details-${rowData[3]} .application-collapse-view`).css('left', 15 + 'px');
        }
      }
    });
  }

  addLatecomer(event: any) {
    if (event.foundUserId) {
      event.eventTarget.disabled = true;

      this.authService.canSubmitForms(this.urlPrefix, event.foundUserId).subscribe({
        next: answer => {
          if (answer.message === 'OK') {
            // already a latecomer => close submission for the user
            this.alertService.info(answer.state === 0 ? 'The user already has a granted access to submit his/her application. \
          To remove the access, refer to the table.'
              : 'Application submission is already open for everyone: \
          no need to grant an access to an user!');

          } else {
            // not yet a latecomer => open submission for the user
            this.authService.openCloseSubmission(this.urlPrefix, 0, event.foundUserId, event.foundUserEmail).subscribe({
              next: ans => {
                this.alertService.success(ans.message);
                this.latecomers!.push(ans.user);

                this.latecomersTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
                  // Destroy the table first
                  dtInstance.destroy();
                  // Call the dtTrigger to rerender again
                  this.dtTrigger.next(this.dtOptions);

                  if (this.tableReady) {
                    this.grantAccessTableInfoMessage = `You have ${this.latecomers!.length} latecomers.`;
                  } else {
                    this.tableReady = true;
                    this.grantAccessTableInfoMessage = 'You have 1 latecomer.';
                  }
                });
              },
              error: error => {
                this.alertService.warning(error);
              }
            });
          }

          event.eventTarget.disabled = false;
        },
        error: _error => {
          this.alertService.warning('Cannot determine whether the form submission is open or closed for the user... :(');
          event.eventTarget.disabled = false;
        }
      });
    }
  }

  get closeSubmissionFormConfirm() {
    return this.closeSubmissionForm.get('confirm') as FormControl;
  }

  onOpeningClosingAppSubmission(_event: any, content: any) {
    this.modalWindow = this.modalService.open(content, { windowClass: 'modal-warning' });
  }

  closeAppSubmission() {
    this.closeSubmissionHasError = !this.closeSubmissionForm.valid;

    if (!this.closeSubmissionHasError) {
      if (!this.submissionClosed) {
        this.modalWindow.close('Submission is closed!');
        this.authService.openCloseSubmission(this.urlPrefix, 0, undefined, undefined).subscribe({
          next: _answer => {
            this.closeSubmissionForm.patchValue({ confirm: '' });
            this.closeSubmissionForm.controls['confirm'].setValidators([Validators.required,
            this.formValidationService.deleteAccountConfirmationValidator('open submission')]);
            this.submissionClosed = true;
            this.alertService.success('Form submission closed successfully.');
          },
          error: error => {
            this.alertService.warning(error);
          }
        });

      } else {
        this.modalWindow.close('Submission is open!');
        this.authService.openCloseSubmission(this.urlPrefix, 1, undefined, undefined).subscribe({
          next: _answer => {
            this.closeSubmissionForm.patchValue({ confirm: '' });
            this.closeSubmissionForm.controls['confirm'].setValidators([Validators.required,
            this.formValidationService.deleteAccountConfirmationValidator('close submission')]);
            this.submissionClosed = false;
            this.alertService.success('Form submission open successfully.');
          },
          error: error => {
            this.alertService.warning(error);
          }
        });
      }
    }
  }
}
