import { Component, ViewChild, OnDestroy, OnInit, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { SelectedUsersTableComponent } from '../../common/ng-components/selected-users-table/selected-users-table.component';
import { MailComposeComponent } from '../../common/ng-components/modal-mail-compose/mail-compose.component';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { UserService } from '../../common/ng-services/user.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { AlertService } from '../../common/ng-services/alert';
import { WindowService } from '../../common/ng-services/window.service';

import { User, FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';
import { Domain } from '../../common/ng-models/app-config';

import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './jury.component.html'
})
export class JuryComponent implements OnInit, OnDestroy {
  @ViewChild(SelectedUsersTableComponent) private juryTable!: SelectedUsersTableComponent;

  isSeniorExpert = false;
  urlPrefix: string;
  appDomain: Domain;

  dtOptions: any = {};
  expertCommunity!: string;
  reviewers: User[] | null = [];
  myRole = '';

  collapsedTableViews = 0;

  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger: Subject<any> = new Subject();
  tableReady = false;
  onResizeTimeout: any;

  infoMessage = '';


  @HostListener('document:click', ['$event'])
  public documentClick(event: Event): void {
    this.manageClicksOnDocument(event);
  }

  constructor(
    private appConfig: AppConfig,
    private titleService: Title,
    private modalService: NgbModal,
    private windowService: WindowService,
    private userService: UserService,
    private communityService: CommunityService,
    public userProfileService: UserProfileService,
    private alertService: AlertService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    if (this.router.url.includes('/dashboard/senior-')) {
      this.isSeniorExpert = true;
    }
    this.titleService.setTitle('Jury Membership');
    this.windowService.onresize(() => {
      clearTimeout(this.onResizeTimeout);
      this.onResizeTimeout = setTimeout(() => {
        this.redrawTable();
      }, 500);
    });
  }

  ngOnInit() {
    const that = this;

    this.userProfileService.getProfile(this.buildReviewerTable);

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
          // disable row checkbox when opening applicant panel
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
              text: '<i class="fa fa-user-times" aria-hidden="true"></i> Remove reviewer(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const userIds: string[] = [];
                dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  userIds.push(that.reviewers![rowIdx]['_id']);
                });
                if (userIds.length) {
                  that.userService.switchUsersAsReviewers(
                    this.urlPrefix, userIds.toString(), 'applicant', that.expertCommunity, this.isSeniorExpert)
                    .subscribe({
                      next: _answer => {
                        that.reviewers = that.reviewers!.filter(item => !userIds.includes(item['_id']));
                        if (userIds.length === 1) {
                          that.alertService.success('The selected user has been successfully removed from the jury membership.');
                        } else {
                          that.alertService.success('The selected users have been successfully removed from the jury membership.');
                        }

                        //that.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
                        // Destroy the table first
                        dt.destroy();
                        // Call the dtTrigger to rerender again
                        that.dtTrigger.next(this.dtOptions);
                        if (that.reviewers!.length) {
                          that.infoMessage = `You have ${that.reviewers!.length === 1 ? '1 reviewer' : that.reviewers!.length + ' reviewers'} for ` +
                            (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                              `your community <span class="text-primary">${that.expertCommunity}</span>.`);
                        } else {
                          that.infoMessage = 'No reviewer found for ' +
                            (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                              `your community <span class="text-primary">${that.expertCommunity}</span>.`);
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
        {
          text: 'Close all sub-panels',
          className: 'close-subpanels',
          action: (_e: any, _dt: DataTables.Api, _node: JQuery, _config: any) => {
            $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
          }
        },
        'selectAll',
        'selectNone'
      ]
    };
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();

    clearTimeout(this.onResizeTimeout);
    this.windowService.onresize();
  }

  buildReviewerTable = (error: any): void => {
    if (error) {
      this.infoMessage = error;
      this.tableReady = false;

    } else {
      if (this.userProfileService.user) {
        this.expertCommunity = this.userProfileService.user.community;

        if (this.userProfileService.user.role !== 'Referent') {
          if ((this.userProfileService.user.referent! & this.appDomain.communitiesGroupFlag) ||
            (this.isSeniorExpert && [FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(this.userProfileService.user.referent! & FAKE_SENIOR_ORANGE_EXPERTS_FLAG))) {
            this.myRole = 'Referent';
          } else {
            this.dtOptions.buttons[0].buttons.splice(1, 1);
          }
        } else {
          this.myRole = 'Referent';
        }

        this.communityService.listReviewersByCommunityName(this.expertCommunity, this.isSeniorExpert).subscribe({
          next: users => {
            this.reviewers = users;
            this.dtTrigger.next(this.dtOptions);
            if (users.length) {
              this.tableReady = true;
              this.infoMessage = `You have ${users.length === 1 ? '1 reviewer' : users.length + ' reviewers'} for ` +
                (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                  `your community <span class="text-primary">${this.expertCommunity}</span>.`);
            } else {
              this.tableReady = false;
              this.infoMessage = 'No reviewer found for ' +
                (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                  `your community <span class="text-primary">${this.expertCommunity}</span>.`);
            }
          },
          error: err => {
            this.infoMessage = err;
            this.tableReady = false;
          }
        });
      }
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
    this.juryTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.columns.adjust();
      $('.application-collapse-view').each(function () {
        $(this).css('width', ($('.oema-datatables').width()! - 50) + 'px');
      });
    });
  }

  format(row: any) {
    let appFormsListHTML = '<ul class="collapse-list">';
    let idx = 0;
    let submitDate;
    const history = this.reviewers![row[3]].history.map((x: any) => x);
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
                Application forms by ${!this.reviewers![row[3]].firstname || !this.reviewers![row[3]].lastname ? this.reviewers![row[3]].email : '<span style="text-transform: capitalize;margin-left:0;">' + this.reviewers![row[3]].lastname!.toUpperCase() + ' ' + this.reviewers![row[3]].firstname + '</span>'}
              </span>
            </h6>
            <a href="/${this.urlPrefix}/dashboard/users/user-profile/${this.reviewers![row[3]]['_id']}" target="_blank" role="button" class="btn btn-primary"><i class="fa fa-user-circle-o" aria-hidden="true"></i> &nbsp;Edit profile</a>
          </div>
          <div class="content-body">
            ${appFormsListHTML}
          </div>
        </section>
      </main>`;
  }

  userClickedHandler(tr: any, index: number): void {
    this.juryTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
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

      } else {
        // Open this row
        this.collapsedTableViews += 1;

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

  addReviewer(event: any) {
    if (event.foundUserId) {
      event.eventTarget.disabled = true;

      this.userService.switchUserAsReviewer(this.urlPrefix, event.foundUserId, 'reviewer', this.expertCommunity, this.isSeniorExpert).subscribe({
        next: updatedUser => {
          this.reviewers!.push(updatedUser);
          if (updatedUser.firstname && updatedUser.lastname) {
            this.alertService.success(updatedUser.firstname + ' ' + updatedUser.lastname + ' is now a reviewer.');
          } else {
            this.alertService.success(updatedUser.email + ' is now a reviewer.');
          }

          this.juryTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
            // Destroy the table first
            dtInstance.destroy();
            // Call the dtTrigger to rerender again
            this.dtTrigger.next(this.dtOptions);

            if (this.tableReady) {
              this.infoMessage = `You have ${this.reviewers!.length} reviewers for `+
                (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                  `your community <span class="text-primary">${this.expertCommunity}</span>.`);
            } else {
              this.tableReady = true;
              this.infoMessage = 'You have 1 reviewer for your ' +
                (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                  `community <span class="text-primary">${this.expertCommunity}</span>.`);
            }
          });

          event.eventTarget.disabled = false;
        },
        error: error => {
          if (error.indexOf('impossible to send an email') !== -1) {
            this.alertService.warning(error);

            this.communityService.listReviewersByCommunityName(this.expertCommunity, this.isSeniorExpert).subscribe({
              next: users => {
                this.juryTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
                  dtInstance.destroy();
                  this.reviewers = users;
                  this.dtTrigger.next(this.dtOptions);
                  this.tableReady = true;
                  this.infoMessage = `You have ${users.length === 1 ? '1 reviewer' : users.length + ' reviewers'} for `+
                    (this.isSeniorExpert ? 'the <span class="text-primary">Senior Orange Expert</span> Programme.' :
                      `your community <span class="text-primary">${this.expertCommunity}</span>.`);
                });
              },
              error: err => {
                this.infoMessage = err;
              }

            });
          } else {
            this.alertService.danger(error);
          }

          event.eventTarget.disabled = false;
        }
      });
    }
  }
}
