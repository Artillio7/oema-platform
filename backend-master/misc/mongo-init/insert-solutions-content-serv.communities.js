/**
 * Solutions For Content Services community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-solutions-content-serv.communities.js
 *
 */


/********************/
/***** NEW FORM *****/
/********************/
const newForm = [

  /****** About you ******/
  {name: 'About You', icon: 'fa-id-card-o', active: true, valid: false, hasError: false,
    form: [
      {group: 'About You', questions:null}
    ]
  },

  /****** Experience ******/
  {name: 'Experience', icon: 'fa-flask', active: false, valid: false, hasError: false,
    form: [
      {group: 'Current Activity and Position', questions: [
        {label: 'Please summarize in one sentence what are your current position and domain of expertise.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years have you devoted to your domain of expertise? (a minimum of 5 years is required)', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'What percentage of time did you dedicate to the development of your expertise and skills over the past 3 years?', type: 'input-text', name: 'it-expert-time', options: null}
      ]},
      {group: 'Your Achievements/Influence in Content Services', questions: [
        {label: 'Please provide a concise description of what are your <strong>three</strong> main contributions or achievements that fall into the scope of SCS and which best \
        illustrate your domain of expertise. Also, be specific about the context (e.g., solicitation, mission assignment or personal initiative, etc), the corresponding period \
        of activity (e.g., date, duration), and your specific role (e.g., project manager, editor of a contribution, etc).<br/>\
        <strong>Please refrain from cutting/pasting your resume and providing a "bullet" list of activities.</strong>', type: 'textarea', name: 'ta-activity-sfcs', options: null}
      ]},
      {group: 'Your Vision on the Content Services Ecosystem Evolution', questions: [
        {label: 'According to you, what are the future trends, the future challenges and the future transformations where the SCS community should enlighten the Orange group? (10 lines)',
         type: 'textarea', name: 'ta-vision-sfcs', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Profile', questions: [
        {label: 'Your profile: Select in the following table, the most appropriate choice that characterizes your profile:<br>\
        <strong>1:</strong> No Knowledge &emsp; <strong>2:</strong> Some Knowledge &emsp; <strong>3:</strong> Good Knowledge &emsp; <strong>4:</strong> Expert', type: 'mix-array', name: 'ma-area-competences-1',
        options: {
          columns: [
            {name: 'domain', prop: 'domain', templates: ['text']},
            {name: 'skill', prop: 'comments', templates: ['text']},
            {name: 'Self-assessment', prop: 'assessment', templates: ['input-radio']}
          ],
          rows: [
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-usages', options: null}],
              comments: [{label: 'Usages', type: 'text', name: 't-usages', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-usages', options: {
                items: [
                  {label: '1', name: 'r-usages-1'},
                  {label: '2', name: 'r-usages-2'},
                  {label: '3', name: 'r-usages-3'},
                  {label: '4', name: 'r-usages-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-bm', options: null}],
              comments: [{label: 'Business Models', type: 'text', name: 't-bm', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-bm', options: {
                items: [
                  {label: '1', name: 'r-bm-1'},
                  {label: '2', name: 'r-bm-2'},
                  {label: '3', name: 'r-bm-3'},
                  {label: '4', name: 'r-bm-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-mi', options: null}],
              comments: [{label: 'Market Intelligence', type: 'text', name: 't-mi', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-mi', options: {
                items: [
                  {label: '1', name: 'r-mi-1'},
                  {label: '2', name: 'r-mi-2'},
                  {label: '3', name: 'r-mi-3'},
                  {label: '4', name: 'r-mi-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-marketing', options: null}],
              comments: [{label: 'Marketing', type: 'text', name: 't-marketing', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-marketing', options: {
                items: [
                  {label: '1', name: 'r-marketing-1'},
                  {label: '2', name: 'r-marketing-2'},
                  {label: '3', name: 'r-marketing-3'},
                  {label: '4', name: 'r-marketing-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-legal', options: null}],
              comments: [{label: 'Legal', type: 'text', name: 't-legal', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-legal', options: {
                items: [
                  {label: '1', name: 'r-legal-1'},
                  {label: '2', name: 'r-legal-2'},
                  {label: '3', name: 'r-legal-3'},
                  {label: '4', name: 'r-legal-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-regulation', options: null}],
              comments: [{label: 'Regulation', type: 'text', name: 't-regulation', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-regulation', options: {
                items: [
                  {label: '1', name: 'r-regulation-1'},
                  {label: '2', name: 'r-regulation-2'},
                  {label: '3', name: 'r-regulation-3'},
                  {label: '4', name: 'r-regulation-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-strategy', options: null}],
              comments: [{label: 'Strategy', type: 'text', name: 't-strategy', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-strategy', options: {
                items: [
                  {label: '1', name: 'r-strategy-1'},
                  {label: '2', name: 'r-strategy-2'},
                  {label: '3', name: 'r-strategy-3'},
                  {label: '4', name: 'r-strategy-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-partnerships', options: null}],
              comments: [{label: 'Partnerships', type: 'text', name: 't-partnerships', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-partnerships', options: {
                items: [
                  {label: '1', name: 'r-partnerships-1'},
                  {label: '2', name: 'r-partnerships-2'},
                  {label: '3', name: 'r-partnerships-3'},
                  {label: '4', name: 'r-partnerships-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-rac', options: null}],
              comments: [{label: 'Right Acquisitions', type: 'text', name: 't-rac', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-rac', options: {
                items: [
                  {label: '1', name: 'r-ra-1'},
                  {label: '2', name: 'r-ra-2'},
                  {label: '3', name: 'r-ra-3'},
                  {label: '4', name: 'r-ra-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-standardization', options: null}],
              comments: [{label: 'Standardization', type: 'text', name: 't-standardization', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-standardization', options: {
                items: [
                  {label: '1', name: 'r-standardization-1'},
                  {label: '2', name: 'r-standardization-2'},
                  {label: '3', name: 'r-standardization-3'},
                  {label: '4', name: 'r-standardization-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Business Skills', type: 'text', name: 't-bs-agile-trans', options: null}],
              comments: [{label: 'Agile Transformation', type: 'text', name: 't-agile-trans', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-agile-trans', options: {
                items: [
                  {label: '1', name: 'r-at-1'},
                  {label: '2', name: 'r-at-2'},
                  {label: '3', name: 'r-at-3'},
                  {label: '4', name: 'r-at-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-ete', options: null}],
              comments: [{label: 'End-to-end', type: 'text', name: 't-ete', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-ete', options: {
                items: [
                  {label: '1', name: 'r-ete-1'},
                  {label: '2', name: 'r-ete-2'},
                  {label: '3', name: 'r-ete-3'},
                  {label: '4', name: 'r-ete-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-devices', options: null}],
              comments: [{label: 'Devices', type: 'text', name: 't-devices', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-devices', options: {
                items: [
                  {label: '1', name: 'r-devices-1'},
                  {label: '2', name: 'r-devices-2'},
                  {label: '3', name: 'r-devices-3'},
                  {label: '4', name: 'r-devices-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-platforms', options: null}],
              comments: [{label: 'Platforms', type: 'text', name: 't-platforms', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-platforms', options: {
                items: [
                  {label: '1', name: 'r-plateforms-1'},
                  {label: '2', name: 'r-plateforms-2'},
                  {label: '3', name: 'r-plateforms-3'},
                  {label: '4', name: 'r-plateforms-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-network', options: null}],
              comments: [{label: 'Network', type: 'text', name: 't-network', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-network', options: {
                items: [
                  {label: '1', name: 'r-network-1'},
                  {label: '2', name: 'r-network-2'},
                  {label: '3', name: 'r-network-3'},
                  {label: '4', name: 'r-network-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-security', options: null}],
              comments: [{label: 'Security', type: 'text', name: 't-security', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-security', options: {
                items: [
                  {label: '1', name: 'r-security-1'},
                  {label: '2', name: 'r-security-2'},
                  {label: '3', name: 'r-security-3'},
                  {label: '4', name: 'r-security-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-bigdata', options: null}],
              comments: [{label: 'Big Data', type: 'text', name: 't-bigdata', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-bigdata', options: {
                items: [
                  {label: '1', name: 'r-bd-1'},
                  {label: '2', name: 'r-bd-2'},
                  {label: '3', name: 'r-bd-3'},
                  {label: '4', name: 'r-bd-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-ai', options: null}],
              comments: [{label: 'Artificial Intelligence', type: 'text', name: 't-ai', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-ai', options: {
                items: [
                  {label: '1', name: 'r-ai-1'},
                  {label: '2', name: 'r-ai-2'},
                  {label: '3', name: 'r-ai-3'},
                  {label: '4', name: 'r-ai-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-soft', options: null}],
              comments: [{label: 'Software', type: 'text', name: 't-soft', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-soft', options: {
                items: [
                  {label: '1', name: 'r-soft-1'},
                  {label: '2', name: 'r-soft-2'},
                  {label: '3', name: 'r-soft-3'},
                  {label: '4', name: 'r-soft-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            },
            { domain: [{label: 'Technical Skills', type: 'text', name: 't-ts-operations', options: null}],
              comments: [{label: 'Operations', type: 'text', name: 't-operations', options: null}],
              assessment: [{label: '', type: 'input-radio', name: 'ir-operations', options: {
                items: [
                  {label: '1', name: 'r-operation-1'},
                  {label: '2', name: 'r-operation-2'},
                  {label: '3', name: 'r-operation-3'},
                  {label: '4', name: 'r-operation-4'}
                ],
                widthClass: 'col-md-1' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
              }}]
            }
          ]
        }},
        {label: 'Please give details on your specific areas of expertise.', type: 'textarea', name: 'ta-details-expertise', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your interest in participating in the SCS community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'Which is the type of collaboration you feel more comfortable with (webinar, executive memos, ecosystem survey, tutorial, other)? \
        Could you already identify what topic you would like to deal with? ', type: 'textarea', name: 'ta-contribute-real', options: null},
        {label: 'Do you commit to regularly contribute to the activities of the community (webinars, working groups, deliverables and seminars)?', type: 'textarea', name: 'ta-contribute', options: null}
      ]}
    ]
  },

  /******  Uploads   ******/
  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Manager Approval', questions: [
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Solutions-for-Content-Services.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
      ]},
      {group: 'Charter "Orange Expert Journey"', questions: [
        {label: 'Sign the Charter, then scan and upload it as a pdf file. The Charter "Orange Expert Journey" can be downloaded <a href="assets/misc/MR-letters/Charter_OE_Journey.pdf" target="_blank" rel="noopener noreferrer"><mark>here</mark></a>.', type: 'input-file', name: 'file-orange-expert-charter', options: null}
      ]},
      {group: 'Other Documents (optional)', questions: [
        {label: 'Upload your other documents or recommendation letters (only pdf).', type: 'dropzone', name: 'other-documents-upload', options: null}
      ]}
    ]
  },

  {name: 'Submission', icon: 'fa-paper-plane-o', active: false, valid: false, hasError: false, form: null}

];


/************************/
/***** RENEWAL FORM *****/
/************************/
const renewalForm = [

  /****** About you ******/
  {name: 'About You', icon: 'fa-id-card-o', active: true, valid: false, hasError: false,
    form: [
      {group: 'About You', questions:null}
    ]
  },

  /****** Experience ******/
  {name: 'Experience', icon: 'fa-flask', active: false, valid: false, hasError: false,
    form: [
      {group: 'Current Activity and Position', questions: [
        {label: 'Please summarize in one sentence what are your current position and domain of expertise.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience', questions: [
        {label: 'How many years have you devoted to your domain of expertise? (a minimum of 5 years is required)', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'What percentage of time did you dedicate to the development of your expertise and skills over the past 3 years?', type: 'input-text', name: 'it-expert-time', options: null}
      ]},
      {group: 'Your Achievements/Influence in Content Services', questions: [
        {label: 'Please describe your involvement in deliverables (including presentations, webinars, collaboration to working groups) \
        produced by the SCS community during the last three years (date, title of the deliverable, level of involvement).', type: 'textarea', name: 'ta-activity-sfcs', options: null}
      ]},
      {group: 'Your Vision on the Content Services Ecosystem Evolution', questions: [
        {label: 'According to you, what are the future trends, the future challenges and the future transformations where the SCS community should enlighten the Orange group? (10 lines)',
         type: 'textarea', name: 'ta-vision-sfcs', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Profile', questions: [
        {label: 'Please give details on your specific areas of expertise.', type: 'textarea', name: 'ta-details-expertise', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your interest in renewing your participation in the SCS community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'Which is the type of collaboration you feel more comfortable with (webinar, executive memos, ecosystem survey, tutorial, other)? \
        Could you already identify what topic you would like to deal with? ', type: 'textarea', name: 'ta-contribute-real', options: null},
        {label: 'Do you commit to regularly contribute to the activities of the community (webinars, working groups, deliverables and seminars)?', type: 'textarea', name: 'ta-contribute', options: null}
      ]}
    ]
  },

  /******  Uploads   ******/
  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Manager Approval', questions: [
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Solutions-for-Content-Services.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
      ]},
      {group: 'Charter "Orange Expert Journey"', questions: [
        {label: 'Sign the Charter, then scan and upload it as a pdf file. The Charter "Orange Expert Journey" can be downloaded <a href="assets/misc/MR-letters/Charter_OE_Journey.pdf" target="_blank" rel="noopener noreferrer"><mark>here</mark></a>.', type: 'input-file', name: 'file-orange-expert-charter', options: null}
      ]},
      {group: 'Other Documents (optional)', questions: [
        {label: 'Upload your other documents or recommendation letters (only pdf).', type: 'dropzone', name: 'other-documents-upload', options: null}
      ]}
    ]
  },

  {name: 'Submission', icon: 'fa-paper-plane-o', active: false, valid: false, hasError: false, form: null}

];


/***************/
/***** DOC *****/
/***************/
const communityName = 'Solutions for Content Services';
const doc = {
  name: communityName,
  label: 'SolutionsContSrvApp',
  flag: 8,
  referentName: 'Erwan NEDELLEC',
  referentMail: 'erwan.nedellec@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
