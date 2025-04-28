import { Directive, HostListener, EventEmitter, Input, Output } from '@angular/core';

import { saveAs } from 'file-saver';

import { FormService } from '../ng-services/form.service';
import { ReviewService } from '../ng-services/review.service';

@Directive({
  selector: '[appXlsxExport]'
})
export class XlsxExportDirective {
  @Input('appXlsxExport') exportData: any; // array of json objects
  @Input() xlsxDataType = 'users'; // or 'reviews'
  @Input() xlsxFileName = 'oeam-export.xlsx';
  @Input() isSeniorExpert = false;
  @Output() backEndResponse = new EventEmitter<string>();

  tooltips!: any[];

  constructor(private formService: FormService, private reviewService: ReviewService) { }

  @HostListener('click', ['$event'])
  toggleExport($event: any) {
    if (this.xlsxDataType === 'users' && this.exportData && this.exportData.length !== 0) {
      this.exportToXlsx(this.exportData);
    }

    if (this.xlsxDataType === 'reviews') {
      this.backEndResponse.emit('Loading...');
      this.reviewService.listReviews(this.exportData.communityId, false, this.isSeniorExpert, { id: 'year', operator: '$eq', value: this.exportData.year }).subscribe({
        next: reviews => {
          this.exportToXlsx(reviews);
          this.backEndResponse.emit('Ending...');
        },
        error: error => {
          this.backEndResponse.emit(error);
        }
      });
    }

    if (this.xlsxDataType.startsWith('preview')) {
      this.backEndResponse.emit('Loading...');
      this.formService.submittedFormsPreview(this.exportData.communityId, this.exportData.year, this.xlsxDataType === 'preview-submissions' ? true : false, this.isSeniorExpert).subscribe({
        next: forms => {
          this.exportToXlsx(forms);
          this.backEndResponse.emit('Ending...');
        },
        error: error => {
          this.backEndResponse.emit(error);
        }
      });
    }
  }

  private formatDate(date: Date): string {
    const rawDate = new Date(date);
    return ('0' + rawDate.getDate()).slice(-2) + '-' + ('0' + (rawDate.getMonth() + 1)).slice(-2) + '-' + rawDate.getFullYear()
      + ' ' + ('0' + rawDate.getHours()).slice(-2) + ':' + ('0' + rawDate.getMinutes()).slice(-2);
  }

  private removeHtmlTagsAndCodes(text: string | undefined | null) {
    if (!text) return ''

    text = text.replace(/<(?:.|\n)*?>/gm, '').replace(/\n/g, ' ');

    const element = document.createElement('div');

    // strip script/html tags
    text = text.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
    text = text.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
    element.innerHTML = text;
    text = element.textContent;
    element.textContent = '';

    return text;
  }

  private escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return '';
      }
    });
  }

  private exportToXlsx(rawData: any) {
    this.tooltips = [];
    // rawData is array of json object, format it as array of arrays
    // rawData --> data
    let data: any[];
    let ws_name: string;

    const colLen = [];

    if (this.xlsxDataType === 'users') {
      data = [
        [
          'Last name', 'First name', 'Gender', 'Birthday', 'Email', 'CU-ID', 'Phone', 'Entity', 'Location', 'Country',
          'Classification', 'Manager', 'Manager email', 'HR Name', 'HR email', 'Community', 'Effective date', 'History'
        ]
      ];

      for (let i = 0; i < data[0].length; i++) {
        colLen[i] = data[0][i].length + 1;
      }

      for (const row of rawData.filter((d: any) => d.lastname)) {
        const valuesArray = [
          row.lastname?.toUpperCase() || '', row.firstname || '',
          row.gender?.charAt(0) || 'N/A', row.birthday || 'N/A',
          row.email, row.cuid || '', row.phone || '', row.entity || '',
          row.location || '', row.country || '', row.classification || '', row.community || '',
          row.managerFirstname && row.managerLastname ? row.managerFirstname + ' ' + row.managerLastname : '', row.managerEmail || '',
          row.hrFirstname && row.hrLastname ? row.hrFirstname + ' ' + row.hrLastname : '', row.hrEmail || '',
          row.community === 'Applicant' || !row.history[0] ? null : row.history[0].year,
          row.history.length ? JSON.stringify(row.history) : null];

        for (let i = 0; i < valuesArray.length - 1; i++) {
          if (valuesArray[i]) {
            colLen[i] = Math.max(colLen[i], valuesArray[i].toString().length + 1);
          }
        }

        data.push(valuesArray);
      }

      colLen[colLen.length - 1] = 20;

      ws_name = 'OEMA Users';

    } else if (this.xlsxDataType === 'reviews') {
      data = [];

      const header = [
        'Last name', 'First name', 'New/Renewal', 'Gender', 'Birthday', 'Email', 'CU-ID', 'Phone', 'Entity',
        'Location', 'Country', 'Classification', 'Manager', 'Manager email', 'HR Name', 'HR email', 'Jury member'];
      for (const reviewer of rawData[0].reviewers) {
        header.push(reviewer.reviewer.lastname ? (reviewer.reviewer.firstname + ' ' + reviewer.reviewer.lastname) : reviewer.reviewer.email);
      }
      header.push('#strong-accept', '#weak-accept', '#fair', '#weak-reject', '#strong-reject', 'Total score',
        '#Reviewers', '#Reviews', 'Avg. score', 'Std. dev. score', 'Comments', 'Status', 'Notes', 'Final recommendation', 'Notification');
      data.push(header);

      for (let i = 0; i < header.length; i++) {
        colLen[i] = header[i].length + 1;
      }

      /***/
      let applicantIdx = 0;
      let reviewerIdx: number;
      let nbReviews: number;

      for (const row of rawData) {
        const valuesArray = [
          row.applicant.lastname?.toUpperCase() || '', row.applicant.firstname || '', row.formType,
          row.applicant.gender?.charAt(0) || 'N/A', row.applicant.birthday || 'N/A',
          row.applicant.email, row.applicant.cuid || '', row.applicant.phone || '', row.applicant.entity || '',
          row.applicant.location || '', row.applicant.country || '', row.applicant.classification || '',
          row.applicant.managerFirstname && row.applicant.managerLastname ? row.applicant.managerFirstname + ' ' + row.applicant.managerLastname : '', row.applicant.managerEmail || '',
          row.applicant.hrFirstname && row.applicant.hrLastname ? row.applicant.hrFirstname + ' ' + row.applicant.hrLastname : '', row.applicant.hrEmail || '', ''
        ];

        applicantIdx++;
        reviewerIdx = 16;
        nbReviews = 0;

        for (const reviewer of row.reviewers) {
          reviewerIdx++;
          if (reviewer.comments) {
            this.tooltips.push({
              c: reviewerIdx,
              r: applicantIdx,
              t: [{ a: reviewer.reviewer.lastname, t: this.escapeXml(reviewer.comments) }]
            });
          }

          if (reviewer.rating.rate !== '') {
            valuesArray.push(parseInt(reviewer.rating.rate, 10));
            // if (reviewer.reviews !== 'no')
            nbReviews++;
          } else {
            valuesArray.push(reviewer.reviews ? reviewer.reviews : undefined);
          }

          if (reviewer.reviewer.email === row.applicant.email) {
            valuesArray[16] = 'yes';
          }
        }

        valuesArray.push(row.rate && row.rate['strong-accept'] ? row.rate['strong-accept'] : undefined,
          row.rate && row.rate['weak-accept'] ? row.rate['weak-accept'] : undefined,
          row.rate && row.rate.fair ? row.rate.fair : undefined,
          row.rate && row.rate['weak-reject'] ? row.rate['weak-reject'] : undefined,
          row.rate && row.rate['strong-reject'] ? row.rate['strong-reject'] : undefined,
          row.rate && row.rate && row.rate['total-score'] ? row.rate['total-score'] : undefined,
          row.rate && row.rate['rate-count'] ? row.rate['rate-count'] : undefined,
          nbReviews,
          row.rate && row.rate['avg-score'] ? row.rate['avg-score'] : undefined,
          row.rate && row.rate['std-dev-score'] ? row.rate['std-dev-score'] : undefined,
          row.deliberation && row.deliberation.comments ? row.deliberation.comments : undefined,
          row.deliberation && row.deliberation.status ? row.deliberation.status : undefined,
          row.deliberation && row.deliberation.notes ? row.deliberation.notes : undefined,
          row.deliberation && row.deliberation.recommendation ? row.deliberation.recommendation : undefined,
          row.notification ? row.notification : undefined);

        for (let i = 0; i < valuesArray.length; i++) {
          if (valuesArray[i] && i !== valuesArray.length - 3 && i !== valuesArray.length - 5) {
            colLen[i] = Math.max(colLen[i], valuesArray[i].toString().length + 1);
          }
        }

        data.push(valuesArray);
      }

      colLen[colLen.length - 3] = 20;
      colLen[colLen.length - 5] = 20;

      ws_name = 'OE Apps Review';

    } else {
      data = [];

      const header = [
        'Last name', 'First name', 'New/Renewal', 'Created', 'Submitted', 'Gender', 'Birthday', 'Email', 'CU-ID', 'Phone', 'Entity',
        'Location', 'Country', 'Classification', 'Manager', 'Manager email', 'HR Name', 'HR email'];
      if (this.exportData.community !== 'Security') {
        for (const p in rawData[0].userAppFormData) {
          header.push(rawData[0].userAppFormData[p].options.preview);
        }
        if (this.exportData.community === 'Senior Orange Experts') {
          header.unshift('Community');
        }
      } else {
        for (const p in rawData[0].userAppFormData) {
          if (rawData[0].userAppFormData[p].type !== 'mix-array') {
            header.push(rawData[0].userAppFormData[p].options.preview);
          } else {
            for (const tabRow of rawData[0].userAppFormData[p].options.rows) {
              header.push(tabRow['domain'][0].label);
            }
          }
        }
      }
      data.push(header);

      for (let i = 0; i < header.length; i++) {
        colLen[i] = header[i].length + 1;
      }


      for (const row of rawData) {
        const valuesArray = [
          row.applicant[0].lastname?.toUpperCase() || '', row.applicant[0].firstname || '',
          row.formType, this.formatDate(row.createdAt), row.submittedAt ? this.formatDate(row.submittedAt) : '',
          row.applicant[0].gender?.charAt(0) || 'N/A',
          row.applicant[0].birthday || 'N/A',
          row.email, row.applicant[0].cuid || '', row.applicant[0].phone || '', row.applicant[0].entity || '',
          row.applicant[0].location || '', row.applicant[0].country || '', row.applicant[0].classification || '',
          row.applicant[0].managerFirstname && row.applicant[0].managerLastname ? row.applicant[0].managerFirstname + ' ' + row.applicant[0].managerLastname : '',
          row.applicant[0].managerEmail || '',
          row.applicant[0].hrFirstname && row.applicant[0].hrLastname ? row.applicant[0].hrFirstname + ' ' + row.applicant[0].hrLastname : '',
          row.applicant[0].hrEmail || ''
        ];

        if (this.exportData.community === 'Senior Orange Experts') {
          valuesArray.unshift(row.communityName);
        }

        for (const p in row.userAppFormData) {
          if (row.userAppFormData[p].type === 'textarea'
            || row.userAppFormData[p].type === 'input-text'
            || row.userAppFormData[p].type === 'select') {
            valuesArray.push(this.removeHtmlTagsAndCodes(row.userAppFormData[p].answer));

          } else if (row.userAppFormData[p].type === 'battery-levels') {
            let answer = '';
            for (const val in row.userAppFormData[p].answer) {
              const element = row.userAppFormData[p].options.items.filter((item: any) => item.name === val);
              answer += `${element[0].label}: ${row.userAppFormData[p].answer[val] ? row.userAppFormData[p].answer[val].replace('battery-', '') : ''}; `;
            }
            valuesArray.push(answer);

          } else if (row.userAppFormData[p].type === 'input-checkboxes') {
            let answer = '';
            for (const val in row.userAppFormData[p].answer) {
              const items = row.userAppFormData[p].options.items.left.concat(row.userAppFormData[p].options.items.right);
              const element = items.filter((item: any) => item.name === val);
              if (element.length) {
                answer += `${element[0].label}; `;
              }
            }
            valuesArray.push(answer);

          } else if (row.userAppFormData[p].type === 'mix-array') {
            if (this.exportData.community !== 'Security') {
              let answer = '';
              for (const tabRow of row.userAppFormData[p].options.rows) {
                for (const col in tabRow) {
                  for (const colLine of tabRow[col]) {
                    if (colLine.type === 'input-radio') {
                      const items = colLine.options.items.filter((item: any) => item.name === row.userAppFormData[p]['answer'][colLine.name]);
                      answer += `${colLine.label}${colLine.label && row.userAppFormData[p]['answer'][colLine.name] ? ': ' : ''}
                                 ${items.length ? items[0].label : ''};`;
                    } else {
                      answer += `${colLine.label}${colLine.label && row.userAppFormData[p]['answer'][colLine.name] ? ': ' : ''}
                                 ${this.removeHtmlTagsAndCodes(row.userAppFormData[p]['answer'][colLine.name])};`;
                    }
                  }
                  answer = answer.slice(0, -1);
                  answer += ' | ';
                }

                answer += '\n';
              }

              valuesArray.push(answer);

            } else {
              for (const tabRow of row.userAppFormData[p].options.rows) {
                for (const col in tabRow) {
                  for (const colLine of tabRow[col]) {
                    if (colLine.type === 'input-radio') {
                      const items = colLine.options.items.filter((item: any) => item.name === row.userAppFormData[p]['answer'][colLine.name]);
                      valuesArray.push(items.length ? items[0].label : '');
                    }
                  }
                }
              }
            }

          } else {
            valuesArray.push('');
          }
        }

        data.push(valuesArray);
      }

      ws_name = 'OE Apps Preview';
    }

    const workBook = {
      SheetNames: [ws_name],
      Sheets: {} as { [key: string]: any }
    };
    const ws = this.sheet_from_array_of_arrays(data);

    const wscols = [];

    for (let i = 0; i < colLen.length; i++) {
      wscols.push({ wch: colLen[i] });
    }
    ws['!cols'] = wscols;

    if (ws_name === 'OE Apps Review') {
      for (let i = 3; i < 8; i++) {
        ws['!cols'][i].hidden = true;
      }
      for (let i = 11; i < 16; i++) {
        ws['!cols'][i].hidden = true;
      }
    }

    workBook.Sheets[ws_name] = ws;

    /* write file */
    const wbout = XLSX.write(workBook, { bookType: 'xlsx', bookSST: true, type: 'binary' });
    saveAs(new Blob([this.s2ab(wbout)], { type: 'application/octet-stream' }), this.xlsxFileName);
  }

  private datenum(v: Date, date1904?: boolean) {
    const basedate = new Date(1899, 11, 30, 0, 0, 0);
    const dnthresh = basedate.getTime() + (new Date().getTimezoneOffset() - basedate.getTimezoneOffset()) * 60000;

    const day_ms = 24 * 60 * 60 * 1000;
    const days_1462_ms = 1462 * day_ms;

    let epoch = v.getTime();
    if (date1904) {
      epoch -= days_1462_ms;
    }
    return (epoch - dnthresh) / day_ms;
  }

  // https://github.com/SheetJS/sheetjs/issues/1565
  private fixImportedDate(date: Date, is_date1904?: boolean) {
    // Convert JS Date back to Excel date code and parse them using SSF module.
    const parsed = XLSX.SSF.parse_date_code(this.datenum(date, false), { date1904: is_date1904 });
    return `${parsed.y}-${parsed.m}-${parsed.d}`;
    // or
    // return parsed;
    // or if you want to stick to JS Date,
    // return new Date(parsed.y, parsed.m, parsed.d, parsed.H, parsed.M, parsed.S);
  }

  private sheet_from_array_of_arrays(data: any[]) {
    const ws: { [key: string]: any } = {};
    const range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };
    for (let R = 0; R !== data.length; ++R) {
      for (let C = 0; C !== data[R].length; ++C) {
        if (range.s.r > R) { range.s.r = R; }
        if (range.s.c > C) { range.s.c = C; }
        if (range.e.r < R) { range.e.r = R; }
        if (range.e.c < C) { range.e.c = C; }
        const cell: { [key: string]: any } = { v: data[R][C] };

        if (cell['v'] === null) { continue; }

        const idx = this.tooltips.filter(cRef => cRef.c === C && cRef.r === R);
        if (idx.length) {
          cell['c'] = idx[0]['t'];
        }

        if (C <= 16) {
          cell['s'] = { alignment: { horizontal: 'center' } };
        }

        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });

        if (typeof cell['v'] === 'number') {
          cell['t'] = 'n';
        } else if (typeof cell['v'] === 'boolean') {
          cell['t'] = 'b';
        } else if (cell['v'] instanceof Date) {
          cell['t'] = 'n'; cell['z'] = XLSX.SSF._table[14];
          cell['v'] = this.fixImportedDate(cell['v']);
        } else { cell['t'] = 's'; }

        ws[cell_ref] = cell;
      }
    }
    if (range.s.c < 10000000) { ws['!ref'] = XLSX.utils.encode_range(range); }
    return ws;
  }

  private s2ab(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; ++i) { view[i] = s.charCodeAt(i) & 0xFF; }
    return buf;
  }
}
