/**
 * Transaction & Communication Services community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-communication-services.communities.js
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

  /****** Expertise ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Current Activity and Position', questions: [
        {label: 'Explain in two sentences your position and current activity.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Your Expertise and Competencies', questions: [
        {label: 'How many years of experience have you devoted to transaction or communication services?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time have you devoted to transaction or communication services in the last 3 years (in % of your time)', type: 'input-text', name: 'it-expert-time', options: null},
        {label: '<span class="text-primary"><strong>Your profile: Select the most appropriate choice(s) in the 3 following tables that characterize your profile.</strong></span>', type: 'text', name: 't-profile', option:null},
        {label: 'Select your Market orientation: ', type: 'select', name: 'sl-market-orientation', options: {items: [
          'Enterprise markets',
          'Residential market',
          'All markets',
          'OTT ecosystem'
          ],
          widthClass: 'col-md-6'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
        {label: 'Area of competencies', type: 'mix-array', name: 'ma-area-competencies',
        options: {
          columns: [
            {name: 'Area of competencies', prop: 'competencies', templates: ['text']},
            {name: 'Prioritized choices', prop: 'choices', templates: ['input-text']}
          ],
          rows: [
            { competencies: [{label: 'Strategy & Regulation', type: 'text', name: 't-strategy', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-strategy-order', options: null}]
            },
            { competencies: [{label: 'Customer Needs (MKT)', type: 'text', name: 't-customer-needs', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-customer-needs-order', options: null}]
            },
            { competencies: [{label: 'User eXperience', type: 'text', name: 't-ux', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-ux-order', options: null}]
            },
            { competencies: [{label: 'Device functions', type: 'text', name: 't-device-functions', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-device-functions-order', options: null}]
            },
            { competencies: [{label: 'Media technologies', type: 'text', name: 't-media-technologies', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-media-technologies-order', options: null}]
            },
            { competencies: [{label: 'Service Platform', type: 'text', name: 't-service-platform', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-service-platform-order', options: null}]
            },
            { competencies: [{label: 'Information System', type: 'text', name: 't-information-system', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-information-system-order', options: null}]
            },
            { competencies: [{label: 'Standardisation', type: 'text', name: 't-standardisation', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-standardisation-order', options: null}]
            },
            { competencies: [{label: 'Development', type: 'text', name: 't-development', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-development-order', options: null}]
            },
            { competencies: [{label: 'Analytics', type: 'text', name: 't-analytics', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-analytics-order', options: null}]
            }
          ]
        }},
        {label: 'Expertise fields', type: 'mix-array', name: 'ma-main-competencies',
        options: {
          columns: [
            {name: 'Expertise field', prop: 'competencies', templates: ['text','input-text']},
            {name: 'Your own expertise', prop: 'choices', templates: ['input-text']}
          ],
          rows: [
            { competencies: [{label: 'Payment and transaction', type: 'text', name: 't-pat', options: null}],
            choices: [{label: '', type: 'input-text', name: 'it-pat-exp', options: null}]
            },
            { competencies: [{label: 'Mobile Banking', type: 'text', name: 't-mobile-banking', options: null}],
            choices: [{label: '', type: 'input-text', name: 'it-mobile-banking-exp', options: null}]
            },
            { competencies: [{label: 'Fintech', type: 'text', name: 't-fintech', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-fintech-exp', options: null}]
            },
            { competencies: [{label: 'Identity', type: 'text', name: 't-identity', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-identity-exp', options: null}]
            },
            { competencies: [{label: 'Vocal assistant', type: 'text', name: 't-vocal-assistant', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-vocal-assistant-exp', options: null}]
            },
            { competencies: [{label: 'Chatbots', type: 'text', name: 't-chatbots', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-chatbots-exp', options: null}]
            },
            { competencies: [{label: 'Customer relationship', type: 'text', name: 't-customer-rel', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-customer-rel-exp', options: null}]
            },
            { competencies: [{label: 'Connected objects and devices', type: 'text', name: 't-iot', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-iot-exp', options: null}]
            },
            { competencies: [{label: 'Enter your other competence related to transaction or communication services', type: 'input-text', name: 'it-other-1', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-other-1-order', options: null}]
            },
            { competencies: [{label: 'Enter your other competence related to transaction or communication services', type: 'input-text', name: 'it-other-2', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-other-2-order', options: null}]
            }
          ]
        }},
        {label: 'Please give details on your specific areas of expertise: ', type: 'textarea', name: 'ta-areas-expertise', options: null},
        {label: 'What actions have you undertaken to develop your expertise?', type: 'textarea', name: 'ta-dev-expertises', options: null},
        {label: 'What are the technical topics and the personal skills on which you believe you still have to improve?', type: 'textarea', name: 'ta-still-improve', options: null}

      ]}
    ]
  },

  /****** Achievements ******/
  {name: 'Achievements', icon: 'fa-tasks', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Achievements/Influence in Transaction & Communication services', questions: [
        {label: '<strong>In one page</strong>, please describe <strong>your three main contributions</strong> to the transaction & communication services domain (internal projects, product launches, surveys, \
        coordination, education, papers and communications, etc.) that best illustrate your expertise. Please specify the context (date and project, upon request or \
        by own initiative), and your specific role.<br/><strong>Please avoid duplicating your resume.</strong>', type: 'textarea', name: 'ta-three-contribs', options: null}
      ]}
    ]
  },

  /****** Vision ******/
  {name: 'Vision', icon: 'fa-lightbulb-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Vision on Transactions & Communication Services Transformations', questions: [
        {label: 'According to you, what are the key transformations to be addressed by the Transactions & Communication Services community (10 lines min)?', type: 'textarea', name: 'ta-vision', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Other Skills', icon: 'fa-tags', active: false, valid: false, hasError: false,
    form: [
      {group: 'Abilities (please illustrate the following abilities with concrete examples)', questions: [
        {label: '<strong>Lead studies and expertise missions:</strong>', type: 'textarea', name: 'ta-missions', options: null},
        {label: '<strong>Interact with Business stakeholders:</strong>', type: 'textarea', name: 'ta-interact-business', options: null},
        {label: '<strong>"Watch technologies" innovate and capitalise:</strong>', type: 'textarea', name: 'ta-innovate', options: null},
        {label: '<strong>Pass on knowledges:</strong>', type: 'textarea', name: 'ta-exp-knowledge', options: null},
        {label: '<strong>Represent the company:</strong>', type: 'textarea', name: 'ta-represent-company', options: null},
      ]},
      {group: 'Behavioural Skills (please illustrate the following skills with concrete examples)', questions: [
        {label: '<strong>Communication written and oral in front of an audience:</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Innovation (including patents):</strong>', type: 'textarea', name: 'ta-innovation', options: null},
        {label: '<strong>English level (beginner, intermediate, advanced, native):</strong>', type: 'textarea', name: 'ta-english', options: null},
        {label: '<strong>Being Orange strategy-minded:</strong>', type: 'textarea', name: 'ta-strategy', options: null},
        {label: '<strong>Leadership, influencing skills:</strong>', type: 'textarea', name: 'ta-leadership', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Motivations to Contribute to the Community', questions: [
        {label: 'What is your interest to participate in the Transaction & Communication Services (TCS) community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null},
        {label: 'Do you commit to regularly contribute to the activities, technical production and seminars of the community?', type: 'textarea', name: 'ta-participation', options: null},
        {label: 'Could you already identify what topic you would like to handle through webinar, executive memos, ecosystem survey, tutorial, etc.?', type: 'textarea', name: 'ta-topic-contribution', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Transaction-and-Communication-Services.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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

  /****** Expertise ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Expertise Evolution', questions: [
        {label: 'You have joined the TCS community in?', type: 'select', name: 'sl-joined-community', options: {items: [
          '2014',
          '2015',
          '2016',
          '2017',
          '2018',
          '2019'
          ],
          widthClass: 'col-md-6'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
        {label: 'Please describe your role in your entity and if any evolution in term of responsibility/influence occurred since your nomination?', type: 'textarea', name: 'ta-role-entity', options: null},
        {label: 'What is your todays main expertise related to Transaction & Communication Services?', type: 'textarea', name: 'ta-today-main-expertise', option:null}
      ]},
      {group: 'Your Competencies', questions: [
        {label: 'Your profile: Select the most appropriate choice(s) in the 3 following tables that characterize your profile', type: 'text', name: 't-profile', option:null},
        {label: 'Select your Market orientation: ', type: 'select', name: 'sl-market-orientation', options: {items: [
          'Enterprise markets',
          'Residential market',
          'All markets',
          'OTT ecosystem'
          ],
          widthClass: 'col-md-6'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
        {label: 'Area of competencies', type: 'mix-array', name: 'ma-area-competencies',
        options: {
          columns: [
            {name: 'Area of competencies', prop: 'competencies', templates: ['text','input-text']},
            {name: 'Prioritized choices', prop: 'choices', templates: ['text-input']}
          ],
          rows: [
            { competencies: [{label: 'Strategy & Regulation', type: 'text', name: 't-strategy', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-strategy-order', options: null}]
            },
            { competencies: [{label: 'Customer Needs (MKT)', type: 'text', name: 't-customer-needs', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-customer-needs-order', options: null}]
            },
            { competencies: [{label: 'User eXperience', type: 'text', name: 't-ux', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-ux-order', options: null}]
            },
            { competencies: [{label: 'Device functions', type: 'text', name: 't-device-functions', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-device-functions-order', options: null}]
            },
            { competencies: [{label: 'Media technologies', type: 'text', name: 't-media-technologies', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-media-technologies-order', options: null}]
            },
            { competencies: [{label: 'Service Platform', type: 'text', name: 't-service-platform', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-service-platform-order', options: null}]
            },
            { competencies: [{label: 'Information System', type: 'text', name: 't-information-system', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-information-system-order', options: null}]
            },
            { competencies: [{label: 'Standardisation', type: 'text', name: 't-standardisation', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-standardisation-order', options: null}]
            },
            { competencies: [{label: 'Development', type: 'text', name: 't-development', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-development-order', options: null}]
            },
            { competencies: [{label: 'Analytics', type: 'text', name: 't-analytics', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-analytics-order', options: null}]
            },
            { competencies: [{label: 'Enter your other proposal', type: 'input-text', name: 'it-other-area-1', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-other-area-1-order', options: null}]
            },
            { competencies: [{label: 'Enter your other proposal', type: 'input-text', name: 'it-other-area-2', options: null}],
              choices: [{label: '', type: 'input-text', name: 'it-other-area-2-order', options: null}]
            }
          ]
        }}
      ]}
    ]
  },

  /****** Self Assessment  ******/
  {name: 'Assessment', icon: 'fa-commenting', active: false, valid: false, hasError: false,
    form: [
      {group: 'Self Assessment', questions: [
        {label: 'Describe your satisfactions, expectations, your personal involvements within "Transaction & Communication Services" Community (TCS).', type: 'text', name: 't-expert', options: null},
        {label: 'How would you rate your interest/satisfaction of being an OE in TCS?',type: 'input-radio', name: 'ir-interest', options: {
          items: [
            {label: 'low', name: 'r-interest-low'},
            {label: 'normal', name: 'r-interest-normal'},
            {label: 'high', name: 'r-interest-high'}
          ],
          widthClass: 'w-100' /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc, w-100 pour aller à la ligne à chaque élement ***/
        }},
        {label: 'Please justify your rating (highlights, lowlights, and suggestions for improvement, expectations...).', type: 'textarea', name: 'ta-interest-comment', options: null},
        {label: 'How much of your time do you dedicate to TCS activities (expected value 10%)?',type: 'input-text', name: 'it-time', options: null},
        {label: 'Please comment: ', type: 'textarea', name: 'ta-time-comment', options: null},
        {label: 'How would you rate your overall involvement/contributions to TCS?',type: 'input-radio', name: 'ir-contribution', options: {
          items: [
            {label: 'low', name: 'r-contribution-low'},
            {label: 'normal', name: 'r-contribution-normal'},
            {label: 'high', name: 'r-contribution-high'}
          ],
          widthClass: 'w-100'
        }},
        {label: 'Please justify your rating', type: 'textarea', name: 'ta-involment-comment', options: null},
        {label: 'How often have you attended the TCS Meetings / Seminars / Workshops? (if  you  were not able to participate, explain the main reasons why)',
        type: 'mix-array', name: 'ta-attend-csut-meetings', options: {
          columns: [
            {name: '', prop: 'involvement', templates: ['text']},
            {name: 'Justification/Comments', prop: 'comments', templates: ['textarea']}
          ],
          rows: [
              { involvement: [{label: 'Community meetings (10 a year): ', type: 'text', name: 't-attend-meetings', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-attend-meetings-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Annual seminar (1 a Year): ', type: 'text', name: 't-attend-seminar', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-attend-seminar-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Your participation to specific workshops: ', type: 'text', name: 't-attend-workshop', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-attend-workshop-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Others: ', type: 'text', name: 't-attend-others', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-attend-others-comments', options: {height: '130px'}}
                ]
              }
          ]
        }},
        {label: 'State which TCS activities you have organized / coordinated / suggested.',
        type: 'mix-array', name: 'ta-csut-activities', options: {
          columns: [
            {name: '', prop: 'involvement', templates: ['text']},
            {name: 'Justification/Comments', prop: 'comments', templates: ['textarea']}
          ],
          rows: [
              { involvement: [{label: 'Plazza usage: (are you readers only?, do you react to post?, are you posting?...)', type: 'text', name: 't-activities-plazza', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-plazza-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Training activities: ', type: 'text', name: 't-activities-training', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-training-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'ThinkTank activities: ', type: 'text', name: 't-activities-thinktank', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-thinktank-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Webinars activities: ', type: 'text', name: 't-activities-webinars', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-webinars-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Memo coordination or contribution: ', type: 'text', name: 't-activities-memo-contrib', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-memo-contrib-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Workshop activities: ', type: 'text', name: 't-activities-workshops', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-workshops-comments', options: {height: '130px'}}
                ]
              },
              { involvement: [{label: 'Other activities: ', type: 'text', name: 't-activities-other', options: null}],
                comments: [
                  {label: '', type: 'textarea', name: 'ta-activities-other-comments', options: {height: '130px'}}
                ]
              }
          ]
        }},
        {label: 'Describe your contributions addressed in TCS Community.',type: 'textarea', name: 'ta-contrib-in-csut', options: null},
        {label: 'How have you delivered your contribution (document, presentation, mail discussion)?', type: 'textarea', name: 'ta-deliver-contrib', options: null},
        {label: 'How have you promoted your TCS membership outside the community (use of Communication Services logo, presentation as Orange Expert, etc.? Please provide evidence)', type: 'textarea', name: 'ta-promoted-cust', options: null},
        {label: 'What has the OE community brought to you?',type: 'textarea', name: 'ta-bought-oe-csut', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Next Involvements', questions: [
        {label: 'What is your motivation in renewing your application in the TCS Community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null},
        {label: 'Mention some example of technical contributions related to your skills that you intend to address in TCS community, should your membership be renewed?', type: 'textarea', name: 'ta-renewed', options: null},
        {label: 'What type of activity do you envision within TCS community to foster exchange on your expertise area?', type: 'textarea', name: 'ta-type-activity', options: null},
        {label: 'Would you agree to take some responsibility for chairing a stream or participating in TCS visibility (newsletter, blog, forum, etc.)? If yes, please indicate potential actions.', type: 'textarea', name: 'ta-responsibility', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Transaction-and-Communication-Services.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
      ]},
      {group: 'Charter "Orange Expert Journey"', questions: [
        {label: 'Sign the Charter, then scan and upload it as a pdf file. The Charter "Orange Expert Journey" can be downloaded <a href="assets/misc/MR-letters/Charter_OE_Journey.pdf" target="_blank" rel="noopener noreferrer"><mark>here</mark></a>.', type: 'input-file', name: 'file-orange-expert-charter', options: null}
      ]},
      {group: 'Other documents (optional)', questions: [
        {label: 'Upload your other documents or recommendation letters (only pdf).', type: 'dropzone', name: 'other-documents-upload', options: null}
      ]}
    ]
  },

  {name: 'Submission', icon: 'fa-paper-plane-o', active: false, valid: false, hasError: false, form: null}

];


/***************/
/***** DOC *****/
/***************/
const communityName = 'Transaction & Communication Services'; /* Communication Services */
const doc = {
  name: communityName,
  label: 'CommSrvApp',
  flag: 32,
  referentName: 'Emmanuel BERTIN',
  referentMail: 'emmanuel.bertin@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
