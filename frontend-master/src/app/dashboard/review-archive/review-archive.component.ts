import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { Subject } from 'rxjs';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DataTableDirective } from 'angular-datatables';
import { saveAs } from 'file-saver';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { FormService } from '../../common/ng-services/form.service';
import { ReviewService } from '../../common/ng-services/review.service';
import { AlertService } from '../../common/ng-services/alert';
import { WindowService } from '../../common/ng-services/window.service';
import { MailComposeComponent } from '../../common/ng-components/modal-mail-compose/mail-compose.component';

import { User, FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';
import { Review } from '../../common/ng-models/review';

const RAW_DATA_INDEX = 5;

@Component({
  templateUrl: './review-archive.component.html',
  styleUrls: ['./review-archive.component.scss']
})
export class ReviewArchiveComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableDirective, {static: false})
  private datatableElement!: DataTableDirective;

  isSeniorExpert = false;

  dtOptions: any = {};
  urlPrefix: string;
  user!: User | null; /* i.e. connected user */
  expertCommunity!: string;
  expertCommunityId!: string;
  applicants!: any[] | null;
  backupApplicants: any[] | null = null;
  availableCommunities: any[] | null = null;
  fixedReviewers = new Array(30).fill({});
  reviewersVisibility!: boolean[] | null;
  yearForReviews = new Date().getFullYear();
  yearsList: number[] = [];
  excelExportBtn = 'fa-file-excel-o';

  activeApplicantIndex!: number;
  activeReviewerIndex!: number;
  bubbleOffsetTop!: number;
  bubbleOffsetLeft!: number;
  horizontalScrollLeft!: number;
  verticalScrollTop!: number;
  modalWindow!: NgbModalRef;
  activeApplicantNotificationIndex = -1;

  appReviewForm: FormGroup;
  collapsedTableViews = 0;

  dtTrigger: Subject<any> = new Subject();
  tableReady = false;
  revealTable = false;
  onResizeTimeout: any;

  errorMessage = '';

  @HostListener('document:click', ['$event'])
  public documentClick(event: Event): void {
    this.manageClicksOnDocument(event);
  }

  constructor(
    private titleService: Title,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private windowService: WindowService,
    private userProfileService: UserProfileService,
    private communityService: CommunityService,
    private formService: FormService,
    private reviewService: ReviewService,
    public alertService: AlertService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    if (this.router.url.includes('/dashboard/senior-')) {
      this.isSeniorExpert = true;
      this.yearsList = Array.from({length: this.yearForReviews - 2022}, (_, k) => this.yearForReviews - k);
    } else {
      this.yearsList = Array.from({length: this.yearForReviews - 2017}, (_, k) => this.yearForReviews - k);
    }
    this.titleService.setTitle('Review Archive');

    this.appReviewForm = this.formBuilder.group({
      'textarea-review-comment': '',
      'review-status': '',
      'textarea-review-notes': '',
      'review-final-recommendation': ''
    });

    (this.appReviewForm.get('review-status') as FormControl).valueChanges.forEach(
      (value: string) => {
        if (value === 'Rejected') {
          this.appReviewForm.patchValue({ 'review-final-recommendation': value });
        } else {
          this.appReviewForm.patchValue({ 'review-final-recommendation': 'Pending' });
        }
      }
    );

    this.windowService.onresize(() => {
      if (this.tableReady) {
        clearTimeout(this.onResizeTimeout);
        this.onResizeTimeout = setTimeout(() => {
          this.redrawTable();
        }, 500);
      }
    });
  }

  ngOnInit() {
    if (this.yearsList.length === 0) {
      this.errorMessage = 'The archive is empty!';
      return;
    }

    const that = this;

    this.userProfileService.getProfile(this.getCommunitySettings);

    const hidableColumns = [
      {class: 'strong-accept', title: 'Strong Accept'}, {class: 'weak-accept', title: 'Weak Accept'}, {class: 'fair', title: 'Fair'},
      {class: 'weak-reject', title: 'Weak Reject'}, {class: 'strong-reject', title: 'Strong Reject'},
      {class: 'total-score', title: 'Total Score'}, {class: 'nb-reviewers', title: 'Nb. Reviewers'}, {class: 'nb-reviews', title: 'Nb. Reviews'},
      {class: 'avg-score', title: 'Avg. Score'}, {class: 'std-dev-score', title: 'Std. Dev. Score'},
      {class: 'final-review-comments', title: 'Comments'}, {class: 'final-review-status', title: 'Status'}, {class: 'final-review-recommendation', title: 'Final Recommendation'},
      {class: 'review-notification', title: 'Notification'}
    ];

    const hidablecolumnGroups = [
      {title: 'Reviewers', columns: 'reviewer-name'},
      {title: 'Reviewer scores', columns: 'review-score'},
      {title: 'Final scores', columns: 'final-review-score'},
      {title: 'Review reports', columns: 'review-report'}
    ];

    const isColumnGroupVisible = (columns: DataTables.ColumnsMethods) => {
      const colVis = columns.visible() as unknown as { [key: string]: any };
      for (let i = 0; i < colVis['length']; i++) {
        if (colVis[i]) {
          return true;
        }
      }

      return false;
    }

    this.dtOptions = {
      orderClasses: false,
      deferRender: true,
      columnDefs: [
        {
          orderable: false,
          className: 'select-checkbox',
          targets: 0
        }, {
          orderable: false,
          targets: ['reviewer-name', 'review-score', 'final-review-comments']
        },
        { visible: false, targets: [3, 4, 6] },
        { visible: false, targets: [RAW_DATA_INDEX], searchable: false },
        {
          width: '40px',
          targets: ['reviewer-name', 'review-score', 'final-review-score']
        }

      ],
      select: {
        style: 'os',
        selector: 'td.row-selector',
        blurable: true
      },
      paging: true,
      pageLength: 10,
      lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
      /* orderFixed: [4, 'asc'], */
      order: [[1, 'asc']], // [[ 4, "asc" ], [ 1, "asc" ]],
      stateSave: true,
      scrollX: true,
      fixedColumns: {
        leftColumns: 3,
        heightMatch: 'none'
      },
      /*fixedHeader: true,*/
      initComplete: (_settings: DataTables.Settings, _json: any) => {
        // const api = this.api();
        const self = this;

        const el = document.createElement('a'),
          mStyle = el.style;
        mStyle.cssText = 'position:sticky;position:-webkit-sticky;position:-ms-sticky;';
        const positionStickySupport = mStyle.position.indexOf('sticky') !== -1;

        self.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
          const api = dtInstance;

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
                    '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding, .community-group):eq(' + rowLoop + ')'
                  );
                  $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding, .community-group):eq(' + rowLoop + ')').next().height(collapseHeight);
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

          $('.buttons-colvisGroup').on('click', function () {
            api.column(4).search('')
              .column(3).search('@')
              .draw();

            sessionStorage.removeItem(`filterNew${that.yearForReviews}`);
            sessionStorage.removeItem(`filterRenewal${that.yearForReviews}`);

            const collapseHeight = $('.application-collapse-view:first').outerHeight(true)!;

            $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! - 2 * collapseHeight * $('.application-collapse-view').length);
          });

          $('.column-visibility').on('click', function () {
            for (const col of hidableColumns) {
                const column = api.column(`.${col.class}`);
                $(`.dt-button.${col.class}`).toggleClass('active', column.visible());
            }
          });

          $('.reviewer-visibility').on('click', function () {
            for (const reviewer of that.applicants![0].reviewers) {
              const className = reviewer.reviewer.email.split('@')[0].replace('.', '-');
              const column = api.column(`.${className}`);
              $(`.dt-button.${className}`).toggleClass('active', column.visible());
            }
          });

          $('.group-visibility').on('click', function () {
            for (const grp of hidablecolumnGroups) {
              const columns = api.columns(`.${grp.columns}`);
              $(`.dt-button.${grp.columns}`).toggleClass('active', isColumnGroupVisible(columns));
            }

            if ((that.isSeniorExpert && !that.backupApplicants![0].reviewers.length)
              || (!that.isSeniorExpert && !that.applicants![0].reviewers.length)) {
              $('.dt-button.reviewer-name').addClass('d-none');
            }

            if (sessionStorage.getItem(`filterNew${that.yearForReviews}`)) {
              $('.filter-new-button').removeClass('active');
            } else {
              $('.filter-new-button').addClass('active');
            }
            if (sessionStorage.getItem(`filterRenewal${that.yearForReviews}`)) {
              $('.filter-renewal-button').removeClass('active');
            } else {
              $('.filter-renewal-button').addClass('active');
            }
          });

          $('.community-visibility').on('click', function () {
            for (const community of that.availableCommunities ?? []) {
              $(`.dt-button.${community.id}`).toggleClass('active', sessionStorage.getItem(`filter${community.id}`) ? false : true);
            }
          });

          $('.dataTables_scrollBody').on('mouseenter', 'td.final-review-comments', function () {
            const applicantIdx = $(this).data('applicant');

            if (self.applicants![applicantIdx].deliberation.comments !== '') {
              const offsetLeft = $(this).offset()!.left - $('.card').offset()!.left;
              const offsetTop = $(this).offset()!.top - $('.card').offset()!.top;

              $('#tooltip').css('left', offsetLeft + $(this).outerWidth(true)! / 2 + 'px');
              $('#tooltip').css('top', offsetTop + 20 + 'px');

              $('#tooltip').attr('data-balloon', self.applicants![applicantIdx].deliberation.comments);
              $('#tooltip').attr('data-balloon-visible', '');
            }
          });
          $('.dataTables_scrollBody').on('mouseleave', 'td.final-review-comments', function () {
            $('#tooltip').removeAttr('data-balloon-visible');
          });

          $('.dataTables_scrollBody').on('click', 'td.reviewer-name:not(.disabled)', function () {
            const applicantIdx = $(this).data('applicant');
            const reviewerIdx = $(this).data('reviewer');

            if (!$('.reviewer-bubble').length) {
              self.activeApplicantIndex = applicantIdx;
              self.activeReviewerIndex = reviewerIdx;
              self.bubbleOffsetLeft = $(this).offset()!.left - $('.card').offset()!.left;
              self.bubbleOffsetTop = $(this).offset()!.top - $('.card').offset()!.top;
              self.horizontalScrollLeft = $('.dataTables_scrollBody').scrollLeft()!;
              self.verticalScrollTop = $('.card-block.widget-body.new-applications').scrollTop()!;
              setTimeout(() => {
                $('.reviewer-bubble').css('left', (self.bubbleOffsetLeft - $('.reviewer-bubble').width()! / 2 + $(this).width()! / 2) + 'px');
                $('.reviewer-bubble').css('top', (self.bubbleOffsetTop - $('.reviewer-bubble').height()!) + 'px');
                $('.reviewer-bubble').addClass('show');

              }, 100);

            } else {
              $('.reviewer-bubble').removeClass('show');
              if (self.activeApplicantIndex === applicantIdx && self.activeReviewerIndex === reviewerIdx) {
                self.activeApplicantIndex = -1;
                self.activeReviewerIndex = -1;
              } else {
                setTimeout(() => {
                  self.activeApplicantIndex = applicantIdx;
                  self.activeReviewerIndex = reviewerIdx;
                }, 300);
                self.bubbleOffsetLeft = $(this).offset()!.left - $('.card').offset()!.left;
                self.bubbleOffsetTop = $(this).offset()!.top - $('.card').offset()!.top;
                self.horizontalScrollLeft = $('.dataTables_scrollBody').scrollLeft()!;
                self.verticalScrollTop = $('.card-block.widget-body.new-applications').scrollTop()!;
                setTimeout(() => {
                  $('.reviewer-bubble').css('left', (self.bubbleOffsetLeft - $('.reviewer-bubble').width()! / 2 + $(this).width()! / 2) + 'px');
                  $('.reviewer-bubble').css('top', (self.bubbleOffsetTop - $('.reviewer-bubble').height()!) + 'px');
                  $('.reviewer-bubble').addClass('show');
                }, 600);
              }

            }

          });

          api.on('column-visibility.dt', function (_e, _aSettings, _aJson) {
            const visibleReviewers: boolean[] = api.columns('.reviewer-name').visible() as unknown as boolean[];
            const nbReviewers = self.applicants!.length ? self.applicants![0].reviewers.length : 0;

            let needTofilter = false;
            let nbVisible = 0;
            const whatsSelected = [];

            for (let i = 0; i < nbReviewers; i++) {
              if (visibleReviewers[i] !== self.reviewersVisibility![i]) {
                needTofilter = true;
              }
              self.reviewersVisibility![i] = visibleReviewers[i];
              if (visibleReviewers[i] === true) {
                nbVisible += 1;
              }
            }

            if (needTofilter) {
              if (nbVisible === nbReviewers) {
                api.column(3)
                  .search('@').draw();
              } else {
                for (const rev of self.applicants!) {
                  for (let i = 0; i < nbReviewers; i++) {
                    if (visibleReviewers[i] === true) { // this reviewer is visible
                      if (rev.reviewers[i].reviews === 'yes' || rev.reviewers[i].reviews === 'maybe') {
                        whatsSelected.push('(?=.*' + rev.applicant.email + ')');
                      }
                    }

                  }
                }
                api.column(3)
                  .search(whatsSelected.join('|'), true, false, true).draw();
              }
            }
          });
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
        } else {
          $('.dataTables_scrollBody').on('scroll', function () {
            $('.reviewer-bubble').css('left', (self.bubbleOffsetLeft - ($(this).scrollLeft()! - self.horizontalScrollLeft) - $('.reviewer-bubble').width()! / 2 + $('td.reviewer-name').width()! / 2) + 'px');
          });
          $('.card-block.widget-body.new-applications').on('scroll', function () {
            $('.reviewer-bubble').css('top', (self.bubbleOffsetTop - ($(this).scrollTop()! - self.verticalScrollTop) - $('.reviewer-bubble').height()!) + 'px');
          });
        }
      },
      rowCallback: (row: Node, _data: any[] | Object, index: number) => {
        const self = this;
        // Unbind first in order to avoid any duplicate handler
        // (see https://github.com/l-lin/angular-datatables/issues/87)
        $('td.user-name', row).off('click');
        $('td.user-name', row).on('click', () => {
          self.userClickedHandler(row, index);
        });

        return row;
      },
      drawCallback: function (_settings: DataTables.Settings) {
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


            $(this).css('width', ($('.application-review-matrix').width()! - 50) + 'px');
          });

          if (that.isSeniorExpert && that.applicants!.length) {
            that.rowGroup(this.api(), that.applicants![0].reviewers.length);
          }

          if (sessionStorage.getItem(`filterNew${that.yearForReviews}`)) {
            $('#review-new-applicants_info').html($('#review-new-applicants_info').text() + ' <b>(Displaying only renewal applications)</b>');
          } else if (sessionStorage.getItem(`filterRenewal${that.yearForReviews}`)) {
            $('#review-new-applicants_info').html($('#review-new-applicants_info').text() + ' <b>(Displaying only new applications)</b>');
          }

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
          text: 'Column visibility',
          className: 'column-visibility',
          buttons: hidableColumns.map((col) => {
            return {
              extend: 'columnToggle',
              text: col.title,
              className: col.class,
              action: (_e: any, dt: DataTables.Api, node: JQuery, _config: any) => {
                $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
                if ($('.community-group').length) {
                  $('.community-group').remove();
                }

                setTimeout(() => {
                  let column = dt.column(`.${col.class}`);
                  column.visible(!column.visible());
                  node.toggleClass('active', column.visible());

                  for (const otherColumn of hidableColumns) {
                    if (otherColumn.class !== col.class) {
                      column = dt.column(`.${otherColumn.class}`);
                      $(`.dt-button.${otherColumn.class}`).toggleClass('active', column.visible());
                    }
                  }

                  if (that.isSeniorExpert && that.applicants!.length) {
                    that.rowGroup(dt, that.applicants![0].reviewers.length);
                  }
                }, 0);
              }
            };
          })
        },
        {
          extend: 'collection',
          text: 'Group visibility',
          className: 'group-visibility',
          buttons: [
            ...hidablecolumnGroups.map((grp) => {
              return {
                extend: 'columnToggle',
                text: grp.title,
                className: `${grp.columns}`,
                action: (_e: any, dt: DataTables.Api, node: JQuery, _config: any) => {
                  $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
                  if ($('.community-group').length) {
                    $('.community-group').remove();
                  }

                  setTimeout(() => {
                    let columns = dt.columns(`.${grp.columns}`);
                    const visibility = isColumnGroupVisible(columns);
                    columns.visible(!visibility);
                    node.toggleClass('active', !visibility);

                    for (const otherGrp of hidablecolumnGroups) {
                      if (otherGrp.columns !== grp.columns) {
                        columns = dt.columns(`.${otherGrp.columns}`);
                        $(`.dt-button.${otherGrp.columns}`).toggleClass('active', isColumnGroupVisible(columns));
                      }
                    }

                    if (sessionStorage.getItem(`filterNew${that.yearForReviews}`)) {
                      $('.filter-new-button').removeClass('active');
                    }
                    if (sessionStorage.getItem(`filterRenewal${that.yearForReviews}`)) {
                      $('.filter-renewal-button').removeClass('active');
                    }

                    if (that.isSeniorExpert && that.applicants!.length) {
                      that.rowGroup(dt, that.applicants![0].reviewers.length);
                    }
                  }, 0);
                }
              };
            }),
            {
              extend: 'columnToggle',
              text: 'New applications',
              className: 'filter-new-button',
              action: (_e: any, _dt: DataTables.Api, _node: JQuery, _config: any) => {
                $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');

                const self = this;
                self.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
                  if (sessionStorage.getItem(`filterNew${that.yearForReviews}`)) {
                    sessionStorage.removeItem(`filterNew${that.yearForReviews}`);
                    dtInstance.column(4).search('').draw();
                    $('.filter-new-button').addClass('active');
                  } else {
                    sessionStorage.setItem(`filterNew${that.yearForReviews}`, '1');
                    dtInstance.column(4)
                      .search('"renew"').draw();
                    $('.filter-new-button').removeClass('active');
                  }

                  if (sessionStorage.getItem(`filterRenewal${that.yearForReviews}`)) {
                    sessionStorage.removeItem(`filterRenewal${that.yearForReviews}`);
                    $('.filter-renewal-button').addClass('active');
                  }
                });
              }
            },
            {
              extend: 'columnToggle',
              text: 'Renewal applications',
              className: 'filter-renewal-button',
              action: (_e: any, _dt: DataTables.Api, _node: JQuery, _config: any) => {
                $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');

                const self = this;
                self.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
                  if (sessionStorage.getItem(`filterRenewal${that.yearForReviews}`)) {
                    sessionStorage.removeItem(`filterRenewal${that.yearForReviews}`);
                    dtInstance.column(4).search('').draw();
                    $('.filter-renewal-button').addClass('active');
                  } else {
                    sessionStorage.setItem(`filterRenewal${that.yearForReviews}`, '1');
                    dtInstance.column(4)
                      .search('^new$', true, true, false).draw();
                    $('.filter-renewal-button').removeClass('active');
                  }

                  if (sessionStorage.getItem(`filterNew${that.yearForReviews}`)) {
                    sessionStorage.removeItem(`filterNew${that.yearForReviews}`);
                    $('.filter-new-button').addClass('active');
                  }
                });
              }
            }
          ]
        },
        {
          //extend: 'colvisGroup',
          text: 'Restore visibility',
          //show: ':hidden'
          action: (_e: any, dt: DataTables.Api, _node: JQuery, _config: any) => {
            if (this.isSeniorExpert) {
              // little hack to reset column visbility while redrawing the datatable!
              localStorage.removeItem(`DataTables_review-new-applicants_${this.router.url}`);

              for (const community of this.availableCommunities ?? []) {
                sessionStorage.removeItem(`filter${community.id}`);
              }

              dt.destroy();
              this.applicants = this.backupApplicants;

              // Call the dtTrigger to rerender again
              this.dtTrigger.next(this.dtOptions);

            } else {
              dt.columns().visible(true).search('').draw();
              sessionStorage.removeItem(`filterNew${that.yearForReviews}`);
              sessionStorage.removeItem(`filterRenewal${that.yearForReviews}`);
            }
          }
        },
        'selectAll',
        'selectNone',
        {
          text: 'Close all sub-panels',
          className: 'close-subpanels',
          action: (_e: any, _dt: DataTables.Api, _node: JQuery, _config: any) => {
            $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
          }
        },
        {
          extend: 'collection',
          text: 'Actions',
          className: 'review-actions-button',
          buttons: [
            {
              extend: 'selected',
              text: '<i class="fa fa-envelope-o" aria-hidden="true"></i> Email to applicant(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const self = this;
                const recipients: string[] = [];
                dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  recipients.push(self.applicants![rowIdx].applicant.email);
                });

                if (recipients.length) {
                  // display modal view for writing mail to users
                  const modalRef = self.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                  modalRef.componentInstance.recipients = recipients;
                  modalRef.componentInstance.emailFrom = self.user!.email;
                  modalRef.componentInstance.modalTitle = 'Email to applicant(s)';
                }
              }
            },
            {
              extend: 'selected',
              text: '<i class="fa fa-external-link" aria-hidden="true"></i> MAILTO applicant(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const self = this;
                let recipients = '';
                let emailsCC = '';
                dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  recipients += self.applicants![rowIdx].applicant.email + ';';
                  emailsCC += self.applicants![rowIdx].applicant.managerEmail + ';' + self.applicants![rowIdx].applicant.hrEmail + ';';
                });

                if (recipients.length) {
                  // launch the user's mail client
                  window.location.href = 'mailto:' + recipients + '?cc=' + emailsCC;
                }
              }
            },
            {
              extend: 'selected',
              text: '<i class="fa fa-commenting-o" aria-hidden="true"></i> Notify deliberation(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const self = this;
                if (self.user!.role === 'Referent') {
                  const recipients: string[] = [];
                  const emails: string[] = [];
                  dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                    recipients.push(self.applicants![rowIdx].applicant.email);
                    emails.push(self.applicants![rowIdx].applicant.managerEmail, self.applicants![rowIdx].applicant.hrEmail);
                  });

                  if (recipients.length) {
                    // display modal view for writing mail to users
                    const modalRef = self.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                    modalRef.componentInstance.recipients = recipients;
                    modalRef.componentInstance.emailFrom = self.user!.email;
                    if (recipients.length > 1) {
                      modalRef.componentInstance.emailsBCC = emails;
                    } else {
                      modalRef.componentInstance.emailsCC = emails;
                    }
                    modalRef.componentInstance.modalTitle = 'Notify acceptance to applicant(s)';
                  }
                } else {
                  self.alertService.warning('You are not authorized to perform this action.');
                }
              }
            },
            {
              extend: 'selected',
              text: '<i class="fa fa-download" aria-hidden="true"></i> Download application(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const self = this;
                if (self.errorMessage !== '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Retrieving the selected application(s). Please wait...') {
                  const formIds: string[] = [];
                  let communityId = '';
                  dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                    formIds.push(self.applicants![rowIdx].formId);
                    if (self.applicants![rowIdx].communityId !== communityId) {
                      if (communityId) {
                        self.alertService.warning('You can only get archive of applications belonging to the same community.');
                        return;
                      }
                      communityId = self.applicants![rowIdx].communityId;
                    }
                  });
                  if (formIds.length) {
                    self.errorMessage = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Retrieving the selected application(s). Please wait...';
                    self.formService.getFormArchive(this.urlPrefix, formIds.toString(), communityId).subscribe({
                      next: (resp: Blob) => {
                        saveAs(new Blob([resp], { type: 'application/zip' }), `${self.expertCommunity.replace('&', '').replace(/\s+/g, '-')}-applications.zip`);
                        self.errorMessage = '';
                      },
                      error: error => {
                        self.alertService.danger(error);
                        self.errorMessage = '';
                      }
                    });
                  }

                }
              }
            },
            {
              extend: 'selected',
              text: '<i class="fa fa-envelope" aria-hidden="true"></i> Email to reviewer(s)',
              action: (_e: any, dt: DataTables.Api, _button: JQuery, _config: any) => {
                const self = this;
                const recipients: string[] = [];
                dt.rows({ selected: true }).every(function (rowIdx: number, _tableLoop: number, _rowLoop: number) {
                  for (const reviewer of self.applicants![rowIdx].reviewers) {
                    if ((reviewer.reviews === 'yes' || reviewer.reviews === 'maybe')
                      && recipients.indexOf(reviewer.reviewer.email) === -1) {
                      recipients.push(reviewer.reviewer.email);
                    }
                  }
                });

                if (recipients.length) {
                  // display modal view for writing mail to reviewers
                  const modalRef = self.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
                  modalRef.componentInstance.recipients = recipients;
                  modalRef.componentInstance.emailFrom = self.userProfileService.user!.email;
                  modalRef.componentInstance.modalTitle = 'Email to reviewer(s)';
                }
              }
            }
          ]
        }
      ]
    };
  }

  ngOnDestroy() {
    this.dtTrigger.unsubscribe();

    clearTimeout(this.onResizeTimeout);
    this.windowService.onresize();

    if (this.datatableElement.dtInstance) {
      this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy(true);
        this.applicants = null;
        this.backupApplicants = null;
        this.reviewersVisibility = null;
        this.dtOptions = null;
        this.user = null;
      });
    }
  }

  getCommunitySettings = (error: any): void => {
    if (error) {
      this.alertService.danger(error);

    } else {
      this.user = this.userProfileService.user;
      //this.expertCommunity = this.userProfileService.user!.community;

      let searchCommunity: any, newForm: string, renewalForm: string, reviewers: string;

      if (this.isSeniorExpert) {
        searchCommunity = { id: 'flag', value: 1 };
        newForm = 'newSeniorForm';
        renewalForm = 'renewalSeniorForm';
        reviewers = 'seniorReviewers';
      } else {
        searchCommunity = { id: 'name', operator: 'includes', value: this.userProfileService.user!.community };
        newForm = 'newForm';
        renewalForm = 'renewalForm';
        reviewers = 'reviewers';
      }

      this.communityService.listCommunities(
        searchCommunity,
        { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, { id: 'flag', includes: 1 }, { id: reviewers, includes: 1 },
        { id: newForm, includes: 1 }, { id: renewalForm, includes: 1 }
      ).subscribe({
        next: communities => {
          this.expertCommunityId = this.isSeniorExpert ? FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString() : communities[0]['_id'];
          this.expertCommunity = this.isSeniorExpert ? 'Senior Orange Experts' : communities[0]['name'];

          if ((this.user!.referent! & communities[0].flag) ||
            (this.isSeniorExpert && [FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(this.user!.referent! & FAKE_SENIOR_ORANGE_EXPERTS_FLAG))) {
            this.user!.role = 'Referent';
          }

          this.buildReviewTable();
        },
        error: err => {
          this.alertService.danger(err);
        }
      });
    }
  }

  buildReviewTable() {
    this.tableReady = false;
    this.revealTable = false;
    this.errorMessage = '';

    this.reviewService.listReviews(this.expertCommunityId, true, this.isSeniorExpert, { id: 'year', operator: '$eq', value: this.yearForReviews },
      { id: 'applicant', child: 'email', operator: 'excludes', value: this.user!.email },
      { id: 'applicant._id', includes: 1 }, { id: 'applicant.firstname', includes: 1 }, { id: 'applicant.lastname', includes: 1 },
      { id: 'applicant.email', includes: 1 }, { id: 'applicant.managerEmail', includes: 1 }, { id: 'applicant.hrEmail', includes: 1 },
      { id: 'applicant.history', includes: 1 },
      { id: 'formId', includes: 1 }, { id: 'formType', includes: 1 }, { id: 'year', includes: 1 }, { id: 'userAppFormData', includes: 1 },
      { id: 'reviewers', includes: 1 }, { id: 'rate', includes: 1 }, { id: 'deliberation', includes: 1 }, { id: 'notification', includes: 1 },
    ).subscribe({
      next: reviews => {
        if (reviews.length) {
          this.reviewersVisibility = Array(reviews[0].reviewers.length).fill(true);

          if (this.datatableElement.dtInstance) {
            this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
              dtInstance.destroy();
              this.applicants = null;
              this.applicants = reviews;
              if (this.isSeniorExpert) {
                this.backupApplicants = null;
                this.backupApplicants = reviews;
                this.availableCommunities = [...new Set(reviews.map((app) => {
                  return {
                    name: app.communityName,
                    id: app.communityId
                  };
                }))];
                this.setCommunityVisibilityBtns();
              }
              this.setReviewerVisibilityBtns();

              this.dtTrigger.next(this.dtOptions);
              this.tableReady = true;
              setTimeout(() => {
                this.revealTable = true;
              }, 2000);
            });

          } else {
            this.applicants = reviews;
            if (this.isSeniorExpert) {
              this.backupApplicants = reviews;
              this.availableCommunities = [...new Set(reviews.map((app) => {
                return {
                  name: app.communityName,
                  id: app.communityId
                };
              }))];
              this.setCommunityVisibilityBtns();
            }
            this.setReviewerVisibilityBtns();
            this.dtTrigger.next(this.dtOptions);
            this.tableReady = true;
            setTimeout(() => {
              this.revealTable = true;
            }, 2000);
          }

        } else {
          this.errorMessage = `No reviews found for ${this.yearForReviews - 1}.`;
        }
      },
      error: error => {
        this.errorMessage = error;
      }
    });
  }

  manageClicksOnDocument(event: Event) {
    const element = event.target as Element;

    if (element.className.includes('c-hamburger')
      || element.className.includes('transition')
      || element.className.includes('fa-expand')
      || element.className.includes('fa-compress')
      || element.className.includes('grid-button')) {
      setTimeout(() => {
        $('.application-collapse-view').each(function () {
          $(this).css('width', ($('.application-review-matrix').width()! - 50) + 'px');
        });
        this.redrawTable();
      }, 500);
      return;
    }

    if (!element.className.includes('notification-select')
      && !element.className.includes('notification-change')
      && !element.className.includes('review-notification')) {
      if (this.activeApplicantNotificationIndex !== -1) {
        delete this.applicants![this.activeApplicantNotificationIndex].notifying;
      }
    }

    if (!$(element).closest('.reviewer-name').length
      && !$(element).closest('.reviewer-bubble').length && !$(element).closest('.review-report').length) {
      if ($('.reviewer-bubble.show').length) {
        $('.reviewer-bubble').removeClass('show');
        this.activeApplicantIndex = -1;
        this.activeReviewerIndex = -1;
      }
    }
  }

  redrawTable() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.columns.adjust();
      $('.application-collapse-view').each(function () {
        $(this).css('width', ($('.application-review-matrix').width()! - 50) + 'px');
      });
    });
  }

  onArchiveYearChange(year: string) {
    this.yearForReviews = +year;
    this.buildReviewTable();
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

  filterReviewer(reviewerIdx: number) {
    let reviewersColumnsIdx = 6;
    const visibleReviewerColumns: number[] = [];

    for (let i = 0; i < this.applicants![0].reviewers.length; i++) {
      reviewersColumnsIdx++;
      if (i !== reviewerIdx) {
        visibleReviewerColumns.push(reviewersColumnsIdx);
      }
    }

    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.columns(visibleReviewerColumns).visible(false);
    });
  }

  contactReviewer() {
    const modalRef = this.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
    modalRef.componentInstance.recipients = [this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviewer.email];
    modalRef.componentInstance.emailFrom = this.userProfileService.user!.email;
    modalRef.componentInstance.modalTitle =
      this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviewer.firstname
        && this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviewer.lastname ?
        'Contact reviewer ' + this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviewer.firstname
        + ' ' + this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviewer.lastname
        : 'Contact reviewer ' + this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviewer.email;

    if ($('.reviewer-bubble').length) {
      $('.reviewer-bubble').removeClass('show');
      this.activeApplicantIndex = -1;
      this.activeReviewerIndex = -1;
    }
  }

  openReviewModal(content: any, applicantIdx: number, _event: any) {
    if (this.user!.role !== 'Referent') {
      return;
    }

    if ($('.reviewer-bubble').length) {
      $('.reviewer-bubble').removeClass('show');
    }

    this.activeApplicantIndex = applicantIdx;

    /* initialize the modal to match the selected applicant */
    this.appReviewForm.setValue({
      'textarea-review-comment': this.applicants![applicantIdx].deliberation.comments,
      'review-status': this.applicants![applicantIdx].deliberation.status,
      'textarea-review-notes': this.applicants![applicantIdx].deliberation.notes,
      'review-final-recommendation': this.applicants![applicantIdx].deliberation.recommendation
    });

    this.modalWindow = this.modalService.open(content, { windowClass: 'modal-review-edit', size: 'xl' });
    this.modalWindow.result.then((_result) => {
      this.activeApplicantIndex = -1;
      this.activeReviewerIndex = -1;
    }, (_reason) => {
      this.activeApplicantIndex = -1;
      this.activeReviewerIndex = -1;
    });
  }

  updateReferentReview(fromModal: boolean, applicantIdx: number) {
    if (fromModal) {
      this.applicants![applicantIdx].deliberation.comments = this.appReviewForm.value['textarea-review-comment'];
      this.applicants![applicantIdx].deliberation.status = this.appReviewForm.value['review-status'];
      this.applicants![applicantIdx].deliberation.notes = this.appReviewForm.value['textarea-review-notes'];
      this.applicants![applicantIdx].deliberation.recommendation = this.appReviewForm.value['review-final-recommendation'];
    }

    const referentReview: { [key: string]: any } = {};
    referentReview['deliberation'] = this.applicants![applicantIdx].deliberation;
    referentReview['index'] = applicantIdx;
    localStorage.setItem('review', JSON.stringify(referentReview));

    this.reviewService.updateReview(this.applicants![applicantIdx].communityId, this.applicants![applicantIdx]['_id'], this.isSeniorExpert,
      undefined, undefined, this.applicants![applicantIdx].deliberation, undefined).subscribe({
        next: updatedReview => {
          // update the table view
          if (fromModal) {
            this.updateTableView(applicantIdx, updatedReview);
          }
          localStorage.removeItem('review');

          if (fromModal) {
            this.modalWindow.close('Updated applicant review by Referent!');
          }

          this.activeApplicantIndex = -1;
          this.activeReviewerIndex = -1;
        },
        error: error => {
          this.alertService.danger(error);

          this.activeApplicantIndex = -1;
          this.activeReviewerIndex = -1;
        }
    });
  }

  changeReviewNotification(applicantIdx: number) {
    if (this.activeApplicantNotificationIndex !== -1) {
      delete this.applicants![this.activeApplicantNotificationIndex].notifying;
    }
    this.applicants![applicantIdx].notifying = 1;
    this.activeApplicantNotificationIndex = applicantIdx;
    setTimeout(() => {
      this.redrawTable();
    }, 500);
  }

  onReviewNotificationChange(newValue: string, applicantIdx: number) {
    const oldValue = this.applicants![applicantIdx].notification;
    this.applicants![applicantIdx].notification = newValue;
    if (this.activeApplicantNotificationIndex !== -1) {
      delete this.applicants![this.activeApplicantNotificationIndex].notifying;
      this.activeApplicantNotificationIndex = -1;
    }

    const reviewNotification: { [key: string]: any } = {};
    reviewNotification['notification'] = this.applicants![applicantIdx].notification;
    reviewNotification['index'] = applicantIdx;
    localStorage.setItem('review', JSON.stringify(reviewNotification));

    this.reviewService.updateReview(this.applicants![applicantIdx].communityId, this.applicants![applicantIdx]['_id'], this.isSeniorExpert,
      undefined, undefined, undefined, this.applicants![applicantIdx].notification).subscribe({
        next: _updatedReview => {
          localStorage.removeItem('review');
        },
        error: error => {
          this.applicants![applicantIdx].notification = oldValue;
          this.alertService.danger(error);
        }
    });
  }

  updateNotesAboutApplicant(applicantIdx: number) {
    const notesAboutApplicant: { [key: string]: any } = {};
    notesAboutApplicant['notes'] = this.applicants![applicantIdx].notesAboutApplicant;
    notesAboutApplicant['index'] = applicantIdx;
    localStorage.setItem('review', JSON.stringify(notesAboutApplicant));

    this.reviewService.updateReview(
      this.applicants![applicantIdx].communityId, this.applicants![applicantIdx]['_id'], this.isSeniorExpert,
      this.applicants![applicantIdx].notesAboutApplicant,
      undefined, undefined, undefined
    ).subscribe({
      next: _updatedReview => {
        localStorage.removeItem('review');
      },
      error: error => {
        this.alertService.danger(error);
      }
    });
  }

  updateTableView(applicantIdx: number, updatedReview: Review) {
    for (const reviewer of this.applicants![applicantIdx].reviewers) {
      for (const rev of updatedReview.reviewers) {
        if (rev.reviewer === reviewer.reviewer['_id']) {
          reviewer.reviews = rev.reviews;
          reviewer.rating = rev.rating;
          reviewer.comments = rev.comments;
          break;
        }
      }
    }

    this.applicants![applicantIdx].rate['strong-accept'] = updatedReview.rate['strong-accept'];
    this.applicants![applicantIdx].rate['weak-accept'] = updatedReview.rate['weak-accept'];
    this.applicants![applicantIdx].rate['fair'] = updatedReview.rate['fair'];
    this.applicants![applicantIdx].rate['weak-reject'] = updatedReview.rate['weak-reject'];
    this.applicants![applicantIdx].rate['strong-reject'] = updatedReview.rate['strong-reject'];

    this.applicants![applicantIdx].rate['total-score'] = updatedReview.rate['total-score'];
    this.applicants![applicantIdx].rate['rate-count'] = updatedReview.rate['rate-count'];
    this.applicants![applicantIdx].rate['review-count'] = updatedReview.rate['review-count'];
    this.applicants![applicantIdx].rate['avg-score'] = updatedReview.rate['avg-score'];
    this.applicants![applicantIdx].rate['std-dev-score'] = updatedReview.rate['std-dev-score'];

    this.applicants![applicantIdx].deliberation.comments = updatedReview.deliberation.comments;
    this.applicants![applicantIdx].deliberation.status = updatedReview.deliberation.status;
    this.applicants![applicantIdx].deliberation.recommendation = updatedReview.deliberation.recommendation;

    this.applicants![applicantIdx].notification = updatedReview.notification;

    // Update now the collapsed view if open
    if ($(`.dataTables_scrollBody table tbody tr.details-${applicantIdx} td.details-${applicantIdx}`).length) {
      const activeTab = $(`input:radio[name=tabs-${applicantIdx}]:checked`).val();

      this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        const self = this;
        dtInstance.rows().every(function (rowIdx, _tableLoop, _rowLoop) {
          if (self.applicants![rowIdx].formId === updatedReview.formId) {
            const data = this.data();
            $(`.dataTables_scrollBody table tbody tr.details-${applicantIdx} td.details-${applicantIdx}`).html(self.format(data));
            $(`.dataTables_scrollBody table tbody tr.details-${applicantIdx} td.details-${applicantIdx} .application-collapse-view`).css('width', ($('.application-review-matrix').width()! - 50) + 'px');
            $(`input:radio[name=tabs-${applicantIdx}][value=${activeTab}]`).prop('checked', true);
          }
        });
      });
    }
  }

  format(row: any) {
    let applicantExpertiseProfile = '';
    const userAppFormData = this.applicants![row[RAW_DATA_INDEX]].userAppFormData;
    for (const p in userAppFormData) {
        if (userAppFormData[p].type === 'textarea' || userAppFormData[p].type === 'input-text' || userAppFormData[p].type === 'select') {
          applicantExpertiseProfile += `<div class="form-question"><strong>${userAppFormData[p].options.preview}</strong></div>`;
          applicantExpertiseProfile += `<div class="user-response mt-1">${userAppFormData[p].answer}</div>`;

        } else if (userAppFormData[p].type === 'battery-levels') {
          applicantExpertiseProfile += `<div class="form-question"><strong>${userAppFormData[p].options.preview}</strong></div>`;
          applicantExpertiseProfile += `<div class="user-response mt-1"><div class="row battery-levels-bottom-spacing">`;
          for (const item of userAppFormData[p].options.items) {
            applicantExpertiseProfile += `
                            <div class="col-xs-9 col-sm-9 col-md-8 col-lg-6 col-xl-4" style="margin-left:10px">
                                <label> ${item.label} </label>
                            </div>
                            <div class="col-xs-2 col-sm-2 col-md-3 col-lg-5 col-xl-7" style="margin-left:10px">`;
            if (userAppFormData[p].answer[item.name] === 'battery-0') {
              applicantExpertiseProfile += `<span class="battery-0"><i class="fa fa-battery-0"></i></span>`;
            } else if (userAppFormData[p].answer[item.name] === 'battery-1') {
              applicantExpertiseProfile += `<span class="battery-1"><i class="fa fa-battery-1"></i></span>`;
            } else if (userAppFormData[p].answer[item.name] === 'battery-2') {
              applicantExpertiseProfile += `<span class="battery-2"><i class="fa fa-battery-2"></i></span>`;
            } else if (userAppFormData[p].answer[item.name] === 'battery-3') {
              applicantExpertiseProfile += `<span class="battery-3"><i class="fa fa-battery-3"></i></span>`;
            } else if (userAppFormData[p].answer[item.name] === 'battery-4') {
              applicantExpertiseProfile += `<span class="battery-4"><i class="fa fa-battery-4"></i></span>`;
            } else {
              applicantExpertiseProfile += 'not answered';
            }

            applicantExpertiseProfile += `</div>`;

          }

          applicantExpertiseProfile += `</div></div>`;

        } else if (userAppFormData[p].type === 'input-checkboxes') {
          applicantExpertiseProfile += `<div class="form-question"><strong>${userAppFormData[p].options.preview}</strong></div>`;
          applicantExpertiseProfile += `<div class="user-response mt-1" style="pointer-events: none;">
                                          <div class="row">
                                            <div class="col-md-5">
                                              <ul>`;

          for (const item of userAppFormData[p].options.items.left) {
            if (userAppFormData[p].answer[item.name]) {
              applicantExpertiseProfile += `<li>${item.label}</li>`;
            }
          }

          applicantExpertiseProfile += '</ul></div><div class="col-md-5"><ul>';

          for (const item of userAppFormData[p].options.items.right) {
            if (userAppFormData[p].answer[item.name]) {
              applicantExpertiseProfile += `<li>${item.label}</li>`;
            }
          }

          applicantExpertiseProfile += '</ul></div></div></div>';

        } else {
          applicantExpertiseProfile += `<div class="form-question"><strong>${userAppFormData[p].label}</strong></div>
                                        <div class="user-response">${userAppFormData[p].answer}</div>`;
        }
    }


    let reviewersHTML = '<ul class="collapse-list">';
    let idx = 0;
    for (const reviewer of this.applicants![row[RAW_DATA_INDEX]].reviewers) {
      if (reviewer.reviews === 'yes') {
        reviewersHTML += `
        <li class="item-${row[RAW_DATA_INDEX]}-${idx}">
          <input class="collapse-open" type="checkbox" id="collapse-${row[RAW_DATA_INDEX]}-${idx}">
          <label class="collapse-btn" for="collapse-${row[RAW_DATA_INDEX]}-${idx}">
            <span class="text-capitalize">
              ${reviewer.reviewer.firstname && reviewer.reviewer.lastname ?
            reviewer.reviewer.firstname + ' ' + reviewer.reviewer.lastname.toUpperCase() : reviewer.reviewer.email}
            </span>
          </label>
          <div class="collapse-panel">
            <div class="collapse-inner">
              <div class="stars rate read-only">
                <span class="rating">Rate: ${reviewer.rating.rate ? '(' + reviewer.rating.rate + ')' : ''}</span>
                <input class="star star-5" id="star-5-${row[RAW_DATA_INDEX]}-${idx}-5" type="radio" name="star-${row[RAW_DATA_INDEX]}-${idx}" value="+2" ${reviewer.rating.rate === '+2' ? 'checked' : ''} />
                <label class="star star-5" for="star-5-${row[RAW_DATA_INDEX]}-${idx}-5"></label>
                <input class="star star-4" id="star-4-${row[RAW_DATA_INDEX]}-${idx}-4" type="radio" name="star-${row[RAW_DATA_INDEX]}-${idx}" value="+1" ${reviewer.rating.rate === '+1' ? 'checked' : ''} />
                <label class="star star-4" for="star-4-${row[RAW_DATA_INDEX]}-${idx}-4"></label>
                <input class="star star-3" id="star-3-${row[RAW_DATA_INDEX]}-${idx}-3" type="radio" name="star-${row[RAW_DATA_INDEX]}-${idx}" value="0" ${reviewer.rating.rate === '0' ? 'checked' : ''} />
                <label class="star star-3" for="star-3-${row[RAW_DATA_INDEX]}-${idx}-3"></label>
                <input class="star star-2" id="star-2-${row[RAW_DATA_INDEX]}-${idx}-2" type="radio" name="star-${row[RAW_DATA_INDEX]}-${idx}" value="-1" ${reviewer.rating.rate === '-1' ? 'checked' : ''} />
                <input class="star star-1" id="star-1-${row[RAW_DATA_INDEX]}-${idx}-1" type="radio" name="star-${row[RAW_DATA_INDEX]}-${idx}" value="-2" ${reviewer.rating.rate === '-2' ? 'checked' : ''} />
                <label class="star star-2" for="star-2-${row[RAW_DATA_INDEX]}-${idx}-2"></label>
                <label class="star star-1" for="star-1-${row[RAW_DATA_INDEX]}-${idx}-1"></label>

              </div>
              <div class="form-group comments mt-1">
                <label class="form-control-label" for="textarea-reviewer-comment">Comments:</label>
                <textarea id="textarea-reviewer-comment" name="textarea-reviewer-comment" class="form-control" readonly placeholder="Write your comments on the applicant to justify your rate...">${reviewer.comments || ''}</textarea>
              </div>
            </div>
          </div>
        </li>`;
      }
      idx++;
    }
    reviewersHTML += '</ul>';


    let applicantRateHTML = '<div class="applicant-rate"><label>Final rate (total - mean - std. dev.):</label>';
    if (this.applicants![row[RAW_DATA_INDEX]].rate['total-score'] !== '' && this.applicants![row[RAW_DATA_INDEX]].rate['avg-score'] !== ''
      && this.applicants![row[RAW_DATA_INDEX]].rate['std-dev-score'] !== '') {
      if (this.applicants![row[RAW_DATA_INDEX]].rate['total-score'] > 0) {
        applicantRateHTML += `<span class="accepted">${this.applicants![row[RAW_DATA_INDEX]].rate['total-score']}</span><span class="accepted">${this.applicants![row[RAW_DATA_INDEX]].rate['avg-score']}</span><span>${this.applicants![row[RAW_DATA_INDEX]].rate['std-dev-score']}</span></div>`;
      } else if (this.applicants![row[RAW_DATA_INDEX]].rate['total-score'] === 0) {
        applicantRateHTML += `<span class="fair">${this.applicants![row[RAW_DATA_INDEX]].rate['total-score']}</span><span class="fair">${this.applicants![row[RAW_DATA_INDEX]].rate['avg-score']}</span><span>${this.applicants![row[RAW_DATA_INDEX]].rate['std-dev-score']}</span></div>`;
      } else {
        applicantRateHTML += `<span class="refused">${this.applicants![row[RAW_DATA_INDEX]].rate['total-score']}</span><span class="refused">${this.applicants![row[RAW_DATA_INDEX]].rate['avg-score']}</span><span>${this.applicants![row[RAW_DATA_INDEX]].rate['std-dev-score']}</span></div>`;
      }
    } else {
      applicantRateHTML += '&nbsp;&nbsp;not rated yet.</div>';
    }


    let applicantRecommendationHTML = '<div class="applicant-status">';
    if (this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation === 'Approved') {
      applicantRecommendationHTML += `<span class="accepted">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation}</span></div>`;
    } else if (this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation === 'Rejected') {
      applicantRecommendationHTML += `<span class="refused">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation}</span></div>`;
    } else {
      applicantRecommendationHTML += `<span class="pending">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation ? this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation : 'recommendation: none'}</span> <span>${this.applicants![row[RAW_DATA_INDEX]].deliberation.status ? this.applicants![row[RAW_DATA_INDEX]].deliberation.status : 'status: none'}</span></div>`;
    }


    const sectionDeliberationHeader = `
        <input id="tab3-${row[RAW_DATA_INDEX]}" class="tab3" type="radio" name="tabs-${row[RAW_DATA_INDEX]}" value="tab3">
        <label for="tab3-${row[RAW_DATA_INDEX]}">Deliberation</label>
      `;
    const sectionDeliberationContent = `
        <section class="content3">
          <div class="section-part">
            <div class="section-part-header">
              <h6 style="width:auto;float:none;"}>
                <i class="fa fa-angle-right" aria-hidden="true"></i>
                <span>
                Deliberation for ${this.applicants![row[RAW_DATA_INDEX]].applicant.lastname} ${this.applicants![row[RAW_DATA_INDEX]].applicant.firstname.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase())}
                </span>
              </h6>
            </div>
            <div class="deliberation row">
              ${applicantRecommendationHTML}
              <div class="form-group comments">
                <label class="form-control-label" for="textarea-deliberation-comments">Comments:</label>
                <textarea id="textarea-deliberation-comments" name="textarea-deliberation-comments" class="form-control" readonly placeholder="Write your comments on the applicant...">${this.applicants![row[RAW_DATA_INDEX]].deliberation.comments}</textarea>
              </div>

              <div class="form-group notes mt-1">
                <label class="form-control-label" for="textarea-deliberation-notes">Notes:</label>
                <textarea id="textarea-deliberation-notes" name="textarea-deliberation-notes" class="form-control" readonly placeholder="Some notes for the final recommendation...">${this.applicants![row[RAW_DATA_INDEX]].deliberation.notes}</textarea>
              </div>

              <div class="form-group select-items">
                <div class="status">
                  <label class="form-control-label" for="review-status">Status:</label>
                  <select id="review-status" class="form-control" name="review-status">
                      <option value="">Please select</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="To be discussed">To be discussed</option>
                      <option value="Waiting for info">Waiting for info</option>
                      <option value="Low cotribution">Low cotribution</option>
                      <option value="Next year(s)">Candidate next year(s)</option>
                      <option value="Maybe">Maybe</option>
                  </select>
                </div>
                <div class="recommendation">
                  <label class="form-control-label" for="review-final-recommendation">Final recommendation:</label>
                  <select id="review-final-recommendation" class="form-control" name="review-final-recommendation">
                      <option value="">Please select</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </section>
      `;


    let appFormsListHTML = '<ul class="collapse-list">';
    let idxx = 0;
    let submitDate;
    const history = this.applicants![row[RAW_DATA_INDEX]].applicant.history.map((x: any) => x);
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
          <input class="collapse-open" type="checkbox" id="collapse-${row[3]}-${idxx}">
          <label class="collapse-btn" for="collapse-${row[3]}-${idxx}">
            <span ${appform.formType.endsWith('senior') ? 'style="color: #3498db;"' : ''}>${appform.community + ' @ ' + appform.year}</span>`;

      if (this.user!.role === 'Referent' && appform.submittedAt && appform.year !== this.yearForReviews) {
        appFormsListHTML += `
            <a href="/${this.urlPrefix}/dashboard/${this.isSeniorExpert ? 'senior-' : ''}archive/review/${appform.formId}/${appform.communityId}" target="_blank" role="button" class="btn btn-view-past-application"><i class="fa fa-external-link" aria-hidden="true"></i> &nbsp;View review</a>`;
      }

      appFormsListHTML += `
            <a href="/${this.urlPrefix}/application/appform/${appform.formId}/${appform.communityId}/${appform.formType}" target="_blank" role="button" class="btn btn-view-past-application"><i class="fa fa-external-link" aria-hidden="true"></i> &nbsp;View application</a>
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
                  <div class="right-item">${appform.formType.replace('-s', ' S').replace('renew', 'renewal')}</div>
                  <div class="left-item"><strong>Last updated after submission</strong></div>
                  <div class="right-item">${submitDate}</div>
                 </div>
              </div>
            </div>
          </div>
        </li>`;

      idxx++;
    }
    appFormsListHTML += '</ul>';

    return `
      <main class="application-collapse-view">
        <input id="tab1-${row[RAW_DATA_INDEX]}" class="tab1" type="radio" name="tabs-${row[RAW_DATA_INDEX]}" checked value="tab1">
        <label for="tab1-${row[RAW_DATA_INDEX]}">Application</label>

        <input id="tab2-${row[RAW_DATA_INDEX]}" class="tab2" type="radio" name="tabs-${row[RAW_DATA_INDEX]}" value="tab2">
        <label for="tab2-${row[RAW_DATA_INDEX]}">Reviewers</label>

        ${sectionDeliberationHeader}

        <section class="content1">
          <div class="applicant-info section-part">
            <h6><i class="fa fa-angle-right" aria-hidden="true"></i><span class="text-capitalize">${row[1].toUpperCase()}${row[2]}</span></h6>

            <div class="content-body">
              <ul class="collapse-list mb-1">
                <li class="applicant-profile-${row[RAW_DATA_INDEX]}">
                  <input class="collapse-open" type="checkbox" id="collapse-applicant-profile-${row[RAW_DATA_INDEX]}">
                  <label class="collapse-btn" for="collapse-applicant-profile-${row[RAW_DATA_INDEX]}">
                    Applicant's profile
                  </label>
                  <div class="collapse-panel">
                    <div class="collapse-inner">
                      <div class="about-applicant">
                        <i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i> &nbsp;&nbsp;Loading...
                      </div>
                    </div>
                  </div>
                </li>
                <li class="notes-for-reviewers-${row[RAW_DATA_INDEX]}">
                  <input class="collapse-open" type="checkbox" id="collapse-notes-for-reviewers-${row[RAW_DATA_INDEX]}">
                  <label class="collapse-btn" for="collapse-notes-for-reviewers-${row[RAW_DATA_INDEX]}">
                    Notes about the applicant
                    <button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-notes-for-reviewers-edit"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit</button>
                    <button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-outline-primary btn-notes-for-reviewers-update"><i class="fa fa-refresh" aria-hidden="true"></i> &nbsp;Update</button>
                  </label>

                  <div class="collapse-panel">
                    <div class="collapse-inner">
                      <div class="comments">
                        <i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i> &nbsp;&nbsp;Loading...
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="applicant-skills section-part">
            <div class="section-part-header">
              <h6><i class="fa fa-angle-right" aria-hidden="true"></i>
                <span>
                ${this.applicants![row[RAW_DATA_INDEX]].formType === 'new' ? `New ${this.isSeniorExpert ? 'Senior ' : ''}application` : `Renewal ${this.isSeniorExpert ? 'Senior ' : ''}application`}
                </span>
              </h6>
              <a href="/${(this.isSeniorExpert ? 'senior-' : '') + this.urlPrefix}/application/appform/${this.applicants![row[RAW_DATA_INDEX]].formId}/${this.applicants![row[RAW_DATA_INDEX]].communityId}/${this.applicants![row[RAW_DATA_INDEX]].formType}${this.isSeniorExpert ? '-senior' : ''}"
                target="_blank" role="button" class="btn btn-primary"><i class="fa fa-external-link" aria-hidden="true"></i> &nbsp;View application</a>
            </div>
            <div class="content-body mb-1">
              ${applicantExpertiseProfile}
            </div>
          </div>

          <div class="app-form-history section-part">
            <h6><i class="fa fa-angle-right" aria-hidden="true"></i><span>
              All application forms by the candidate
            </span></h6>

            <div class="content-body">
              ${appFormsListHTML}
            </div>
          </div>
        </section>


        <section class="content2">
          <div class="section-part">
            <div class="section-part-header">
              <h6><i class="fa fa-angle-right" aria-hidden="true"></i><span>Reviewers' decisions</span></h6>
            </div>
            ${applicantRateHTML}
            ${reviewersHTML}
          </div>
        </section>


        ${sectionDeliberationContent}

      </main>`;
  }

  userClickedHandler(tr: any, index: number): void {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      const self = this;
      const row = dtInstance.row(tr);
      const rowData = row.data() as any[];

      const el = document.createElement('a'),
        mStyle = el.style;
      mStyle.cssText = 'position:sticky;position:-webkit-sticky;position:-ms-sticky;';
      const positionStickySupport = mStyle.position.indexOf('sticky') !== -1;

      if (row.child.isShown()) {
        // This row is already open - close it
        // const collapseHeight = $(tr).next().height();
        const collapseHeight = $(`td.details-${rowData[RAW_DATA_INDEX]}`).outerHeight(true)!;
        row.child.hide();
        $(tr).removeClass('shown');
        $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! - collapseHeight);
        const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! - collapseHeight;
        $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');
        $('.DTFC_Cloned tbody tr:not(.fixed-padding, .community-group):eq(' + index + ')').next().remove();

        self.collapsedTableViews -= 1;

      } else {
        // Open this row
        self.collapsedTableViews += 1;

        row.child(self.format(rowData), 'details-' + rowData[RAW_DATA_INDEX]).show();
        $(tr).addClass('shown');

        self.reviewService.getReview(self.applicants![rowData[RAW_DATA_INDEX]].communityId, self.applicants![rowData[RAW_DATA_INDEX]]['_id'], self.isSeniorExpert).subscribe({
          next: review => {
            $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view .about-applicant`).html(`
                      <div class="left-info">
                        <div class="left-item"><strong>Full name</strong></div>
                        <div class="right-item text-primary">
                          <i class="text-capitalize">
                          ${review.applicant.lastname.toUpperCase()} ${review.applicant.firstname.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase())}
                          </i>
                        </div>
                        <div class="left-item"><strong>Gender</strong></div>
                        <div class="right-item"><i>${review.applicant.gender ? review.applicant.gender : ''}</i></div>
                        <div class="left-item"><strong>Birthday</strong></div>
                        <div class="right-item"><i>${review.applicant.birthday ? review.applicant.birthday : ''}</i></div>
                        <div class="left-item"><strong>Cu-ID</strong></div>
                        <div class="right-item"><i>${review.applicant.cuid}</i></div>
                        <div class="left-item"><strong>Email</strong></div>
                        <div class="right-item"><i>${review.applicant.email}</i></div>
                      </div>
                      <div class="right-info">
                        <div class="left-item"><strong>Phone</strong></div>
                        <div class="right-item"><i>${review.applicant.phone}</i></div>
                        <div class="left-item"><strong>Classification</strong></div>
                        <div class="right-item"><i>${review.applicant.classification}</i></div>
                        <div class="left-item"><strong>Entity</strong></div>
                        <div class="right-item"><i>${review.applicant.entity}</i></div>
                        <div class="left-item"><strong>Country</strong></div>
                        <div class="right-item"><i>${review.applicant.country}</i></div>
                        <div class="left-item"><strong>Location</strong></div>
                        <div class="right-item"><i>${review.applicant.location}</i></div>
                      </div>
              `);
            $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view .notes-for-reviewers-${rowData[RAW_DATA_INDEX]} .comments`).html(`
                <textarea id="textarea-notes-for-reviewers" name="textarea-notes-for-reviewers" class="form-control" readonly placeholder="Add some notes about the applicant for the reviewers or referent. Please write your name to let others know who writes what!">${review.notesAboutApplicant || ''}</textarea>
              `);


            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-notes-for-reviewers-edit', function (_event) {
              const applicantIdx = $(this).data('applicant');
              if ($(this).html().includes('Edit')) {
                $(this).siblings('.btn-notes-for-reviewers-update').addClass('visible');
                $(this).html('<i class="fa fa-times-circle" aria-hidden="true"></i> &nbsp;Cancel');
                $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-notes-for-reviewers').removeAttr('readonly');

              } else {
                $(this).siblings('.btn-notes-for-reviewers-update').removeClass('visible');
                $(this).html('<i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit');
                $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-notes-for-reviewers')
                  .val(self.applicants![applicantIdx].notesAboutApplicant);
                $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-notes-for-reviewers').attr('readonly', '');
              }
            });

            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-notes-for-reviewers-update', function (_event) {
              const applicantIdx = $(this).data('applicant');
              self.applicants![applicantIdx].notesAboutApplicant =
                $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-notes-for-reviewers').val();

              /** Save and sync with the back-end **/
              self.updateNotesAboutApplicant(applicantIdx);

              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-notes-for-reviewers').attr('readonly', '');
              $(this).removeClass('visible');
              $(this).siblings('.btn-notes-for-reviewers-edit')
                .html('<i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit');
            });


          },
          error: error => {
            $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view .about-applicant`).html(error);
            $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view .notes-for-reviewers-${rowData[RAW_DATA_INDEX]} .comments`).html(error);
          }
        });

        // const collapseHeight = $(tr).next().height();
        const collapseHeight = $(`td.details-${rowData[RAW_DATA_INDEX]}`).outerHeight(true)!;

        $('.DTFC_ScrollWrapper').height($('.DTFC_ScrollWrapper').height()! + collapseHeight);

        const leftWrapperHeight = $('.DTFC_LeftBodyWrapper').height()! + collapseHeight;
        $('.DTFC_LeftBodyWrapper').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').height(leftWrapperHeight);
        $('.DTFC_LeftBodyLiner').css('maxHeight', leftWrapperHeight + 'px');

        $('<tr class="fixed-padding"><td colspan="3"></td></tr>').insertAfter(
          '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding, .community-group):eq(' + index + ')'
        );
        $('.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr:not(.fixed-padding, .community-group):eq(' + index + ')').next().height(collapseHeight);

        $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view`).css('width', ($('.application-review-matrix').width()! - 50) + 'px');
        $(`tr.details-${rowData[RAW_DATA_INDEX]}`).css('background', '#F2F4F8');

        if (!positionStickySupport) {
          $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view`).css('marginLeft', $('.dataTables_scrollBody').scrollLeft()!);
          $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view`).css('top', 0);
          $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view`).css('left', 15 + 'px');
        }

      }

    });
  }

  private rowGroup(api: DataTables.Api, nbReviewers: number) {
    let last = '';
    api
    .column(6, { page: 'current' })
    .data()
    .each(function (group: any, i?: number | undefined, dt?: DataTables.Api | undefined) {
      if (last !== group) {
        if ($(`.community-group.group-${i}`).length) {
          $(`.community-group.group-${i}`).remove();
        }

        $(`<tr class="community-group group-${i}"><td colspan="3">${group}</td></tr>`).insertBefore(
          '.DTFC_LeftBodyLiner .DTFC_Cloned tbody tr.odd:eq(' + i + ')'
        );
        $(`<tr class="community-group group-${i}"><td colspan="${nbReviewers + 17}"> </td></tr>`).insertBefore(
          '.dataTables_scrollBody table tbody tr.odd:eq(' + i + ')'
        );
        last = group;
      }
    })
    .columns.adjust();
  }

  private setReviewerVisibilityBtns() {
    if (this.applicants?.length && this.applicants![0].reviewers.length) {
      const that = this;
      // Reviewers are available
      const reviewerBtns = this.applicants![0].reviewers.map((reviewer: { [key: string]: any }) => {
        const className = reviewer['reviewer'].email.split('@')[0].replace('.', '-');
        return {
          extend: 'columnToggle',
          text: this.userProfileService.formatName(reviewer['reviewer'].email, reviewer['reviewer'].firstname, reviewer['reviewer'].lastname),
          className,
          action: (_e: any, dt: DataTables.Api, node: JQuery, _config: any) => {
            $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
            if ($('.community-group').length) {
              $('.community-group').remove();
            }

            setTimeout(() => {
              let column = dt.column(`.${className}`);
              column.visible(!column.visible());
              node.toggleClass('active', column.visible());

              for (const otherReviewer of that.applicants![0].reviewers) {
                const otherClassName = otherReviewer.reviewer.email.split('@')[0].replace('.', '-');
                if (otherClassName !== className) {
                  column = dt.column(`.${otherClassName}`);
                  $(`.dt-button.${otherClassName}`).toggleClass('active', column.visible());
                }
              }

              if (that.isSeniorExpert && that.applicants!.length) {
                that.rowGroup(dt, that.applicants![0].reviewers.length);
              }
            }, 0);
          }
        };
      });

      // Update options for reviewer-specific visibility
      if (this.dtOptions.buttons[2].text === 'Reviewer visibility') {
        this.dtOptions.buttons[2].buttons = reviewerBtns;
      } else {
        this.dtOptions.buttons.splice(2, 0, {
          extend: 'collection',
          text: 'Reviewer visibility',
          className: 'reviewer-visibility',
          buttons: reviewerBtns
        });
      }

    } else {
      // Delete all options for for reviewer visibility
      if (this.dtOptions.buttons[2].text === 'Reviewer visibility') {
        this.dtOptions.buttons.splice(2, 1);
      }
    }
  }

  private setCommunityVisibilityBtns() {
    if (this.availableCommunities?.length) {
      const comunityBtns = this.availableCommunities.map((community) => {
        return {
          extend: 'columnToggle',
          text: community.name,
          className: community.id,
          action: (_e: any, dt: DataTables.Api, _node: JQuery, _config: any) => {
            $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');

            dt.destroy();
            if (sessionStorage.getItem(`filter${community.id}`)) {
              sessionStorage.removeItem(`filter${community.id}`);
              this.applicants!.push(...this.backupApplicants!.filter(a => a.communityId === community.id));
            } else {
              sessionStorage.setItem(`filter${community.id}`, '1');
              this.applicants = this.applicants!.filter(a => a.communityId !== community.id);
            }

            // Call the dtTrigger to rerender again
            this.dtTrigger.next(this.dtOptions);
          }
        };
      });

      // Update options for community-specific visibility
      const restoreVisIdx = this.dtOptions.buttons.findIndex((btn: any) => typeof btn === 'object' && btn.text === 'Restore visibility');
      if (this.dtOptions.buttons[restoreVisIdx - 1].text === 'Community visibility') {
        this.dtOptions.buttons[restoreVisIdx - 1].buttons = comunityBtns;
      } else {
        this.dtOptions.buttons.splice(restoreVisIdx, 0, {
          extend: 'collection',
          text: 'Community visibility',
          className: 'community-visibility',
          buttons: comunityBtns
        });
      }

      for (const community of this.availableCommunities) {
        if (sessionStorage.getItem(`filter${community.id}`)) {
          this.applicants = this.applicants!.filter(a => a.communityId !== community.id);
        }
      }

    } else {
      // Delete all options for for community visibility
      const idx = this.dtOptions.buttons.findIndex((btn : any) => typeof btn === 'object' && btn.text === 'Community visibility');
      if (idx !== -1) {
        this.dtOptions.buttons.splice(idx, 1);
      }
    }
  }
}
