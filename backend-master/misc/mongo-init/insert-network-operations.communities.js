/**
 * Future Operations community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-network-operations.communities.js
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
        {label: 'Explain in one sentence your current activity and position.', type: 'textarea', name: 'ta-current-position', options: {height: '70px',
        review:true, preview: 'Current activity and position'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted to IT or Network Operation?', type: 'input-text', name: 'it-expert-duration',
        options: {review:true, preview: 'Years of expertise'}},
        {label: 'How much time have you devoted to IT or Network operation in the last 3 years (in % of your time)', type: 'input-text', name: 'it-expert-time',
        options: {review:true, preview: '% time devoted to expertise'}},
        {label: 'What actions have you implemented to develop your skills?', type: 'textarea', name: 'ta-exp-skills',
        options: {review:true, preview: 'Actions to develop skills'}}
      ]},
      {group: 'Activity in IT or Network Operations', questions: [
        {label: 'Please describe your three main contributions to the IT or Network Operations domain (e.g., internal projects, product launches, surveys \
        coordination, education, papers and communications, etc.) that best illustrate your expertise. Please specify the context (date and project, upon \
        request or by own initiative) and your specific role.<br/><strong>Thanks to avoid listing with bullets and duplicating your resume.</strong>', type: 'textarea', name: 'ta-activity-netops',
        options: {review:true, preview: 'Main contributions'}}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Expertises Guide', questions: [
        {label: 'What is your main domain of expertise?', type: 'textarea', name: 'ta-main-expertise', options: {height: '70px',
        review:true, preview: 'main domain of expertise'}},
        {label: '<span class="text-primary"><strong>Please illustrate your knowledge and expertise in the following domains with concrete examples.</strong></span>', type: 'text', name: 't-expertise-domains', options: null},
        {label: '<strong>Operation processes:</strong>', type: 'textarea', name: 'ta-processes', options: null},
        {label: '<strong>CI/CD, DevSecOps, SRE, agile methods:</strong>', type: 'textarea', name: 'ta-cicd', options: null},
        {label: '<strong>Managed services and partner management:</strong>', type: 'textarea', name: 'ta-managed-services', options: null},
        {label: '<strong>Technical operation (supervision, technical management):</strong>', type: 'textarea', name: 'ta-tech-operation', options: null},
        {label: '<strong>Field operations:</strong>', type: 'textarea', name: 'ta-field-operations', options: null},
        {label: '<strong>Service and customer experience management:</strong>', type: 'textarea', name: 'ta-customer-exp', options: null},
        {label: '<strong>IT infrastructure and cloud operations:</strong>', type: 'textarea', name: 'ta-it-infra', options: null},
        {label: '<strong>Virtualized or Cloud native ITN functions operations:</strong>', type: 'textarea', name: 'ta-virtualization', options: null},
        {label: '<strong>OSS and operation automation with IA or ML:</strong>', type: 'textarea', name: 'ta-operation-automation', options: null},
        {label: '<strong>Internet of Things operation:</strong>', type: 'textarea', name: 'ta-iot-operation', options: null},
        {label: '<strong>5G, ORAN:</strong>', type: 'textarea', name: 'ta-5g', options: null},
        {label: '<strong>Other:</strong>', type: 'textarea', name: 'ta-other-expertise', options: null}
      ]},
      {group: 'Behavioural Skills (Please illustrate the following skills with concrete examples)', questions: [
        {label: '<strong>Communication and public speaking:</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Innovation:</strong>', type: 'textarea', name: 'ta-innovation', options: null},
        {label: '<strong>English:</strong>', type: 'textarea', name: 'ta-english', options: null},
        {label: '<strong>Being strategy-oriented:</strong>', type: 'textarea', name: 'ta-strategy', options: null},
        {label: '<strong>Leadership, influencing skills:</strong>', type: 'textarea', name: 'ta-leadership', options: null}
      ]},
      {group: 'Your Vision about Future IT and Network Operations', questions: [
        {label: 'According to you, what are the issues and transformations that you think are the most important for Orange to be successful in IT and Network \
        Operations in the future? Please provide your vision of future IT and Network Operations.', type: 'textarea', name: 'ta-vision-netops', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your motivation in participating in the Future Operations Community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Community Contribution', questions: [
        {label: 'Do you commit to regularly contribute to the technical production and seminars of the community, if selected? \
        (We remind you that you are expected to contribute up to 10% of your time.)', type: 'textarea', name: 'ta-contribute', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Future-Operations.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
        {label: 'Explain your current activity and position. Please mention if you have changed since you first joined the Orange Expert program.', type: 'textarea', name: 'ta-current-position', options: {height: '70px',
        review:true, preview: 'Current activity and position'}}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Expertises Guide', questions: [
        {label: 'What is your main domain of expertise?', type: 'textarea', name: 'ta-main-expertise', options: {height: '70px',
        review:true, preview: 'main domain of expertise'}},
        {label: '<span class="text-primary"><strong>Please illustrate your knowledge and expertise in the following domains with concrete examples.</strong></span>', type: 'text', name: 't-expertise-domains', options: null},
        {label: '<strong>Operation processes:</strong>', type: 'textarea', name: 'ta-processes', options: null},
        {label: '<strong>CI/CD, DevSecOps, SRE, agile methods:</strong>', type: 'textarea', name: 'ta-cicd', options: null},
        {label: '<strong>Managed services and partner management:</strong>', type: 'textarea', name: 'ta-managed-services', options: null},
        {label: '<strong>Technical operation (supervision, technical management):</strong>', type: 'textarea', name: 'ta-tech-operation', options: null},
        {label: '<strong>Field operations:</strong>', type: 'textarea', name: 'ta-field-operations', options: null},
        {label: '<strong>Service and customer experience management:</strong>', type: 'textarea', name: 'ta-customer-exp', options: null},
        {label: '<strong>IT infrastructure and cloud operations:</strong>', type: 'textarea', name: 'ta-it-infra', options: null},
        {label: '<strong>Virtualized or Cloud native ITN functions operations:</strong>', type: 'textarea', name: 'ta-virtualization', options: null},
        {label: '<strong>OSS and operation automation with IA or ML:</strong>', type: 'textarea', name: 'ta-operation-automation', options: null},
        {label: '<strong>Internet of Things operation:</strong>', type: 'textarea', name: 'ta-iot-operation', options: null},
        {label: '<strong>5G, ORAN:</strong>', type: 'textarea', name: 'ta-5g', options: null},
        {label: '<strong>Other:</strong>', type: 'textarea', name: 'ta-other-expertise', options: null}
      ]},
      {group: 'Behavioural Skills (Please illustrate the following skills with concrete examples)', questions: [
        {label: '<strong>Communication and public speaking:</strong>', type: 'textarea', name: 'ta-communication', options: null},
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
      {group: 'Contribution to the Future Operations Community', questions: [
        {label: 'Please detail your main contributions to the Future Operations community and specify to which streams you contributed the most.', type: 'textarea', name: 'ta-community-contribution', options: null},
        {label: 'Do you commit to regularly contribute to the technical production and seminars of the community, if renewed? \
        (We remind you that you are expected to contribute up to 10% of your time)', type: 'textarea', name: 'ta-contribute', options: null}
      ]},
      {group: 'Motivation and Expectations', questions: [
        {label: 'What motivates you to renew your participation to the community?  What would you like to bring to the community over the next 3 years?', type: 'textarea', name: 'ta-motivation-renew', options: null}
      ]},
      {group: 'Your Vision about Future IT and Network Operations', questions: [
        {label: 'According to you, what are the issues and transformations that you think are the most important for Orange to be successful in IT and Network \
        Operations in the future?  Please provide your vision of future IT and Network Operations.', type: 'textarea', name: 'ta-vision-netops', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Future-Operations.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Future Operations'; /* Network Operations */
const doc = {
  name: communityName,
  label: 'NetworkOpsApp',
  flag: 16,
  referentName: 'Piotr SKOCZYLAS',
  referentMail: 'piotr.skoczylas@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
