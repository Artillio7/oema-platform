/**
 * Energy and Environment community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-energy-environment.communities.js
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
        {label: 'Explain in one sentence your current activity, position and your expertise domains.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted in Energy & Environment domain? (years)', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time did you devote to develop your skills in Energy & Environment domain? (in % of your time)', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'What actions have you implemented during the last years or months to develop your skills? (training...)', type: 'textarea', name: 'ta-exp-skills', options: null}
      ]},
      {group: 'Activity in the Domain "Energy and Environment"', questions: [
        {label: '<strong>Within 1 page</strong>, please describe your <strong>three main contributions</strong> to the Energy and Environment domain that best illustrate your expertise in your daily life activity.\
        <strong>The objective is to get an overview of your activities & skills and knowledge, please detail your expertise and innovations you have developed and or deployed in the past years in order for the \
        jury to well understand you motivation to integrate the Programme.</strong><br>\
        (Internal projects, product launches, surveys, coordination, education, papers and communications, etc.)<br/>\
        Please specify the context (date and project, upon request or by own initiative), and your specific role. <strong>Thanks to avoid duplicating your resume.</strong>', type: 'textarea', name: 'ta-activity-energy', options: null}
      ]},
      {group: 'Your Vision about "Energy and Environment"', questions: [
        {label: 'In an ideal or perfect world, what would be your different proposals to improve your daily activities in energy efficiency improvement and environment impacts mitigation? Here the idea is to get \
        your own vision on your own activity to energy & environment.', type: 'textarea', name: 'ta-vision-energy', options: null},
        {label: 'In your real world, what would be your vision on your own activities in 5 to 7 years’ timescale? How do you see the evolution of your domain in 2025/2030 time scale?', type: 'textarea', name: 'ta-vision-energy-2025', options: null},
        {label: 'What kind of breakthrough could impact your activities in the following years? What could be the impacts (negative & positive) on your domain?', type: 'textarea', name: 'ta-vision-impact', options: null}
      ]}
    ]
  },

  /****** Expertise  ******/
  {name: 'Expertise', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Expertises Guide', questions: [
        {label: '<strong>Please select all areas that best represent your domain of expertise:</strong>', type: 'input-checkboxes', name: 'ic-networks', options: {
          items: {
            left: [
              {label: 'Electromagnetic Compatibility (EMC)', name: 'c-emc'},
              {label: 'Human exposure to Electromagnetic fields (EMF)', name: 'c-emf'},
              {label: 'Eco-design (products & services)', name: 'c-ecodesign'},
              {label: 'Assessment of the environmental impacts of ICTs', name: 'c-ict'},
              {label: 'Recycling and waste management', name: 'c-recyclewaste'},
              {label: 'Energy and Technical Environment', name: 'c-energyenv'},
              {label: 'Climatic environment', name: 'c-climatic'}
            ],
            right: [
              {label: 'Building Protection (Lighting, firing...)', name: 'c-buildingprotect'},
              {label: 'Green Marketing, sociologist', name: 'c-greenmarketing'},
              {label: 'Green smart metering', name: 'c-greenmetering'},
              {label: 'Energy (Network /DataCenter, Architecture, dimensioning...)', name: 'c-netdatacenter'},
              {label: 'Energy (Operation & maintenance, support...)', name: 'c-operation'},
              {label: 'Energy (Purchase, finance...)', name: 'c-purchase'},
              {label: 'Energy (Renewable, production...)', name: 'c-renewable'}
            ]
          },
          review: true, preview: 'Expertises guide'
        }},
        {label: '<p><span class="text-primary"><strong>For each of the above technical domain you selected, please detail with concrete examples what is the nature of your contribution.</strong></span></p>', type: 'text', name: 't-illustrate-expertise', options: null},
        {label: '<strong>Electromagnetic Compatibility (EMC):</strong>', type: 'textarea', name: 'ta-emc', options: null},
        {label: '<strong>Human exposure to Electromagnetic fields (EMF):</strong>', type: 'textarea', name: 'ta-human-exposure', options: null},
        {label: '<strong>Eco-design (products & services):</strong>', type: 'textarea', name: 'ta-eco-design', options: null},
        {label: '<strong>Assessment of the environmental impacts of ICTs:</strong>', type: 'textarea', name: 'ta-assessment-environmental-impact', options: null},
        {label: '<strong>Recycling and waste management:</strong>', type: 'textarea', name: 'ta-recycling', options: null},
        {label: '<strong>Energy and Technical Environment:</strong>', type: 'textarea', name: 'ta-energy-technical-environment', options: null},
        {label: '<strong>Climatic environment:</strong>', type: 'textarea', name: 'ta-climatic-environment', options: null},
        {label: '<strong>Building Protection (Lighting, firing...):</strong>', type: 'textarea', name: 'ta-bp', options: null},
        {label: '<strong>Green Marketing, sociologist :</strong>', type: 'textarea', name: 'ta-mark-socio', options: null},
        {label: '<strong>Green smart metering:</strong>', type: 'textarea', name: 'ta-gsm', options: null},
        {label: '<strong>Energy (Network /DataCenter, Architecture, dimensioning...):</strong>', type: 'textarea', name: 'ta-energy-1', options: null},
        {label: '<strong>Energy (Operation & maintenance, support...):</strong>', type: 'textarea', name: 'ta-energy-2', options: null},
        {label: '<strong>Energy (Purchase, finance...):</strong>', type: 'textarea', name: 'ta-energy-3', options: null},
        {label: '<strong>Energy (Renewable, production...):</strong>', type: 'textarea', name: 'ta-energy-4', options: null}
      ]},
      {group: 'Abilities (Please illustrate the following abilities with concrete examples)', questions: [
        {label: '<strong>Support Business (advise, validate, resolve):</strong>', type: 'textarea', name: 'ta-support-orange', options: null},
        {label: '<strong>Innovate and capitalise:</strong>', type: 'textarea', name: 'ta-innovate', options: null},
        {label: '<strong>Pass on experience and knowledge:</strong>', type: 'textarea', name: 'ta-exp-knowledge', options: null},
        {label: '<strong>Represent the company (example: during standardization meetings, national/international conferences, with other entities, meetings):</strong>', type: 'textarea', name: 'ta-represent-company', options: null},
      ]},
      {group: 'Behavioural Skills (Please illustrate the following skills with concrete examples)', questions: [
        {label: '<strong>Communication:</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Working in a team and across organisation:</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Innovation:</strong>', type: 'textarea', name: 'ta-innovation', options: null},
        {label: '<strong>Being strategy-oriented:</strong>', type: 'textarea', name: 'ta-strategy', options: null},
        {label: '<strong>Leadership, influencing skills:</strong>', type: 'textarea', name: 'ta-leadership', options: null},
        {label: '<strong>Your level of English</strong>', type: 'select', name: 'sl-english-level', options: {items: [
          '1 - Beginner (I do not speak any English)',
          '2 - Elementary (I can say and understand a few things in English)',
          '3 - Pre-Intermediate (I can communicate simply and understand in familiar situations but only with some difficulty)',
          '4 - Low Intermediate (I can make simple sentences and can understand the main points of a conversation but need much more vocabulary)',
          '5 - Intermediate (I can speak and understand reasonably well and can use basic tenses but have problems with more complex grammar and vocabulary)',
          '6 - Upper Intermediate (I speak and understand well but still make mistakes and fail to make myself understood occasionally)',
          '7 - Advanced (I speak and understand very well but sometimes have problems with unfamiliar situations and vocabulary)',
          '8 - Very Advanced (I speak and understand English completely fluently)'
          ],
          widthClass: 'col-12'}
        }
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What is your motivation in participating in the Energy and Environment Community? (5 to 10 lines)', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: 'If selected, could you commit to regularly contribute to the activities, towards technical production like (memo/deliverable) or make presentation during seminars or webinar of the community?', type: 'textarea', name: 'ta-contribute', options: null},
        {label: 'Could you already identify what topic you would like to handle through webinar, executive memos, ecosystem survey, tutorial, etc.?', type: 'textarea', name: 'ta-contribute-effective', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Energy-and-Environment.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
        {label: 'Explain in one sentence your current activity and position.', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}}
      ]},
      {group: 'Experience and Skills', questions: [
        {label: 'How many years of experience have you devoted in Energy & Environment domain? (years)', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'How much time did you devote to develop your skills in Energy & Environment domain? (in % of your time)', type: 'input-text', name: 'it-expert-time', options: null},
        {label: 'How many mandates (one mandate is 3 years) have you spent in the Energy & Environment Orange Expert Community?', type: 'textarea', name: 'ta-time-communnity', options: null}
      ]},
      {group: 'Activity in the Domain "Energy and Environment"', questions: [
        {label: '<strong>Within 1 page</strong>, describe your activities in the area of Energy & Environment over the last 3 years and their introduction, \
        highlighting the <strong>most prominent</strong> contributions (e.g. standardization, patents, internal projects, operational solutions, best practices sharing, \
        energy & CO2 saving lever, coordination, continuing education, papers and communications, etc.). For each <strong>major</strong> contribution, please specify the context \
        and how it was shared with Energy & Environment Community, if not produced in the context of the community.<br>\
        Please indicate if you have followed training courses in your technical fields (please describe)', type: 'textarea', name: 'ta-activity-energy', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Your Activity within the Community', questions: [
        {label: 'What were your contributions to the community during these last 3 years (participation to the monthly webinar, contribution to deliverables, participation to \
          yearly seminars? ) Please detailed your reply.', type: 'textarea', name: 'ta-contribution-community', options: null},
        {label: 'Which new issues have you been made aware of in participating in Energy & Environment activity?', type: 'textarea', name: 'ta-issues-aware', options: null},
        {label: 'How have you promoted your Energy & Environment membership outside the community (use of Energy & Environment logo, presentation as Orange Expert, etc.)? \
        Please provide evidence.', type: 'textarea', name: 'ta-promote-community', options: null}
      ]},
      {group: 'Your Feedback Regarding the Activity of the Community ', questions: [
        {label: 'What is your feeling regarding the regular activity of the Energy & Environment community? What are your proposals to improve working methods or daily life \
        activities within the community?', type: 'textarea', name: 'ta-feeling-community', options: null},
        {label: 'What is your feedback regarding your own involvement in the community during this last 3 years? (I’m happy regarding my contribution to the community activity, \
        I think I could contribute much more, I don’t have enough time to contribution but it is important for me to stay within the community...)<br>\
        What are your suggestions to improve your involvement within the community (more time dedicated to the community, get access to some new tools to facilitate exchange \
        with other Orange Expert)?', type: 'textarea', name: 'ta-feedback-community', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Energy-and-Environment.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Energy & Environment';
const doc = {
  name: communityName,
  label: 'EngEnvApp',
  flag: 64,
  referentName: 'Marc VAUTIER',
  referentMail: 'marc.vautier@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
