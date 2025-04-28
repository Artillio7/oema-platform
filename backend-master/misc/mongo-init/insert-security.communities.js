/**
 * Security community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-security.communities.js
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
        {label: 'Please summarize in a few sentences what are your current position and domain of expertise (10 lines expected at least)', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted to the Security domain of expertise?', type: 'input-text', name: 'it-expert-duration',
        options: {review:true, preview: 'Years of expertise'}},
        {label: 'How much time did you devote to the security domain of Expertise in the last 3 years in % of your time?', type: 'input-text', name: 'it-expert-time',
        options: {review:true, preview: '% time devoted to expertise'}},
        {label: 'What actions have you implemented to develop your security skills?', type: 'textarea', name: 'ta-exp-skills',
        options: {review:true, preview: 'Actions to develop skills'}}
      ]},
      {group: 'Activities in the Security Domain', questions: [
        {label: '<strong>In a few sentences</strong>, describe the main security achievements that you have done in the past year.', type: 'textarea', name: 'ta-activity-security', options: null}
      ]},
      {group: 'Security Vision', questions: [
        {label: 'What is your vision of the security for Orange? What are the key security challenges?', type: 'textarea', name: 'ta-vision-security', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Abilities (Wherever it applies to you, please illustrate the following abilities expected with concrete examples)', questions: [
        {label: '<strong>Guide studies and expertise:</strong>', type: 'textarea', name: 'ta-guide-studies', options: null},
        {label: '<strong>Support Business: advise validate, resolve:</strong>', type: 'textarea', name: 'ta-support-orange', options: null},
        {label: '<strong>Innovate and capitalise:</strong>', type: 'textarea', name: 'ta-innovate', options: null},
        {label: '<strong>Pass on experience and knowledge:</strong>', type: 'textarea', name: 'ta-exp-knowledge', options: null},
        {label: '<strong>Represent the company:</strong>', type: 'textarea', name: 'ta-represent-company', options: null},
      ]},
      {group: 'Behavioural Skills (Wherever it applies to you, please illustrate the following skills expected with concrete examples)', questions: [
        {label: '<strong>Communication (written/oral):</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>English:</strong>', type: 'textarea', name: 'ta-english', options: null},
        {label: '<strong>Being strategy-oriented:</strong>', type: 'textarea', name: 'ta-strategy', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your motivation in becoming a Security Community member?', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'As a new comer if selected', questions: [
        {label: 'As a start a new comer shall propose a technical subject to share with community. What are you planning to present?', type: 'textarea', name: 'ta-new-comer', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'If selected, do you commit to regularly contribute to the technical production, sharing knowledge and seminars of the community? \
        (your manager shall give you 20 days /year for this contribution)', type: 'input-radio', name: 'ir-contribute', options: {
          items: [
            {label: 'YES', name: 'r-contribute-yes'},
            {label: 'NO', name: 'r-contribute-no'}
          ],
          widthClass: 'w-100'
        }}
      ]},
      {group: 'Important', questions: [
        {label: '<p>Security Orange Experts are expected to actively contribute to the community activities up to 10% of their working time, hence about 20 days per year for a full time.</p>\
        <p>The applicants and their managers MUST be aware that joining the Security community means true commitment.</p>', type: 'text', name: 't-commitment-contribution', options: null}
      ]},
      {group: 'How the Experts are selected?', questions: [
        {label: '<p>Yearly Orange Expert recruitment campaigns are the opportunity for candidates who are interested by Security activities to submit their application online. \
        The call usually closes at the end of September.</p>\
        <p>The candidate must have at least 3 years of experience in security, where security was the major competence and occupation.</p>\
        <p>The security governance structure detailed below, then meets several times, depending on the number of applications and the progress of the reviews and discussions, \
        between early October and mid-December, to review the applications and reach a consensus about the final decision for each candidate To help in the selection process, \
        the candidate may be called for a 30 minutes interview, giving her/him the possibility to introduce a security subject of her/his choice.</p>\
        <p>Decisions are final and given by the referent of the security community: Jean-Marc Blanco.</p>',
        type: 'text', name: 't-community-selection', options: null}
      ]},
      {group: 'Governance Structure or Core Team', questions: [
        {label: '<p>The governance structure of the Security community is composed of community experts strongly engaged into the community. Here is the members list:</p>\
        <ul><li>AYOUBI Alexandre TGI/OLS</li>\
        <li>BARITAUD Thierry WIN/OINIS</li>\
        <li>BRECHET Romain DSCS</li>\
        <li>BUTTI Laurent DTSI/DSI</li>\
        <li>CANARD Sebastien TGI/OLS</li>\
        <li>FRANCILLON Jerome DSCS</li>\
        <li>GORSE Stéphane TGI/OLN</li>\
        <li>GRANET Olivier DTSI/DERS</li>\
        <li>JAKUSIC Magali TGI/OLS</li>\
        <li>LESAINT Cécile WIN/OINIS</li>\
        <li>L HEREEC Franck DSCS</li>\
        <li>ROCHÉ Sébastien FG/DACRG</li>\
        <li>SCIACCO Stephane WIN/OINIS</li>\
        <li>VIVOLO Olivier DSCS</li></ul>\
        <p>If you are not sure to apply or if you have questions then do not hesitate to contact them.</p>', type: 'text', name: 't-core-team', options: null}
      ]},
    ]
  },

  /******  Uploads   ******/
  {name: 'Uploads', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {group: 'CV', questions: [
        {label: 'Upload your CV (only pdf).', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Manager Approval', questions: [
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Security.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
        {label: 'Please summarize in a few sentences what are your current position and domain of expertise. In the eventuality you would have changed jobs since you \
        joined Orange Experts, thanks to highlight the benefits of the new position for the community.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Please illustrate your progression or in which domain you enlarge your expertise.', questions: [
        {label: '<strong>Security Enablers and Services:</strong>', type: 'textarea', name: 'ta-enablers', options: null},
        {label: '<strong>Secured network architectures and protocols:</strong>', type: 'textarea', name: 'ta-network-archi', options: null},
        {label: '<strong>Secured system architectures:</strong>', type: 'textarea', name: 'ta-system-archi', options: null},
        {label: '<strong>Software Security:</strong>', type: 'textarea', name: 'ta-software', options: null},
        {label: '<strong>Security Evaluations and Audits:</strong>', type: 'textarea', name: 'ta-evaluation-audit', options: null},
        {label: '<strong>Cyber criminality, threat detection and mitigation:</strong>', type: 'textarea', name: 'ta-cybercriminality', options: null},
        {label: '<strong>Risk, Fraud and Security Management:</strong>', type: 'textarea', name: 'ta-risk-fraud', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Contribution within the Security Community', questions: [
        {label: 'Which domain(s)/projects are you actively currently contributing among the areas defined within Security?', type: 'textarea', name: 'ta-domain-contribution', options: null},
        {label: 'Describe your technical contribution specifically addressed in the community.', type: 'textarea', name: 'ta-technical-contribution', options: null},
        {label: 'How have you delivered your technical contribution (document, presentation, mail discussion)?', type: 'textarea', name: 'ta-delivred-contribution', options: null},
        {label: 'How have you promoted your Security membership outside the community (use our logo, presentation as Orange Expert, etc.)? Please provide evidence.', type: 'textarea', name: 'ta-promoted-community', options: null}
      ]},
      {group: 'Motivation for Renewal', questions: [
        {label: 'What is your motivation to renew your participation to the community?', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Important', questions: [
        {label: '<p>Security Orange Experts are expected to actively contribute to the community activities up to 10% of their working time, hence about 20 days per year for a full time.</p>\
        <p>The applicants and their managers MUST be aware that joining the Security community means true commitment.</p>', type: 'text', name: 't-commitment-contribution', options: null}
      ]},
      {group: 'How the Experts are selected?', questions: [
        {label: '<p>Yearly Orange Expert recruitment campaigns are the opportunity for candidates who are interested by Security activities to submit their application online. \
        The call usually closes at the end of September.</p>\
        <p>The candidate must have at least 3 years of experience in security, where security was the major competence and occupation.</p>\
        <p>The security governance structure detailed below, then meets several times, depending on the number of applications and the progress of the reviews and discussions, \
        between early October and mid-December, to review the applications and reach a consensus about the final decision for each candidate To help in the selection process, \
        the candidate may be called for a 30 minutes interview, giving her/him the possibility to introduce a security subject of her/his choice.</p>\
        <p>Decisions are final and given by the referent of the security community: Jean-Marc Blanco.</p>',
        type: 'text', name: 't-community-selection', options: null}
      ]},
      {group: 'Governance Structure or Core Team', questions: [
        {label: '<p>The governance structure of the Security community is composed of community experts strongly engaged into the community. Here is the members list:</p>\
        <ul><li>AYOUBI Alexandre TGI/OLS</li>\
        <li>BARITAUD Thierry WIN/OINIS</li>\
        <li>BRECHET Romain DSCS</li>\
        <li>BUTTI Laurent DTSI/DSI</li>\
        <li>CANARD Sebastien TGI/OLS</li>\
        <li>FRANCILLON Jerome DSCS</li>\
        <li>GORSE Stéphane TGI/OLN</li>\
        <li>GRANET Olivier DTSI/DERS</li>\
        <li>JAKUSIC Magali TGI/OLS</li>\
        <li>LESAINT Cécile WIN/OINIS</li>\
        <li>L HEREEC Franck DSCS</li>\
        <li>ROCHÉ Sébastien FG/DACRG</li>\
        <li>SCIACCO Stephane WIN/OINIS</li>\
        <li>VIVOLO Olivier DSCS</li></ul>\
        <p>If you are not sure to apply or if you have questions then do not hesitate to contact them.</p>', type: 'text', name: 't-core-team', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Security.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Security';
const doc = {
  name: communityName,
  label: 'SecurityApp',
  flag: 4,
  referentName: 'Jean-Marc BLANCO',
  referentMail: 'jeanmarc.blanco@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
