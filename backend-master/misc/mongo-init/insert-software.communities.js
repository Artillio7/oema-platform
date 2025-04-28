/**
 * Software community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-software.communities.js
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
        {label: 'Explain in one sentence your current activity and position.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted to Software activities?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time have you devoted to Software in the last 3 years? (in % of your time)', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'What actions have you undertaken to develop your technical skills?', type: 'textarea', name: 'ta-exp-tech-skills', options: null},
        {label: 'What actions have you undertaken to develop your soft skills?', type: 'textarea', name: 'ta-exp-soft-skills', options: null}
      ]},
      {group: 'Top Achievements', questions: [
        {label: 'Within 1 to 3 pages, please describe your three main achievements related to Software (e.g., internal projects, infrastructure deployments, \
        test procedures, product launches, surveys, coordination, education, papers and communications, etc.) that best illustrate your expertise. Please \
        specify the context (date and project, the technologies involved, the challenges you faced, ...), and your specific role.<br/>\
        <strong>Please avoid bullet points or duplicating your resume.</strong>', type: 'textarea', name: 'ta-activity-soft', options: null}
      ]},
      {group: 'Your Vision about Software', questions: [
        {label: 'What are the most important aspects in a good Software according to you? Please provide your vision on Software (10 lines min).', type: 'textarea', name: 'ta-vision-good-software', options: null},
        {label: 'What are the most important challenges for Orange to be successful in dealing with Software in 2025? What could be your contribution? Please provide your view (10 lines min).', type: 'textarea', name: 'ta-vision-orange22', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Expertise Domains', questions: [
        {label: 'Please rate (from little knowledge <span class="battery-0"><i class="fa fa-battery-0"></i></span> to top-class expert \
        <span class="battery-4"><i class="fa fa-battery-4"></i></span>) your expertise in the following software domains \
        (and add other domains as needed).', type: 'battery-levels', name: 'bl-expertise-guide', options: {items: [
              {label: 'Agile methods', name: 'b-agile'},
              {label: 'Big data', name: 'b-bigdata'},
              {label: 'Business intelligence', name: 'b-business'},
              {label: 'Cloud infrastructure', name: 'b-cloud'},
              {label: 'Databases', name: 'b-database'},
              {label: 'Desktop applications', name: 'b-desktop'},
              {label: 'DevOps', name: 'b-devops'},
              {label: 'Embedded, real-time software', name: 'b-embedded'},
              {label: 'Enterprise server applications', name: 'b-enterprise'},
              {label: 'Machine learning', name: 'b-learning'},
              {label: 'Middleware', name: 'b-middleware'},
              {label: 'Mobile applications', name: 'b-mobile'},
              {label: 'Network administration', name: 'b-network'},
              {label: 'Open Source', name: 'b-open-source'},
              {label: 'Platform administration', name: 'b-platform'},
              {label: 'Rules engines, MDA', name: 'b-rules'},
              {label: 'Security/Blockchain', name: 'b-security'},
              {label: 'Tests, Metrology', name: 'b-tests'},
              {label: 'User interface design', name: 'b-user'},
              {label: 'Web applications', name: 'b-web'}


        ], review:true, preview: 'Expertise Domains'}},
        {label: '<strong>Optionally</strong>, you can add others expertise domains (if not listed above).', type: 'textarea', name: 'ta-other-expertises',
        options: {review:true, preview: 'Other Expertise Domains'}},
      ]},
      {group: 'Software Abilities', questions: [
        {label: '<p class="text-primary"><strong>Please describe situations where you have leveraged your skills in each of the following software abilities (if any). \
        Detail with your concrete project examples & experiences.</strong></p>', type: 'text', name: 't-software-abilities', options: null},
        {label: '<strong>Design code that solves complex problems:</strong>', type: 'textarea', name: 'ta-design-code', options: null},
        {label: '<strong>Design complex software architectures:</strong>', type: 'textarea', name: 'ta-design-archi', options: null},
        {label: '<strong>Write high quality software:</strong>', type: 'textarea', name: 'ta-high-quality', options: null},
        {label: '<strong>Deploy and operate complex applications:</strong>', type: 'textarea', name: 'ta-deploy-complex', options: null},
        {label: '<strong>Implement software engineering methodologies:</strong>', type: 'textarea', name: 'ta-implement', options: null},
        {label: '<strong>Design user-friendly applications:</strong>', type: 'textarea', name: 'ta-user-friendly', options: null},
        {label: '<strong>Operate complex infrastructures:</strong>', type: 'textarea', name: 'ta-complex-infra', options: null},
        {label: '<strong>Integrate and/or test complex systems:</strong>', type: 'textarea', name: 'ta-integrate-complex-sys', options: null}
      ]},
      {group: 'Professional Abilities', questions: [
        {label: '<p class="text-primary"><strong>Please describe situations where you have leveraged your skills in the following professional abilities (if any). \
        Detail with your concrete project examples & experiences.</strong></p>', type: 'text', name: 't-professional-abilities', options: null},
        {label: '<strong>Lead studies and expertise missions:</strong>', type: 'textarea', name: 'ta-lead-studies', options: null},
        {label: '<strong>Interact with Business stakeholders:</strong>', type: 'textarea', name: 'ta-business-stakeholders', options: null},
        {label: '<strong>"Watch technology", innovate and capitalise:</strong>', type: 'textarea', name: 'ta-innovate', options: null},
        {label: '<strong>Pass on experience and knowledge:</strong>', type: 'textarea', name: 'ta-exp-knowledge', options: null},
        {label: '<strong>Maintain a strong professional network:</strong>', type: 'textarea', name: 'ta-professional-network', options: null},
        {label: '<strong>Represent the company:</strong>', type: 'textarea', name: 'ta-represent-company', options: null}
      ]},
      {group: 'Behavioural Abilities', questions: [
        {label: '<p class="text-primary"><strong>Please give concrete examples that demonstrate your skills in each of the following behavioural abilities (if any).</strong></p>',
        type: 'text', name: 't-behavioural-skills', options: null},
        {label: '<strong>Communication / knowledge transfer:</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Innovation / entrepreneurship:</strong>', type: 'textarea', name: 'ta-innovation', options: null},
        {label: '<strong>Being strategy-oriented / transformation:</strong>', type: 'textarea', name: 'ta-strategy', options: null},
        {label: '<strong>Leadership, influencing skills:</strong>', type: 'textarea', name: 'ta-leadership', options: null},
        {label: '<strong>Work in English:</strong>', type: 'textarea', name: 'ta-english', options: null},
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your motivation in participating in the Orange Expert Software Community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Culture', questions: [
        {label: 'Tell us about software-related book(s), web sites, evangelists, Twitters that impact(ed) your "software expertise".<br/>\
         Tell us why. (5 to 10 lines)', type: 'textarea', name: 'ta-culture', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'Do you commit to regularly contribute to the technical production and seminars of the community, if selected?', type: 'textarea', name: 'ta-contribute', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Software.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
        {label: 'How many years of experience have you devoted to Software activities?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time have you devoted to Software in the last 3 years (in % of your time)', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'What actions have you undertaken to develop your skills?', type: 'textarea', name: 'ta-exp-skills', options: null}
      ]},
      {group: 'Top Achievements', questions: [
        {label: 'Within 1 to 3 pages, please describe your three main achievements related to Software  (e.g., internal projects, infrastructure deployments, \
          test procedures, product launches, surveys, coordination, education, papers and communications, etc.) that best illustrate your expertise. Please \
          specify the context (date and project, the technologies involved, the challenges you faced, ...), and your specific role.<br/>\
          Please avoid bullet points or duplicating your resume.', type: 'textarea', name: 'ta-activity-soft', options: null}
      ]},
      {group: 'Your Vision about Software', questions: [
        {label: 'What are the most important challenges for Orange to be successful in dealing with Software in 2025? What could be your contribution? Please provide your view (10 lines min).', type: 'textarea', name: 'ta-vision-orange22', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Expertise Domains', questions: [
        {label: 'Please rate (from little knowledge <span class="battery-0"><i class="fa fa-battery-0"></i></span> to top-class expert \
        <span class="battery-4"><i class="fa fa-battery-4"></i></span>) your expertise in the following software domains \
        (and add other domains as needed).', type: 'battery-levels', name: 'bl-expertise-guide', options: {items: [
          {label: 'Agile methods', name: 'b-agile'},
          {label: 'Big data', name: 'b-bigdata'},
          {label: 'Business intelligence', name: 'b-business'},
          {label: 'Cloud infrastructure', name: 'b-cloud'},
          {label: 'Databases', name: 'b-database'},
          {label: 'Desktop applications', name: 'b-desktop'},
          {label: 'DevOps', name: 'b-devops'},
          {label: 'Embedded, real-time software', name: 'b-embedded'},
          {label: 'Enterprise server applications', name: 'b-enterprise'},
          {label: 'Machine learning', name: 'b-learning'},
          {label: 'Middleware', name: 'b-middleware'},
          {label: 'Mobile applications', name: 'b-mobile'},
          {label: 'Network administration', name: 'b-network'},
          {label: 'Open Source', name: 'b-open-source'},
          {label: 'Platform administration', name: 'b-platform'},
          {label: 'Rules engines, MDA', name: 'b-rules'},
          {label: 'Security', name: 'b-security'},
          {label: 'Tests, Metrology', name: 'b-tests'},
          {label: 'User interface design', name: 'b-user'},
          {label: 'Web applications', name: 'b-web'}
        ], review:true, preview: 'Expertise Domains'}},
        {label: '<strong>Optionally</strong>, you can add others expertise domains (if not listed above).', type: 'textarea', name: 'ta-other-expertises',
        options: {review:true, preview: 'Other Expertise Domains'}},
      ]}

    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Self Assessment', questions: [
        {label: 'Please rate your satisfation for being an OESW. (Note /10)', type: 'input-text', name: 'it-satisfaction-rate', options: null},
        {label: 'Please justify your rating (highlights, lowlights, suggestions for improvement...). ', type: 'textarea', name: 'ta-satisfaction-comment', options: null},
        {label: 'How much of your time do you dedicate to OESW activities and other transverse activities (expected value: 10%) (percentage)', type: 'input-text', name: 'it-time', options: null},
        {label: 'Please comment.', type: 'textarea', name: 'ta-time-comment', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'Please rate the level of your contribution to up to 3 OESW Initiatives you participated over the past 6 months.', type: 'mix-array', name: 'ma-rate-contrib',
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
        {label: 'Please describe other OESW-related activities you may have contributed if any (steerco membership, OESW application Jury, Project Fair @ OESW Days,\
          project support, Initiative leadership, ...): ', type: 'textarea', name: 'ta-other-contribute', options: null},
        {label: 'Please estimate your overall contribution to OESW community: (Note /10)', type: 'input-text', name: 'it-estimate-contribution', options: null}
      ]},
      {group: 'Objective Key Result', questions: [
        {label: 'As per “Objective Key Result” method already presented, you are invited to test it by setting yourself an objective for end 2021/Jan. 2022).\
        For that purpose, visit \
        <a href="https://plazza.orange.com/groups/oswe-internal-chatters/projects/okr-oesw-s2-2018" target="_blank">the OKR space on Plazza</a>, \
        review existing objectives, select one if you like and add your name among owners.\
        Alternately, you may also create your own objective, with a new post (using the same format).', type: 'mix-array', name: 'ma-okr',
        options: {
          columns: [
            {name: 'Select one option', prop: 'objective', templates: ['input-radio']},
            {name: 'Please tell us your plans about Objective Key Result (OKR) proposal', prop: 'okr', templates: ['text']},
            {name: 'Comments', prop: 'comments', templates: ['textarea','textarea']}
          ],
          rows: [
              { objective: [{label: '',type: 'input-radio', name: 'ir-okr-option', options: {
                  items: [
                    {label: '', name: 'r-already-set'},
                  ]
                }}],
                okr: [{label: 'I have already set myself an objective on Plazza OKR space. ', type: 'text', name: 't-okr-1', options: null}],
                comments: [
                  {label: 'The URL is: ', type: 'textarea', name: 'ta-okr-url', options: null},
                  {label: 'Other comment (if any): ', type: 'textarea', name: 'ta-okr-comment', options: null}
                ]
              },
              { objective: [{label: '',type: 'input-radio', name: 'ir-okr-option', options: {
                  items: [
                    {label: '', name: 'r-keep-secrete'},
                  ]
                }}],
                okr: [{label: 'I have already set myself an objective, but I do not wish to make it public ', type: 'text', name: 't-okr-2', options: null}],
                comments: [
                  {label: 'Objective outline (optional)', type: 'textarea', name: 'ta-okr-objective-outline', options: null}
                ]
              },
              { objective: [{label: '',type: 'input-radio', name: 'ir-okr-option', options: {
                  items: [
                    {label: '', name: 'r-considering-later'},
                  ]
                }}],
                okr: [{label: 'I am considering to set myself an objective this year ', type: 'text', name: 't-okr-3', options: null}],
                comments: [
                  {label: 'Please comment (not found one yet, process not clear enough, I have a question, ...): ', type: 'textarea', name: 'ta-okr-later-comment-', options: null}
                ]
              },
              { objective: [{label: '',type: 'input-radio', name: 'ir-okr-option', options: {
                  items: [
                    {label: '', name: 'r-not-planned'},
                  ]
                }}],
                okr: [{label: 'I do not intend to set myself an objective this year', type: 'text', name: 't-okr-4', options: null}],
                comments: [
                  {label: 'Please comment (not interested, no time, ...): ', type: 'textarea', name: 'ta-okr-nok-comment', options: null}
                ]
              }
          ]
        }}
      ]},
      {group: 'Your View on OESW Influence', questions: [
        {label: 'In terms of notoriety, what impact do you think the community has [on Orange and beyond]?', type: 'textarea',
        name: 'ta-oesw-influence-notoriety', options: null},
        {label: 'Does it meet your expectations?', type: 'textarea', name: 'ta-oesw-influence-expectation', options: null},
        {label: 'On a <strong>personal</strong> point of view: what would be the ingredients you would expect for feeling acknowledged?', type: 'textarea',
        name: 'ta-oesw-influence-personal-acknowledged', options: null},
        {label: 'On  a <strong>collective (community)</strong> point of view : what would be the ingredients you would expect for feeling acknowledged ?',
        type: 'textarea', name: 'ta-oesw-influence-community-acknowledged', options: null},
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Software.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Software';
const doc = {
  name: communityName,
  label: 'SoftwareApp',
  flag: 1,
  referentName: 'Jérôme HANNEBELLE',
  referentMail: 'jerome.hannebelle@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
