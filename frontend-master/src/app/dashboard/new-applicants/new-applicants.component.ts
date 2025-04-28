import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
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
  templateUrl: './new-applicants.component.html',
  styleUrls: ['./new-applicants.component.scss']
})
export class NewApplicantsComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableDirective)
  private datatableElement!: DataTableDirective;

  communityFlag = 0;
  isSeniorExpert = false;

  dtOptions: any = {};
  urlPrefix: string;
  user!: User | null; /* i.e. connected user */
  isReviewer = false;
  expertCommunity!: string;
  expertCommunityId!: string;
  previewedAppFormData: any = { new: {}, renew: {} };
  applicants: any[] | null = null;
  backupApplicants: any[] | null = null;
  availableCommunities: any[] | null = null;
  reviewersVisibility!: boolean[] | null;
  yearForReviews = 1 + new Date().getFullYear();
  nbAppsToReview = 0;

  referentName!: string;
  referentMail!: string;

  isSettingsPanelCollapsed = true;

  /* Review settings */
  startReviewing = 0;
  canAssignReviewers = 0;
  lockReviewers = 0;
  visibleReviews = 0;
  hiddenColumnsFromReviewers: string[] | null = [];

  canSubmitForms = 1;
  /* /Review settings */

  refreshTableBtn = 'fa-refresh';
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
  reviewerCommentForm!: FormGroup;
  collapsedTableViews = 0;

  dtTrigger: Subject<any> = new Subject();
  tableReady = false;
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
    private route: ActivatedRoute,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    if (this.router.url.includes('/dashboard/senior-')) {
      this.isSeniorExpert = true;
    }
    this.titleService.setTitle('Review Process');

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
    const that = this;

    const flag: number = +(this.route.snapshot.paramMap.get('communityFlag') ?? '0');
    if (flag) {
      if (flag < 65536) { // '1111111111111111' + 1
        // Orange Experts!
        if (flag === FAKE_SENIOR_ORANGE_EXPERTS_FLAG) {
          // FAKE_SENIOR_ORANGE_EXPERTS_FLAG = 1111111100000000
          this.isSeniorExpert = true;
          this.communityFlag = flag;
        } else if (flag <= 128 && this.reviewService.bitCount(flag) === 1) {
          this.communityFlag = flag;
        }
      } else if (flag === 65536 && this.reviewService.bitCount(flag) === 1) {
        // Experts-DTSI
        this.communityFlag = flag;
      } else if (flag === 131072 && this.reviewService.bitCount(flag) === 1) {
        // Data-Up
        this.communityFlag = flag;
      } else {
        this.errorMessage = 'The requested content doesn\'t exist or you aren\'t authorized to view it!';
        return;
      }
    }

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

            sessionStorage.removeItem('filterNew');
            sessionStorage.removeItem('filterRenewal');

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

            if (sessionStorage.getItem('filterNew')) {
              $('.filter-new-button').removeClass('active');
            } else {
              $('.filter-new-button').addClass('active');
            }
            if (sessionStorage.getItem('filterRenewal')) {
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

          if (sessionStorage.getItem('filterNew')) {
            $('#review-new-applicants_info').html($('#review-new-applicants_info').text() + ' <b>(Displaying only renewal applications)</b>');
          } else if (sessionStorage.getItem('filterRenewal')) {
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
                action: (e: any, dt: DataTables.Api, node: JQuery, _config: any) => {
                  e.preventDefault();

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

                    if (sessionStorage.getItem('filterNew')) {
                      $('.filter-new-button').removeClass('active');
                    }
                    if (sessionStorage.getItem('filterRenewal')) {
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
                  if (sessionStorage.getItem('filterNew')) {
                    sessionStorage.removeItem('filterNew');
                    dtInstance.column(4).search('').draw();
                    $('.filter-new-button').addClass('active');
                  } else {
                    sessionStorage.setItem('filterNew', '1');
                    dtInstance.column(4)
                      .search('"renew"').draw();
                    $('.filter-new-button').removeClass('active');
                  }

                  if (sessionStorage.getItem('filterRenewal')) {
                    sessionStorage.removeItem('filterRenewal');
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
                  if (sessionStorage.getItem('filterRenewal')) {
                    sessionStorage.removeItem('filterRenewal');
                    dtInstance.column(4).search('').draw();
                    $('.filter-renewal-button').addClass('active');
                  } else {
                    sessionStorage.setItem('filterRenewal', '1');
                    dtInstance.column(4)
                      .search('^new$', true, true, false).draw();
                    $('.filter-renewal-button').removeClass('active');
                  }

                  if (sessionStorage.getItem('filterNew')) {
                    sessionStorage.removeItem('filterNew');
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
              sessionStorage.removeItem('filterNew');
              sessionStorage.removeItem('filterRenewal');
            }
          }
        },
        {
          text: 'Close all sub-panels',
          className: 'close-subpanels',
          action: (_e: any, _dt: DataTables.Api, _node: JQuery, _config: any) => {
            $('.dataTables_scrollBody tbody tr.shown td:nth-child(0n+2)').trigger('click');
          }
        },
        'selectAll',
        'selectNone',
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

    this.reviewerCommentForm = this.formBuilder.group({
      'textarea-reviewer-comment': '',
      'reviewer-rate': ''
    });
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
        this.previewedAppFormData = null;
        this.hiddenColumnsFromReviewers = null;
      });
    }
  }

  getCommunitySettings = (error: any): void => {
    if (error) {
      this.alertService.danger(error);

    } else {
      this.user = this.userProfileService.user;

      let searchCommunity: any, newForm: string, renewalForm: string, reviewers: string;

      if (this.communityFlag || this.isSeniorExpert) {
        searchCommunity = { id: 'flag', value: this.isSeniorExpert ? 1 : this.communityFlag};
      } else {
        searchCommunity = { id: 'name', operator: 'includes', value: this.userProfileService.user!.community };
      }

      if (this.isSeniorExpert) {
        newForm = 'newSeniorForm';
        renewalForm = 'renewalSeniorForm';
        reviewers = 'seniorReviewers';
      } else {
        newForm = 'newForm';
        renewalForm = 'renewalForm';
        reviewers = 'reviewers';
      }

      this.communityService.listCommunities(
        searchCommunity,
        { id: '_id', includes: 1 }, { id: 'referentName', includes: 1 }, { id: 'referentMail', includes: 1 }, { id: 'name', includes: 1 }, { id: 'flag', includes: 1 },
        { id: reviewers, includes: 1 },
        { id: newForm, includes: 1 }, { id: renewalForm, includes: 1 }).subscribe({
        next: communities => {
          if (communities.length == 0) {
            this.errorMessage = 'The requested content doesn\'t exist or you aren\'t authorized to view it!';

          } else {
            this.expertCommunityId = this.isSeniorExpert ? FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString() : communities[0]['_id'];
            this.expertCommunity = this.isSeniorExpert ? 'Senior Orange Experts' : communities[0]['name'];
            this.referentMail = communities[0]['referentMail'];
            this.referentName = communities[0]['referentName'];

            if (this.communityFlag === 0 && (this.user!.referent! & communities[0].flag)) {
              this.user!.role = 'Referent';
            } else if (this.user!.role !== 'Admin') {
              this.user!.role = 'Reviewer';
            }

            if (this.isSeniorExpert) {
              if (this.communityFlag === 0 && [FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(this.user!.referent! & FAKE_SENIOR_ORANGE_EXPERTS_FLAG)) {
                this.user!.role = 'Referent';
              } else if (this.user!.role !== 'Admin') {
                this.user!.role = 'Reviewer';
              }

              this.communityService.listReferentsByCommunityId(FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString()).subscribe({
                next: users => {
                  if (users.length) {
                    const user = users.find((u) => ((u as any).role.referent & FAKE_SENIOR_ORANGE_EXPERTS_FLAG) === FAKE_SENIOR_ORANGE_EXPERTS_FLAG);
                    if (user) {
                      this.referentName = this.userProfileService.formatName(user.email, user.firstname, user.lastname);
                      this.referentMail = user.email;
                    }
                  }
                },
                error: error => {
                  console.error(error);
                }
              });
            }

            this.isReviewer = (communities[0] as { [key: string]: any })[reviewers].includes(this.user!['_id']);

            // Get the previewed questions (used for reviewing)
            // in the new form
            for (const step of (communities[0] as { [key: string]: any })[newForm]) {
              if (step.form) {
                for (const formGrp of step.form) {
                  if (formGrp.questions) {
                    for (const question of formGrp.questions) {
                      if (question.options && question.options.review) {
                        this.previewedAppFormData.new[question.name] = {
                          label: question.label,
                          type: question.type,
                          options: question.options
                        };
                      }
                    }
                  }
                }
              }
            }
            // Get the previewed questions (used for reviewing)
            // in the renewal form
            for (const step of (communities[0] as { [key: string]: any })[renewalForm]) {
              if (step.form) {
                for (const formGrp of step.form) {
                  if (formGrp.questions) {
                    for (const question of formGrp.questions) {
                      if (question.options && question.options.review) {
                        this.previewedAppFormData.renew[question.name] = {
                          label: question.label,
                          type: question.type,
                          options: question.options
                        };
                      }
                    }
                  }
                }
              }
            }

            // Check if we are resuming from locked session
            if (localStorage.getItem('reviewSettings')) {
              const pendingReviewSettings = JSON.parse(localStorage.getItem('reviewSettings')!);

              this.reviewService.putReviewSettings(
                this.expertCommunityId, pendingReviewSettings.startReviewing, pendingReviewSettings.canAssignReviewers,
                pendingReviewSettings.lockReviewers, pendingReviewSettings.visibleReviews, pendingReviewSettings.hiddenColumnsFromReviewers
              ).subscribe({
                next: _answer => {
                  localStorage.removeItem('reviewSettings');
                },
                error: err => {
                  this.alertService.danger('Cannot save your review table settings after resuming from locked session: ' + err);
                  localStorage.removeItem('reviewSettings');
                }
              });
            }

            if (this.user!.role !== 'Referent') {
              /* Reviewers/Admins have less options than Referent! */
              this.dtOptions.buttons[1].buttons.splice(0, 3);

              // Remove button Notify deliberation(s)
              this.dtOptions.buttons[this.dtOptions.buttons.length - 1].buttons.splice(2, 1);
            }


            this.reviewService.getReviewSettings(this.expertCommunityId).subscribe({
              next: settings => {
                this.startReviewing = +settings.startReviewing;
                this.canAssignReviewers = +settings.canAssignReviewers;
                this.lockReviewers = +settings.lockReviewers;
                this.visibleReviews = +settings.visibleReviews;
                if (settings.hiddenColumnsFromReviewers) {
                  this.hiddenColumnsFromReviewers = settings.hiddenColumnsFromReviewers.split(',');
                }
                this.canSubmitForms = +settings.cannotSubmitForms !== 0 ? 0 : 1;
                this.yearForReviews = +settings.cannotSubmitForms ?
                  parseInt(settings.cannotSubmitForms, 10) + 1 : (1 + new Date().getFullYear());

                if (this.user!.role === 'Referent' || this.startReviewing) {
                  this.buildReviewTable();
                } else {
                  this.errorMessage = 'The review process is not yet open. Come back later. The referent will notify you when ready.';
                }

              },
              error: err => {
                console.log(err);
                if (err === 'Forbidden.') {
                  this.errorMessage = 'The requested content doesn\'t exist or you aren\'t authorized to view it!';
                } else {
                  this.alertService.danger(err);
                }
              }
            });
          }
        },
        error: err => {
          this.alertService.danger(err);
        }
      });
    }
  }

  buildReviewTable() {
    this.reviewService.listReviews(this.expertCommunityId, false, this.isSeniorExpert, { id: 'year', operator: '$eq', value: this.yearForReviews },
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
          this.errorMessage = '';
          //this.nbAppsToReview = this.isSeniorExpert ? this.userProfileService.nbReviews.nbSeniorAppsToReview : this.userProfileService.nbReviews.nbAppsToReview;
          if (this.user!.role !== 'Referent') {
            this.nbAppsToReview = this.applicants!.filter(rev => {
              for (const reviewer of rev.reviewers) {
                if (reviewer.reviewer.email === this.user!.email
                  && reviewer.reviews === 'yes' && (reviewer.rating.rate === '' || reviewer.comments === '')) {
                  return true;
                }
              }
              return false;
            }).length;

          } else {
            this.nbAppsToReview = this.applicants!.filter(
              rev => rev.deliberation.recommendation !== 'Approved' && rev.deliberation.recommendation !== 'Rejected'
            ).length;
          }

          if (!reviews[0].reviewers.length) {
            this.errorMessage = 'You have not yet assigned reviewers. Go to the Reviewers menu for this.';
          }

          // Check if we are resuming from locked session
          if (localStorage.getItem('review')) {
            const pendingReview = JSON.parse(localStorage.getItem('review')!);

            this.reviewService.updateReview(this.applicants![pendingReview.index].communityId, this.applicants![pendingReview.index]['_id'], this.isSeniorExpert,
              pendingReview.notes, pendingReview.reviewer, pendingReview.deliberation, pendingReview.notification).subscribe({
                next: updatedReview => {
                  // update the table view
                  this.updateTableView(pendingReview.index, updatedReview);
                  localStorage.removeItem('review');

                  if (this.user!.role !== 'Referent') {
                    this.nbAppsToReview = this.applicants!.filter(rev => {
                      for (const reviewer of rev.reviewers) {
                        if (reviewer.reviewer.email === this.user!.email
                          && reviewer.reviews === 'yes' && (reviewer.rating.rate === '' || reviewer.comments === '')) {
                          return true;
                        }
                      }
                      return false;
                    }).length;
                    this.userProfileService.getProfile(() => { });
                  } else {
                    this.nbAppsToReview = this.applicants!.filter(
                      rev => rev.deliberation.recommendation !== 'Approved' && rev.deliberation.recommendation !== 'Rejected'
                    ).length;
                    this.userProfileService.updateNbAppsToReview(this.isSeniorExpert ?
                      {nbSeniorAppsToReview: this.nbAppsToReview} : {nbAppsToReview: this.nbAppsToReview});
                  }
                },
                error: error => {
                  this.alertService.danger('Cannot save your review data after resuming from locked session: ' + error);
                  localStorage.removeItem('review');
                }
            });
          }

        } else {
          if (this.canSubmitForms) {
            this.errorMessage = 'No reviews available for the moment. The recruitment campaign is still ongoing.';
          } else {
            if (this.user!.role === 'Referent') {
              this.populateReviews();
            } else {
              this.errorMessage = 'The review collection is not yet built. Come back later. The referent will notify you when ready.';
            }
          }
        }
      },
      error: error => {
        this.errorMessage = error;
      }
    });
  }

  populateReviews() {
    this.reviewService.buildReviewCollection(this.expertCommunityId, this.isSeniorExpert).subscribe({
      next: reviews => {
        if (reviews.length) {
          this.reviewersVisibility = Array(reviews[0].reviewers.length).fill(true);
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
          this.errorMessage = '';
          if (this.user!.role === 'Referent') {
            this.nbAppsToReview = this.applicants!.filter(
              rev => rev.deliberation.recommendation !== 'Approved' && rev.deliberation.recommendation !== 'Rejected'
            ).length;
            this.userProfileService.updateNbAppsToReview(this.isSeniorExpert ?
              {nbSeniorAppsToReview: this.nbAppsToReview} : {nbAppsToReview: this.nbAppsToReview});
          }

          if (!reviews[0].reviewers.length) {
            this.errorMessage = 'You have not yet assigned reviewers. Go to the Reviewers menu for this.';
          }
        } else {
          this.errorMessage = 'No reviews available.';
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

  refreshReviewTable(event: any) {
    this.tableReady = false;
    this.errorMessage = '';
    if (event) {
      event.target.disabled = true;
    }
    this.refreshTableBtn = 'fa-spinner fa-pulse fa-fw';

    this.reviewService.rebuildReviewCollection(this.expertCommunityId, this.isSeniorExpert).subscribe({
      next: reviews => {
        if (reviews.length > 0) {
          this.reviewersVisibility!.fill(true);
          this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
            // Destroy the table first
            dtInstance.destroy();
            this.applicants = null;
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
            // Call the dtTrigger to rerender again
            this.dtTrigger.next(this.dtOptions);
            this.tableReady = true;
            if (!reviews[0].reviewers.length) {
              this.errorMessage = 'You have not yet assigned reviewers. Go to the Reviewers menu for this.';
            }
          });

          if (event) {
            event.target.disabled = false;
          }
          this.refreshTableBtn = 'fa-refresh';

          if (this.user!.role === 'Referent') {
            this.userProfileService.getNbAppsToReview(() => {
              this.nbAppsToReview = this.isSeniorExpert ? this.userProfileService.nbReviews.nbSeniorAppsToReview : this.userProfileService.nbReviews.nbAppsToReview;
            });
          }

        } else {
          this.errorMessage = 'No reviews available.';
        }
      },
      error: error => {
        this.errorMessage = error;
        if (event) {
          event.target.disabled = false;
        }
        this.refreshTableBtn = 'fa-refresh';
      }
    });
  }

  getReview(applicantIdx: number) {
    this.reviewService.getReview(this.applicants![applicantIdx].communityId, this.applicants![applicantIdx]['_id'], this.isSeniorExpert).subscribe({
      next: review => {
        this.applicants![applicantIdx].reviewers = review.reviewers;
        this.updateTableView(applicantIdx, review);
      },
      error: error => {
        this.alertService.danger(error);
      }
    });
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

  onStartReviewingChange(event: any) {
    this.startReviewing = event ? 1 : 0;

    const settings: { [key: string]: any } = {};
    settings['startReviewing'] = this.startReviewing;
    localStorage.setItem('reviewSettings', JSON.stringify(settings));

    this.reviewService.putReviewSettings(
      this.expertCommunityId, this.startReviewing, undefined, undefined, undefined, undefined
    ).subscribe({
      next: _answer => {
        localStorage.removeItem('reviewSettings');
      },
      error: error => {
        this.alertService.danger(error);
      }
    });
  }

  onCanAssignReviewersChange(event: any) {
    this.canAssignReviewers = event ? 1 : 0;

    const settings: { [key: string]: any } = {};
    settings['canAssignReviewers'] = this.canAssignReviewers;
    localStorage.setItem('reviewSettings', JSON.stringify(settings));

    this.reviewService.putReviewSettings(
      this.expertCommunityId, undefined, this.canAssignReviewers, undefined, undefined, undefined
    ).subscribe({
      next: _answer => {
        localStorage.removeItem('reviewSettings');
      },
      error: error => {
        this.alertService.danger(error);
      }
    });
  }

  onLockReviewersChange(event: any) {
    this.lockReviewers = event ? 1 : 0;

    const settings: { [key: string]: any } = {};
    settings['lockReviewers'] = this.lockReviewers;
    localStorage.setItem('reviewSettings', JSON.stringify(settings));

    this.reviewService.putReviewSettings(this.expertCommunityId, undefined, undefined, this.lockReviewers, undefined, undefined).subscribe({
      next: _answer => {
        localStorage.removeItem('reviewSettings');
      },
      error: error => {
        this.alertService.danger(error);
      }
    });
  }

  onVisibleReviewsChange(event: any) {
    this.visibleReviews = event ? 1 : 0;

    const settings: { [key: string]: any } = {};
    settings['visibleReviews'] = this.visibleReviews;
    localStorage.setItem('reviewSettings', JSON.stringify(settings));

    this.reviewService.putReviewSettings(this.expertCommunityId, undefined, undefined, undefined, this.visibleReviews, undefined).subscribe({
      next: _answer => {
        localStorage.removeItem('reviewSettings');
      },
      error: error => {
        this.alertService.danger(error);
      }
    });
  }

  addColumnsAsHidden(colName: string) {
    const i = this.hiddenColumnsFromReviewers!.indexOf(colName);
    if (i !== -1) {
      this.hiddenColumnsFromReviewers!.splice(i, 1);
    } else {
      this.hiddenColumnsFromReviewers!.push(colName);
    }
  }

  hideColumnsDropdownStateChange(event: any) {
    if (!event) {
      const settings: { [key: string]: any } = {};
      settings['hiddenColumnsFromReviewers'] = this.hiddenColumnsFromReviewers!.toString();
      localStorage.setItem('reviewSettings', JSON.stringify(settings));

      this.reviewService.putReviewSettings(
        this.expertCommunityId, undefined, undefined, undefined, undefined, this.hiddenColumnsFromReviewers!.toString()
      ).subscribe({
        next: _answer => {
          localStorage.removeItem('reviewSettings');
        },
        error: error => {
          this.alertService.danger(error);
        }
      });
    }
  }

  onReviewerAssignmentChange(newValue: string) {
    this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].reviews = newValue;

    setTimeout(() => {
      $('.reviewer-bubble').css('left', (this.bubbleOffsetLeft - ($('.dataTables_scrollBody').scrollLeft()! - this.horizontalScrollLeft) - $('.reviewer-bubble').width()! / 2 + $('td.reviewer-name').width()! / 2) + 'px');
      $('.reviewer-bubble').css('top', (this.bubbleOffsetTop - ($('.card-block.widget-body.new-applications').scrollTop()! - this.verticalScrollTop) - $('.reviewer-bubble').height()!) + 'px');
    }, 100);

    this.updateReviewerData(false, this.activeApplicantIndex, this.activeReviewerIndex);
  }

  onReviewerRateChange(newValue: string) {
    this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].rating.rate = newValue;

    this.updateReviewerData(false, this.activeApplicantIndex, this.activeReviewerIndex);
  }

  contactAllReviewers() {
    if ($('.reviewer-bubble').length) {
      $('.reviewer-bubble').removeClass('show');
      this.activeApplicantIndex = -1;
      this.activeReviewerIndex = -1;
    }

    const recipients = [];
    for (const reviewer of this.applicants![0].reviewers) {
      recipients.push(reviewer.reviewer.email);
    }
    const modalRef = this.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
    modalRef.componentInstance.recipients = recipients;
    modalRef.componentInstance.emailFrom = this.userProfileService.user!.email;
    modalRef.componentInstance.modalTitle = 'Contact all the reviewers';
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

  contactReferent() {
    const modalRef = this.modalService.open(MailComposeComponent, { windowClass: 'modal-mail-compose' });
    modalRef.componentInstance.recipients = [this.referentMail];
    modalRef.componentInstance.emailFrom = this.userProfileService.user!.email;
    modalRef.componentInstance.modalTitle = 'Contact ' + this.referentName;
  }

  openReviewerModal(content: any, _event: any) {
    if ($('.reviewer-bubble').length) {
      $('.reviewer-bubble').removeClass('show');
    }

    /* initialize the reviewer modal to match the selected reviewer and applicant */
    this.reviewerCommentForm.setValue({
      'textarea-reviewer-comment': this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].comments,
      'reviewer-rate': this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].rating.rate
    });

    this.modalWindow = this.modalService.open(content, { windowClass: 'modal-reviewer-edit', size: 'xl' });
    this.modalWindow.result.then((_result) => {
      this.activeApplicantIndex = -1;
      this.activeReviewerIndex = -1;
    }, (_reason) => {
      this.activeApplicantIndex = -1;
      this.activeReviewerIndex = -1;
    });
  }

  updateReviewerComment() {
    this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].comments =
      this.reviewerCommentForm.value['textarea-reviewer-comment'];
    this.applicants![this.activeApplicantIndex].reviewers[this.activeReviewerIndex].rating.rate =
      this.reviewerCommentForm.value['reviewer-rate'];
    // this.modalWindow.close('Updated reviewer comments!');

    this.updateReviewerData(true, this.activeApplicantIndex, this.activeReviewerIndex);
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
          this.nbAppsToReview = this.applicants!.filter(
            rev => rev.deliberation.recommendation !== 'Approved' && rev.deliberation.recommendation !== 'Rejected'
          ).length;
          this.userProfileService.updateNbAppsToReview(this.isSeniorExpert ?
            {nbSeniorAppsToReview: this.nbAppsToReview} : {nbAppsToReview: this.nbAppsToReview});

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

  updateReviewerData(closeModal: boolean, applicantIdx: number, reviewerIdx: number) {
    const modifiedReviewer = {
      reviewer: this.applicants![applicantIdx].reviewers[reviewerIdx].reviewer['_id'],
      reviews: this.applicants![applicantIdx].reviewers[reviewerIdx].reviews,
      rating: this.applicants![applicantIdx].reviewers[reviewerIdx].rating,
      comments: this.applicants![applicantIdx].reviewers[reviewerIdx].comments
    };

    if (modifiedReviewer.rating.rate !== '') {
      this.applicants![applicantIdx].reviewers[reviewerIdx].reviews = 'yes';
      modifiedReviewer.reviews = 'yes';
    }

    const reviewerReview: { [key: string]: any } = {};
    reviewerReview['reviewer'] = modifiedReviewer;
    reviewerReview['index'] = applicantIdx;
    localStorage.setItem('review', JSON.stringify(reviewerReview));

    this.reviewService.updateReview(this.applicants![applicantIdx].communityId, this.applicants![applicantIdx]['_id'], this.isSeniorExpert,
      undefined, modifiedReviewer, undefined, undefined).subscribe({
        next: updatedReview => {
          // update the table view
          this.updateTableView(applicantIdx, updatedReview);
          localStorage.removeItem('review');

          if (this.user!.role !== 'Referent') {
            this.nbAppsToReview = this.applicants!.filter(rev => {
              for (const reviewer of rev.reviewers) {
                if (reviewer.reviewer.email === this.user!.email
                  && reviewer.reviews === 'yes'
                  && (reviewer.rating.rate === '' || reviewer.comments === '')) {
                  return true;
                }
              }
              return false;
            }).length;

            //this.userProfileService.updateNbAppsToReview(this.isSeniorExpert ?
            //  {nbSeniorAppsToReview: this.nbAppsToReview} : {nbAppsToReview: this.nbAppsToReview});
            this.userProfileService.getProfile(() => { });
          }

          if (closeModal) {
            this.modalWindow.close('Updated reviewer comments!');
            this.activeApplicantIndex = -1;
            this.activeReviewerIndex = -1;
          }

        },
        error: error => {
          this.alertService.danger(error);
          if (error.indexOf('Reviews are closed by the referent') !== -1 || error.indexOf('You cannot choose an applicant') !== -1) {
            this.applicants![applicantIdx].reviewers[reviewerIdx].reviews = modifiedReviewer.reviews;
            this.applicants![applicantIdx].reviewers[reviewerIdx].rating = modifiedReviewer.rating;
            this.applicants![applicantIdx].reviewers[reviewerIdx].comments = modifiedReviewer.comments;
            this.updateTableView(applicantIdx, this.applicants![applicantIdx]);
          }

          this.activeApplicantIndex = -1;
          this.activeReviewerIndex = -1;
        }
    });
  }

  updateTableView(applicantIdx: number, updatedReview: Review) {
    if (this.user!.role === 'Referent' || this.visibleReviews) {
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
    }

    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('strong-accept') === -1) {
      this.applicants![applicantIdx].rate['strong-accept'] = updatedReview.rate['strong-accept'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('weak-accept') === -1) {
      this.applicants![applicantIdx].rate['weak-accept'] = updatedReview.rate['weak-accept'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('fair') === -1) {
      this.applicants![applicantIdx].rate['fair'] = updatedReview.rate['fair'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('weak-reject') === -1) {
      this.applicants![applicantIdx].rate['weak-reject'] = updatedReview.rate['weak-reject'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('strong-reject') === -1) {
      this.applicants![applicantIdx].rate['strong-reject'] = updatedReview.rate['strong-reject'];
    }

    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('total-score') === -1) {
      this.applicants![applicantIdx].rate['total-score'] = updatedReview.rate['total-score'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('rate-count') === -1) {
      this.applicants![applicantIdx].rate['rate-count'] = updatedReview.rate['rate-count'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('review-count') === -1) {
      this.applicants![applicantIdx].rate['review-count'] = updatedReview.rate['review-count'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('avg-score') === -1) {
      this.applicants![applicantIdx].rate['avg-score'] = updatedReview.rate['avg-score'];
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('std-dev-score') === -1) {
      this.applicants![applicantIdx].rate['std-dev-score'] = updatedReview.rate['std-dev-score'];
    }

    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('final-review-comments') === -1) {
      this.applicants![applicantIdx].deliberation.comments = updatedReview.deliberation.comments;
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('final-review-status') === -1) {
      this.applicants![applicantIdx].deliberation.status = updatedReview.deliberation.status;
    }
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('final-review-recommendation') === -1) {
      this.applicants![applicantIdx].deliberation.recommendation = updatedReview.deliberation.recommendation;
    }

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
    const userFormData = this.applicants![row[RAW_DATA_INDEX]].userAppFormData;
    const userAppFormData = this.previewedAppFormData[this.applicants![row[RAW_DATA_INDEX]].formType];
    for (const p in userFormData) {
      if (userAppFormData.hasOwnProperty(p)) {

        if (userAppFormData[p].type === 'textarea' || userAppFormData[p].type === 'input-text' || userAppFormData[p].type === 'select') {
          applicantExpertiseProfile += `<div class="form-question">${userAppFormData[p].options.preview || userAppFormData[p].label}</div>`;
          applicantExpertiseProfile += `<div class="user-response mt-1">${userFormData[p].answer}</div>`;

        } else if (userAppFormData[p].type === 'battery-levels') {
          applicantExpertiseProfile += `<div class="form-question">${userAppFormData[p].options.preview || userAppFormData[p].label}</div>`;
          applicantExpertiseProfile += `<div class="user-response mt-1"><div class="row battery-levels-bottom-spacing">`;
          for (const item of userAppFormData[p].options.items) {
            applicantExpertiseProfile += `
                            <div class="col-xs-9 col-sm-9 col-md-8 col-lg-6 col-xl-4" style="margin-left:10px">
                                <label> ${item.label} </label>
                            </div>
                            <div class="col-xs-2 col-sm-2 col-md-3 col-lg-5 col-xl-7" style="margin-left:10px">`;
            if (userFormData[p].answer[item.name] === 'battery-0') {
              applicantExpertiseProfile += `<span class="battery-0"><i class="fa fa-battery-0"></i></span>`;
            } else if (userFormData[p].answer[item.name] === 'battery-1') {
              applicantExpertiseProfile += `<span class="battery-1"><i class="fa fa-battery-1"></i></span>`;
            } else if (userFormData[p].answer[item.name] === 'battery-2') {
              applicantExpertiseProfile += `<span class="battery-2"><i class="fa fa-battery-2"></i></span>`;
            } else if (userFormData[p].answer[item.name] === 'battery-3') {
              applicantExpertiseProfile += `<span class="battery-3"><i class="fa fa-battery-3"></i></span>`;
            } else if (userFormData[p].answer[item.name] === 'battery-4') {
              applicantExpertiseProfile += `<span class="battery-4"><i class="fa fa-battery-4"></i></span>`;
            } else {
              applicantExpertiseProfile += 'not answered';
            }

            applicantExpertiseProfile += `</div>`;

          }

          applicantExpertiseProfile += `</div></div>`;

        } else if (userAppFormData[p].type === 'input-checkboxes') {
          applicantExpertiseProfile += `<div class="form-question">${userAppFormData[p].options.preview || userAppFormData[p].label}</div>`;
          applicantExpertiseProfile += `<div class="user-response mt-1" style="pointer-events: none;">
                                          <div class="row">
                                            <div class="col-md-5">
                                              <ul>`;

          for (const item of userAppFormData[p].options.items.left) {
            if (userFormData[p].answer[item.name]) {
              applicantExpertiseProfile += `<li>${item.label}</li>`;
            }
          }

          applicantExpertiseProfile += '</ul></div><div class="col-md-5"><ul>';

          for (const item of userAppFormData[p].options.items.right) {
            if (userFormData[p].answer[item.name]) {
              applicantExpertiseProfile += `<li>${item.label}</li>`;
            }
          }

          applicantExpertiseProfile += '</ul></div></div></div>';

        } else {
          applicantExpertiseProfile += `<div class="form-question">${userAppFormData[p].label}</div>
                                        <div class="user-response">${userFormData[p].answer}</div>`;
        }

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
            </span>`;
        if (this.user!.role === 'Referent' || reviewer.reviewer.email === this.user!.email) {
          reviewersHTML += `
            <button type="button" data-applicant="${row[RAW_DATA_INDEX]}" data-reviewer="${idx}" class="btn btn-reviewer-edit"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit</button>
            <button type="button" data-applicant="${row[RAW_DATA_INDEX]}" data-reviewer="${idx}" class="btn btn-outline-primary btn-reviewer-update"><i class="fa fa-refresh" aria-hidden="true"></i> &nbsp;Update</button>`;
        }

        reviewersHTML += `
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

    let applicantRateHTML = '';
    if (this.user!.role === 'Referent' || (this.hiddenColumnsFromReviewers!.indexOf('total-score') === -1
      && this.hiddenColumnsFromReviewers!.indexOf('avg-score') === -1 && this.hiddenColumnsFromReviewers!.indexOf('std-dev-score') === -1)) {
      applicantRateHTML = '<div class="applicant-rate"><label>Final rate (total - mean - std. dev.):</label>';
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
    }

    let applicantRecommendationHTML: string;
    if (this.user!.role === 'Referent' || (this.hiddenColumnsFromReviewers!.indexOf('final-review-recommendation') === -1
      && this.hiddenColumnsFromReviewers!.indexOf('final-review-status') === -1)) {
      applicantRecommendationHTML = '<div class="applicant-status">';
      if (this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation === 'Approved') {
        applicantRecommendationHTML += `<span class="accepted">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation}</span></div>`;
      } else if (this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation === 'Rejected') {
        applicantRecommendationHTML += `<span class="refused">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation}</span></div>`;
      } else {
        applicantRecommendationHTML += `<span class="pending">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation ? this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation : 'recommendation: none'}</span> <span>${this.applicants![row[RAW_DATA_INDEX]].deliberation.status ? this.applicants![row[RAW_DATA_INDEX]].deliberation.status : 'status: none'}</span></div>`;
      }

    } else if (this.hiddenColumnsFromReviewers!.indexOf('final-review-recommendation') === -1) {
      applicantRecommendationHTML = '<div class="applicant-status">';
      if (this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation === 'Approved') {
        applicantRecommendationHTML += `<span class="accepted">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation}</span></div>`;
      } else if (this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation === 'Rejected') {
        applicantRecommendationHTML += `<span class="refused">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation}</span></div>`;
      } else {
        applicantRecommendationHTML += `<span class="pending">${this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation ? this.applicants![row[RAW_DATA_INDEX]].deliberation.recommendation : 'recommendation: none'}</span></div>`;
      }

    } else if (this.hiddenColumnsFromReviewers!.indexOf('final-review-status') === -1) {
      applicantRecommendationHTML = `<div class="applicant-status"><span>${this.applicants![row[RAW_DATA_INDEX]].deliberation.status ? this.applicants![row[RAW_DATA_INDEX]].deliberation.status : 'status: none'}</span></div>`;

    } else {
      applicantRecommendationHTML = '';
    }

    let sectionDeliberationContent = '';
    let sectionDeliberationHeader = '';
    if (this.user!.role === 'Referent' || this.hiddenColumnsFromReviewers!.indexOf('final-review-comments') === -1) {
      sectionDeliberationHeader = `
        <input id="tab3-${row[RAW_DATA_INDEX]}" class="tab3" type="radio" name="tabs-${row[RAW_DATA_INDEX]}" value="tab3">
        <label for="tab3-${row[RAW_DATA_INDEX]}">Deliberation</label>
      `;
      sectionDeliberationContent = `
        <section class="content3">
          <div class="section-part">
            <div class="section-part-header">
              <h6 ${this.user!.role === 'Referent' ? '' : 'style="width:auto;float:none;"'}>
                <i class="fa fa-angle-right" aria-hidden="true"></i>
                <span>
                Deliberation for ${this.applicants![row[RAW_DATA_INDEX]].applicant.lastname || ''} ${this.applicants![row[RAW_DATA_INDEX]].applicant.firstname?.toLowerCase()?.replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) || ''}
                </span>
              </h6>
              ${this.user!.role === 'Referent' ? `<button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-review-edit"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit</button>` : ''}
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

                <button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-outline-primary btn-review-update"><i class="fa fa-refresh" aria-hidden="true"></i> &nbsp;Save changes</button>
              </div>

            </div>
          </div>
        </section>
      `;
    }

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

        ${sectionDeliberationHeader}` +

        (this.applicants![row[RAW_DATA_INDEX]].deadForm ? `<section class="warning-content">
          <h6>⚠ The user has deleted his/her application form.</h6>` + (this.user!.role === 'Referent' ?
            `<button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-outline-danger btn-delete-application-review"><i class="fa fa-trash-o" aria-hidden="true"></i> &nbsp;Delete the application review</button>`
          : '') + '</section>'
        : '') +

        `<section class="content1">
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
                    ${this.isReviewer || this.user!.role === 'Referent' ? `<button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-notes-for-reviewers-edit"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit</button>` : ''}
                    ${this.isReviewer || this.user!.role === 'Referent' ? `<button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-outline-primary btn-notes-for-reviewers-update"><i class="fa fa-refresh" aria-hidden="true"></i> &nbsp;Update</button>` : ''}
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
              <a href="/${(this.isSeniorExpert ? 'senior-' : '') +  this.urlPrefix}/application/appform/${this.applicants![row[RAW_DATA_INDEX]].formId}/${this.applicants![row[RAW_DATA_INDEX]].communityId}/${this.applicants![row[RAW_DATA_INDEX]].formType}${this.isSeniorExpert ? '-senior' : ''}"
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
              <h6 ${this.user!.role === 'Referent' || this.visibleReviews ? '' : 'style="width:auto;float:none;"'}><i class="fa fa-angle-right" aria-hidden="true"></i><span>Reviewers' decisions</span></h6>
              ${this.user!.role === 'Referent' || this.visibleReviews ? `<button type="button" data-applicant="${row[RAW_DATA_INDEX]}" class="btn btn-refresh-reviewers"><i class="fa fa-refresh" aria-hidden="true"></i> &nbsp;Refresh</button>` : ''}
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
                          ${review.applicant.lastname?.toUpperCase() || ''} ${review.applicant.firstname?.toLowerCase()?.replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) || ''}
                          </i>
                        </div>
                        <div class="left-item"><strong>Gender</strong></div>
                        <div class="right-item"><i>${review.applicant.gender || ''}</i></div>
                        <div class="left-item"><strong>Birthday</strong></div>
                        <div class="right-item"><i>${review.applicant.birthday || ''}</i></div>
                        <div class="left-item"><strong>Cu-ID</strong></div>
                        <div class="right-item"><i>${review.applicant.cuid || ''}</i></div>
                        <div class="left-item"><strong>Email</strong></div>
                        <div class="right-item"><i>${review.applicant.email}</i></div>
                      </div>
                      <div class="right-info">
                        <div class="left-item"><strong>Phone</strong></div>
                        <div class="right-item"><i>${review.applicant.phone || ''}</i></div>
                        <div class="left-item"><strong>Classification</strong></div>
                        <div class="right-item"><i>${review.applicant.classification || ''}</i></div>
                        <div class="left-item"><strong>Entity</strong></div>
                        <div class="right-item"><i>${review.applicant.entity || ''}</i></div>
                        <div class="left-item"><strong>Country</strong></div>
                        <div class="right-item"><i>${review.applicant.country || ''}</i></div>
                        <div class="left-item"><strong>Location</strong></div>
                        <div class="right-item"><i>${review.applicant.location || ''}</i></div>
                      </div>
              `);
            $(`td.details-${rowData[RAW_DATA_INDEX]} .application-collapse-view .notes-for-reviewers-${rowData[RAW_DATA_INDEX]} .comments`).html(`
                <textarea id="textarea-notes-for-reviewers" name="textarea-notes-for-reviewers" class="form-control" readonly placeholder="Add some notes about the applicant for the reviewers or referent. Please write your name to let others know who writes what!">${review.notesAboutApplicant || ''}</textarea>
              `);

            if (self.user!.role === 'Referent' || self.isReviewer) {

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

            }
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


        $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-refresh-reviewers', function (_event) {
          // let applicantIdx = $(this).data('applicant');
          if ($(this).html().includes('fa-refresh')) {
            $(this).html('<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i> &nbsp;Refresh');
            // Update the list of reviewers' data
            self.getReview(rowData[RAW_DATA_INDEX]);
          }
        });

        $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-reviewer-edit', function (_event) {
          const applicantIdx = $(this).data('applicant');
          const reviewerIdx = $(this).data('reviewer');
          if ($(this).html().includes('Edit')) {
            $(this).siblings('.btn-reviewer-update').addClass('visible');
            $(this).html('<i class="fa fa-times-circle" aria-hidden="true"></i> &nbsp;Cancel');
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} .stars.rate`).removeClass('read-only');
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} #textarea-reviewer-comment`).removeAttr('readonly');
            $(`input:radio[name=star-${applicantIdx}-${reviewerIdx}]`).change(function () {
              $(this).siblings('span.rating').text(`Rate: (${$(this).val()})`);
            });
          } else {
            $(this).siblings('.btn-reviewer-update').removeClass('visible');
            $(this).html('<i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit');

            $(`tr.details-${rowData[RAW_DATA_INDEX]}`)
              .find(`.item-${applicantIdx}-${reviewerIdx} #textarea-reviewer-comment`)
              .val(self.applicants![applicantIdx].reviewers[reviewerIdx].comments);
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} #textarea-reviewer-comment`).attr('readonly', '');
            if (self.applicants![applicantIdx].reviewers[reviewerIdx].rating.rate !== '') {
              const rateOverFive = parseInt(self.applicants![applicantIdx].reviewers[reviewerIdx].rating.rate, 10) + 3;
              $(`#star-${rateOverFive}-${applicantIdx}-${reviewerIdx}-${rateOverFive}`).prop('checked', true);
            } else {
              $(`#star-1-${applicantIdx}-${reviewerIdx}-1`).prop('checked', false);
              $(`#star-2-${applicantIdx}-${reviewerIdx}-2`).prop('checked', false);
              $(`#star-3-${applicantIdx}-${reviewerIdx}-3`).prop('checked', false);
              $(`#star-4-${applicantIdx}-${reviewerIdx}-4`).prop('checked', false);
              $(`#star-5-${applicantIdx}-${reviewerIdx}-5`).prop('checked', false);
            }
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`)
              .find(`.item-${applicantIdx}-${reviewerIdx} span.rating`)
              .text(`Rate: ${self.applicants![applicantIdx].reviewers[reviewerIdx].rating.rate ?
                '(' + self.applicants![applicantIdx].reviewers[reviewerIdx].rating.rate + ')' : ''
                }`
              );
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} .stars.rate`).addClass('read-only');
          }
        });

        $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-reviewer-update', function (_event) {
          const applicantIdx = $(this).data('applicant');
          const reviewerIdx = $(this).data('reviewer');
          self.applicants![applicantIdx].reviewers[reviewerIdx].comments =
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} #textarea-reviewer-comment`).val();
          self.applicants![applicantIdx].reviewers[reviewerIdx].rating.rate =
            $(`input:radio[name=star-${applicantIdx}-${reviewerIdx}]:checked`).val() || '';

          /** Save and sync with the back-end **/
          self.updateReviewerData(false, applicantIdx, reviewerIdx);

          $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} .stars.rate`).addClass('read-only');
          $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find(`.item-${applicantIdx}-${reviewerIdx} #textarea-reviewer-comment`).attr('readonly', '');
          $(this).removeClass('visible');
          $(this).siblings('.btn-reviewer-edit').html('<i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit');
        });

        if (self.user!.role === 'Referent') {

          $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-delete-application-review', function (_event) {
            const applicantIdx = $(this).data('applicant');
            self.reviewService.deleteReview(self.applicants![applicantIdx].communityId, self.applicants![applicantIdx]['_id'], self.isSeniorExpert).subscribe({
              next: deletedReview => {
                self.alertService.success('Successfully deleted the application review. The review table has been reloaded...')
                self.refreshReviewTable(null);
                setTimeout(() => {
                  self.alertService.clear();
                }, 5000);
              },
              error: error => {
                self.alertService.danger(`The application review cannot be deleted due to the error:\n${error}`);
              }
            });
          });

          $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-review-edit', function (_event) {
            if ($(this).html().includes('Edit')) {
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.btn-review-update').addClass('visible');
              $(this).html('<i class="fa fa-times-circle" aria-hidden="true"></i> &nbsp;Cancel');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-comments').removeAttr('readonly');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-notes').removeAttr('readonly');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.applicant-status').addClass('hidden');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.select-items').addClass('visible');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-status').val(self.applicants![rowData[RAW_DATA_INDEX]].deliberation.status);
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-final-recommendation')
                .val(self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation);

              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-status').change(function () {
                if ($(this).val() === 'Rejected') {
                  $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-final-recommendation').val($(this).val()!);
                } else {
                  $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-final-recommendation').val('Pending');
                }
              });

              /*$(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-final-recommendation').change(function() {
                if ($(this).val() === 'Approved' || $(this).val() === 'Rejected') {
                  $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-status').val($(this).val());
                } else {
                  $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-status').val('To be discussed');
                }
              });*/
            } else {
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.btn-review-update').removeClass('visible');
              $(this).html('<i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-comments').attr('readonly', '');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-notes').attr('readonly', '');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.applicant-status').removeClass('hidden');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.select-items').removeClass('visible');
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-comments')
                .val(self.applicants![rowData[RAW_DATA_INDEX]].deliberation.comments);
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-notes').val(self.applicants![rowData[RAW_DATA_INDEX]].deliberation.notes);
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-status').val(self.applicants![rowData[RAW_DATA_INDEX]].deliberation.status);
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-final-recommendation')
                .val(self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation);
            }
          });

          $(`tr.details-${rowData[RAW_DATA_INDEX]}`).on('click', '.btn-review-update', function (_event) {
            self.applicants![rowData[RAW_DATA_INDEX]].deliberation.comments =
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-comments').val();
            self.applicants![rowData[RAW_DATA_INDEX]].deliberation.notes = $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-notes').val();
            self.applicants![rowData[RAW_DATA_INDEX]].deliberation.status = $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-status').val();
            self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation =
              $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#review-final-recommendation').val();

            /** Save and sync with the back-end **/
            self.updateReferentReview(false, rowData[RAW_DATA_INDEX]);

            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-comments').attr('readonly', '');
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('#textarea-deliberation-notes').attr('readonly', '');
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.applicant-status').removeClass('hidden');
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.select-items').removeClass('visible');

            let applicantRecommendationHTML;
            if (self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation === 'Approved') {
              applicantRecommendationHTML = `<span class="accepted">${self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation}</span>`;
            } else if (self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation === 'Rejected') {
              applicantRecommendationHTML = `<span class="refused">${self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation}</span>`;
            } else {
              applicantRecommendationHTML =
                `<span class="pending">
                    ${self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation ?
                  self.applicants![rowData[RAW_DATA_INDEX]].deliberation.recommendation : 'recommendation: none'}
                  </span>
                  <span>
                    ${self.applicants![rowData[RAW_DATA_INDEX]].deliberation.status ?
                  self.applicants![rowData[RAW_DATA_INDEX]].deliberation.status : 'status: none'}
                  </span>`;
            }

            $(`tr.details-${rowData[RAW_DATA_INDEX]}`).find('.applicant-status').html(applicantRecommendationHTML);
            $(this).removeClass('visible');
            $(`tr.details-${rowData[RAW_DATA_INDEX]}`)
              .find('.btn-review-edit').html('<i class="fa fa-pencil-square-o" aria-hidden="true"></i> &nbsp;Edit');
          });

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
