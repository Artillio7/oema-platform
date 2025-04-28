/**
 * Experts-DTSI community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-experts-dtsi.communities.js
 *
 */
/* modif ADU
10/04/2019 : remplacement Dev-seniors DSI par "Experts-DTSI"
remplacement d'OESW' par "dev seniors DSI" (7 occurences)
création du
{label: 'data science'} ,
dans les 2 formulaire
formulaire reneaw "motivation changement des deux questions à la fin pour mettre expert au lieu d'oesw"
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
        {label: 'Explain in one sentence your current activity and position.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted to the present domain of expertise?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time did you devote to the Domain of Expertise in the last 3 years (in % of your time)?', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'What actions have you implemented to develop your skills?', type: 'textarea', name: 'ta-exp-skills', options: null}
      ]},
      {group: 'Activity in the Domain "Software"', questions: [
        {label: 'Please describe your three main contributions to "Software" domain (e.g., internal projects, product launches, surveys coordination, education, papers \
        and communications, etc.) that best illustrate your expertise. Please specify the context (date and project, upon request or by own initiative), and your \
        specific role.<br/>Thanks to avoid listing with bullets and duplicating your resume.', type: 'textarea', name: 'ta-activity-soft', options: null}
      ]},
      {group: 'Your Vision about "Software"', questions: [
        {label: 'What are the issues and transformations that you think are the most important for Orange to be successful in "Software" in the context of essentials \
        2020? Please provide your vision of Software.', type: 'textarea', name: 'ta-vision-soft', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Expertises Guide', questions: [
        {label: 'Please rate (from little knowledge <span class="battery-0"><i class="fa fa-battery-0"></i></span>; to top-class expert \
        <span class="battery-4"><i class="fa fa-battery-4"></i></span>) your expertise in the following software domains \
        (and add other domains as needed).', type: 'battery-levels', name: 'bl-expertise-guide', options: {items: [
              {label: 'Agile methods', name: 'b-agile'},
              {label: 'Big data', name: 'b-bigdata'},
              {label: 'Business intelligence', name: 'b-business'},
              {label: 'Data science', name: 'b-datax'} ,
              {label: 'Machine/Deep learning', name: 'b-learning'},
              {label: 'Cloud infrastructure', name: 'b-cloud'},
              {label: 'Databases', name: 'b-database'},
              {label: 'Devops', name: 'b-devops'},
              {label: 'Embedded real-time software', name: 'b-embedded'},
              {label: 'Enterprise server applications', name: 'b-enterprise'},
              {label: 'Tests', name: 'b-tests'},
              {label: 'Middleware', name: 'b-middleware'},
              {label: 'Mobile applications', name: 'b-mobile'},
              {label: 'Network administration', name: 'b-network'},
              {label: 'Platform administration', name: 'b-platform'},
              {label: 'Rules engines MDA', name: 'b-rules'},
              {label: 'User interface design', name: 'b-user'},
              {label: 'Web applications', name: 'b-web'},
              {label: 'Desktop applications', name: 'b-desktop'},
        ], review:true, preview: 'Expertises guide'}}
      ]},
      {group: 'Others Abilities (Please illustrate the following items with concrete examples)', questions: [
        {label: '<strong>Support Orange (or your entity) (advise, validate, resolve):</strong>', type: 'textarea', name: 'ta-support-orange', options: null},
        {label: '<strong>Innovate and capitalise:</strong>', type: 'textarea', name: 'ta-innovate', options: null},
        {label: '<strong>Pass on experience and knowledge:</strong>', type: 'textarea', name: 'ta-exp-knowledge', options: null},
        {label: '<strong>Represent the entity/company:</strong>', type: 'textarea', name: 'ta-represent-company', options: null},
      ]},
      {group: 'Behavioural Skills (Please illustrate the following items with concrete examples)', questions: [
        {label: '<strong>Communication:</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Innovation:</strong>', type: 'textarea', name: 'ta-innovation', options: null},
        {label: '<strong>Being strategy-oriented:</strong>', type: 'textarea', name: 'ta-strategy', options: null},
        {label: '<strong>Leadership, influencing skills:</strong>', type: 'textarea', name: 'ta-leadership', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your motivation in participating in the "Experts-DTSI" Community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'Do you commit to regularly contribute to the technical production and seminars of the community, if selected? If yes, please mention the topics that \
        you attend to contribute.', type: 'textarea', name: 'ta-contribute', options: null}
      ]}
    ]
  },

  /******  Uploads   ******/
  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Manager Recommendation', questions: [
        {label: 'Upload your recommendation letter (only pdf). The manager recommendation letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Experts-DTSI.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
      {group: 'About you', questions:null}
    ]
  },

  /****** Experience ******/
  {name: 'Experience', icon: 'fa-flask', active: false, valid: false, hasError: false,
    form: [
      {group: 'Current Activity and Position', questions: [
        {label: 'Explain in one sentence your current activity and position.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted to the present domain of expertise?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time did you devote to the Domain of Expertise in the last 3 years (in % of your time)?', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'What actions have you implemented to develop your skills?', type: 'textarea', name: 'ta-exp-skills', options: null}
      ]},
      {group: 'Activity in the Domain "Software"', questions: [
        {label: 'Please describe your three main contributions to "Software" domain (e.g., internal projects, product launches, surveys coordination, education, papers \
        and communications, etc.) that best illustrate your expertise. Please specify the context (date and project, upon request or by own initiative), and your \
        specific role.<br/>Thanks to avoid listing with bullets and duplicating your resume.', type: 'textarea', name: 'ta-activity-soft', options: null}
      ]},
      {group: 'Your Vision about "Software"', questions: [
        {label: 'What are the issues and transformations that you think are the most important for Orange to be successful in "Software" in the context of essentials \
        2020? Please provide your vision of Software', type: 'textarea', name: 'ta-vision-soft', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Expertises Guide', questions: [
        {label: 'Please rate (from little knowledge <span class="battery-0"><i class="fa fa-battery-0"></i></span>; to top-class expert \
        <span class="battery-4"><i class="fa fa-battery-4"></i></span>) your expertise in the following software domains \
        (and add other domains as needed).', type: 'battery-levels', name: 'bl-expertise-guide', options: {items: [
              {label: 'Agile methods', name: 'b-agile'},
              {label: 'Big data', name: 'b-bigdata'},
              {label: 'Business intelligence', name: 'b-business'},
              {label: 'data science', name: 'b-datax'} ,
              {label: 'Machine/Deep learning', name: 'b-learning'},
              {label: 'Cloud infrastructure', name: 'b-cloud'},
              {label: 'Databases', name: 'b-database'},
              {label: 'Devops', name: 'b-devops'},
              {label: 'Embedded real-time software', name: 'b-embedded'},
              {label: 'Enterprise server applications', name: 'b-enterprise'},
              {label: 'Tests', name: 'b-tests'},
              {label: 'Middleware', name: 'b-middleware'},
              {label: 'Mobile applications', name: 'b-mobile'},
              {label: 'Network administration', name: 'b-network'},
              {label: 'Platform administration', name: 'b-platform'},
              {label: 'Rules engines MDA', name: 'b-rules'},
              {label: 'User interface design', name: 'b-user'},
              {label: 'Web applications', name: 'b-web'},
              {label: 'Desktop applications', name: 'b-desktop'}
        ], review:true, preview: 'Expertises guide'}}
      ]}

    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Self Assessment', questions: [
        {label: 'Please rate your satisfation for being an Experts-DTSI. (Note /10)', type: 'input-text', name: 'it-satisfaction-rate', options: null},
        {label: 'Please justify your rating (highlights, lowlights, suggestions for improvement...). ', type: 'textarea', name: 'ta-satisfaction-comment', options: null},
        {label: 'How much of your time do you dedicate to "Experts-DTSI" activities and other transverse activities (expected value: 10%) (percentage)', type: 'input-text', name: 'it-time', options: null},
        {label: 'Please comment.', type: 'textarea', name: 'ta-time-comment', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'Please rate the level of your contribution to up to 3 Experts-DTSI group or OESW Initiatives you participated over the past 6 months', type: 'mix-array', name: 'ma-rate-contrib',
        options: {
          columns: [
            {name: 'Initiative', prop: 'initiative', templates: ['input-text']},
            {name: 'Rate your contribution (/10)', prop: 'rate', templates: ['input-text']},
            {name: 'Justification/Comments', prop: 'comments', templates: ['textarea', 'textarea']}
          ],
          rows: [
              { initiative: [{label: 'Initiative', type: 'input-text', name: 'it-initiative-1', options: null}],
                rate: [{label: 'Rate', type: 'input-text', name: 'it-rate-1', options: null}],
                comments: [
                  {label: 'description of your contribution (mention if you are a leader): ', type: 'textarea', name: 'ta-desc-contrib-1', options: {height: '130px'}},
                  {label: 'your comments on that initiative: ', type: 'textarea', name: 'ta-comment-initiative-1', options: {height: '130px'}}
                ]
              },
              { initiative: [{label: 'Initiative', type: 'input-text', name: 'it-initiative-2', options: null}],
                rate: [{label: 'Rate', type: 'input-text', name: 'it-rate-2', options: null}],
                comments: [
                  {label: 'description of your contribution (mention if you are a leader): ', type: 'textarea', name: 'ta-desc-contrib-2', options: {height: '130px'}},
                  {label: 'your comments on that initiative: ', type: 'textarea', name: 'ta-comment-initiative-2', options: {height: '130px'}}
                ]
              },
              { initiative: [{label: 'Initiative', type: 'input-text', name: 'it-initiative-3', options: null}],
                rate: [{label: 'Rate', type: 'input-text', name: 'it-rate-3', options: null}],
                comments: [
                  {label: 'description of your contribution (mention if you are a leader): ', type: 'textarea', name: 'ta-desc-contrib-3', options: {height: '130px'}},
                  {label: 'your comments on that initiative: ', type: 'textarea', name: 'ta-comment-initiative-3', options: {height: '130px'}}
                ]
              }
          ]
        }},
        {label: 'Please describe other expert activities you may have contributed if any (Experts-DTSI application Jury, Project Fair @ expert event or coderoom, DSI ITwebinar,  \
        project support, Initiative leadership, ...): ', type: 'textarea', name: 'ta-other-contribute', options: null},
        {label: 'Please estimate your overall contribution to expert community: (Note /10)', type: 'input-text', name: 'it-estimate-contribution', options: null}
      ]},
    ]
  },

  /******  Uploads   ******/
  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Manager Recommendation', questions: [
        {label: 'Upload your recommendation manager letter (only pdf). The manager recommendation letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Experts-DTSI.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Experts-DTSI';
const doc = {
  name: communityName,
  label: 'SeniorDevDsiApp',
  flag: 65536,
  referentName: 'Arnaud DUPEUX',
  referentMail: 'arnaud.dupeux@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
