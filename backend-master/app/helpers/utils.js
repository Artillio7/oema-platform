/*
 * Template for building application forms
 */
const applicationFormTemplate = [
  {name: 'About You', icon: 'fa-id-card-o', active: true, valid: false, hasError: false,
    form: [
      {group: 'About you', questions: null},
    ],
  },

  {name: 'Experience', icon: 'fa-flask', active: false, valid: false, hasError: false,
    form: [
    ],
  },

  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
    ],
  },

  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
    ],
  },

  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null},
      ]},
      {group: 'Manager Approval', questions: [
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded ' +
          '<a href="assets/misc/MR-letters/MR-community-letter-filename"><mark>here</mark></a>.',
        type: 'input-file', name: 'file-manager-recommendation', options: null,
        },
      ]},
      {group: 'Charter "Orange Expertise Journey"', questions: [
        {
          label: 'Sign the Charter, then scan and upload it as a pdf file. The Charter "Orange Expertise Journey" can be downloaded ' +
          '<a href="assets/misc/MR-letters/Charter_OE_Journey.pdf" target="_blank" rel="noopener noreferrer"><mark>here</mark></a>.',
          type: 'input-file', name: 'file-orange-expert-charter', options: null,
        },
      ]},
      {group: 'Other Documents (optional)', questions: [
        {
          label: 'Upload your other documents or recommendation letters (only pdf).',
          type: 'dropzone', name: 'other-documents-upload', options: null,
        },
      ]},
    ],
  },

  {name: 'Submission', icon: 'fa-paper-plane-o', active: false, valid: false, hasError: false, form: null},
];

/*
 * Helper to count number of bits set to 1
 */
function bitCount(n) {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}


module.exports = {applicationFormTemplate, bitCount};
