/**
 * Big Data and AI community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-big-data-ai.communities.js
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
        {label: 'Explain in one sentence what is your current activity and position.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills Development', questions: [
        {label: 'How many years of experience have you devoted to the Domain of Expertise? (a minimum of 5 years is required)', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time have you devoted to the Domain of Expertise in the last 3 years? (in % of your time)', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'What actions have you undertaken to develop your skills in the last 12 months?', type: 'textarea', name: 'ta-exp-skills', options: null}
      ]},
      {group: 'In which domains of application your expertise does apply?', questions: [
        {label: '<strong>Within 1 to 2 pages</strong>, describe your activities in the area of the community Big Data & AI, highlight the various contributions (e.g. internal \
        projects, surveys, coordination, continuing education, papers and communications, etc.). For each contribution, please specify the context (date and \
        project, upon request or by own initiative, operational/business/innovation/research), the objectives, the context (e.g. customer relation, \
        conversational agent, networks, IoT, Security, etc...), the deliverables and their impact (outcome and decisions).<br/>\
        <strong>Thanks to avoid listing with bullets and duplicating a CV... and mention prominent achievements and positions only.</strong>', type: 'textarea', name: 'ta-activity-bdai', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Hard Skills', questions: [
        {label: 'Among the following skills, check your principal skills and provide concrete description.', type: 'input-checkboxes', name: 'ic-methods', options: {
            items: {
              fullscreen: [
                {label: 'Software Engineering & Data Architecture \
                (e.g. Hadoop, SQL, NOSQL, collect, Privacy/Security, cloud/embedded, Acumos, ...)', name: 'c-engineering-arch'},
                {label: 'Machine Learning & AI technologies \
                (e.g. Statistical analysis, modeling, Deep Learning, Machine Learning, linguistic, ...)', name: 'c-ai-core'},
                {label: 'Privacy & Legal issues', name: 'c-legal'},
                {label: 'Data Valorization \
                (e.g. data mining, Business Inteligence, Data Vizualisation, Data Quality, ...)', name: 'c-data-valorization'},
                {label: 'Use Case & End-to-End Applications \
                (e.g. Vocal assistant, Natural Language Processing, scoring, cycle management, ...)', name: 'c-e2e-app-sys'},
                {label: 'Sociology, Ethics, Experience Design', name: 'c-experience-design'},
                {label: 'Others', name: 'c-others'}
              ]
            }
        }},
        {label: '<strong>Please detail (also assess for each of these entries what is you level of knowledge in these areas: some knowledge, good knowledge, expert):</strong>', type: 'textarea', name: 'ta-detail-choices', options: null},
      ]},
      {group: 'Abilities (Please illustrate the following abilities expected with concrete examples)', questions: [
        {label: '<strong>Guide studies and expertise:</strong>', type: 'textarea', name: 'ta-guide-studies', options: null},
        {label: '<strong>Support Business (advise validate, resolve):</strong>', type: 'textarea', name: 'ta-support-orange', options: null},
        {label: '<strong>Innovate and capitalise:</strong>', type: 'textarea', name: 'ta-innovate', options: null},
        {label: '<strong>Pass on experience and knowledge:</strong>', type: 'textarea', name: 'ta-exp-knowledge', options: null},
        {label: '<strong>Represent the company:</strong>', type: 'textarea', name: 'ta-represent-company', options: null},
      ]},
      {group: 'Behavioural Skills (Please illustrate the following skills expected with concrete examples)', questions: [
        {label: '<strong>Communication (both written and oral):</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Innovation:</strong>', type: 'textarea', name: 'ta-innovation', options: null},
        {label: '<strong>English:</strong>', type: 'textarea', name: 'ta-english', options: null},
        {label: '<strong>Being strategy-oriented:</strong>', type: 'textarea', name: 'ta-strategy', options: null},
        {label: '<strong>Leadership, influencing skills:</strong>', type: 'textarea', name: 'ta-leadership', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Vision about Big Data & AI', questions: [
        {label: 'In your opinion what are the most important issues for Orange to be successful in dealing with Big Data & AI? Please provide your vision (10 lines min).', type: 'textarea', name: 'ta-vision-issues-success', options: null}
      ]},
      {group: 'Motivation', questions: [
        {label: 'What is your motivation in participating in the Big Data & AI Community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Big-Data-and-AI.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
    ]
  },

  /******  Uploads   ******/
  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Manager Approval', questions: [
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Big-Data-and-AI.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Big Data & AI';
const doc = {
  name: communityName,
  label: 'BigDataAIApp',
  flag: 128,
  referentName: 'Stéphane PATEUX',
  referentMail: 'stephane.pateux@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
