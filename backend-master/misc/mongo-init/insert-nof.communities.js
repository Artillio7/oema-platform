/**
 * Networks of the Future community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-nof.communities.js
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
        {label: 'How many years have you devoted to your domain of expertise?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'What percentage of time did you dedicate to the development of your expertise and skills over the past 3 years?', type: 'input-text', name: 'it-expert-time', options: null}
      ]},
      {group: 'Expertise', questions: [
        {label: 'How do you develop your expertise?', type: 'textarea', name: 'ta-exp-skills', options: null},
        {label: 'Please provide a concise description of what are your <strong>three</strong> main contributions or achievements that fall into the scope of future networks and \
        which best illustrate your domain of expertise. Such contributions or achievements may consist in (but are not necessarily limited to) contributions to \
        internal or collaborative projects, infrastructure deployment, testing procedures (including field trials) and publications (scientific and academic \
        papers, contributions to the standardization effort, training material, etc.). Also, be specific about the context (e.g., solicitation, mission \
        assignment or personal initiative, the corresponding period of activity (e.g., the whole duration of a project), date and project), and your specific role \
        (e.g., project manager, editor of a contribution, etc.).\
        <br/><strong>Please refrain from cutting/pasting your resume and providing a "bullet" list of activities.</strong>',
        type: 'textarea', name: 'ta-activity-nof', options: null},
        {label: 'What is your vision of future networks? (please be specific and provide argumentation)', type: 'textarea', name: 'ta-vision-nof', options: null},
        {label: 'From your standpoint, how can future networks contribute to the Group’s Engage 2025 strategy (please be specific and provide argumentation)?', type: 'textarea', name: 'ta-nof-engage-2025', options: null}
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
              {label: '5G Networks', name: 'c-5g'},
              {label: 'Home Networks', name: 'c-homenet'},
              {label: 'Mesh and Ad-Hoc Networks', name: 'c-messhadhoc'},
              {label: 'Optical Networks', name: 'c-opticalnet'},
              {label: 'Peer-to-peer Networks', name: 'c-p2pnet'},
              {label: 'Cloud and Data Center Networks', name: 'c-clouds'},
              {label: 'Network Automation', name: 'c-netauto'}
            ],
            right: [
              {label: 'Cellular and Wireless Networks', name: 'c-cellnet'},
              {label: 'IP Networks', name: 'c-ipnet'},
              {label: 'Sensor Networks', name: 'c-sensornet'},
              {label: 'Overlay (incl. VPNs and Slices) Networks', name: 'c-overlaynet'},
              {label: 'Content Delivery Networks', name: 'c-contentnet'},
              {label: 'Internet of Things', name: 'c-iot'},
              {label: 'Artificial Intelligence Applied to Networks', name: 'c-ainet'}
            ]
          },
          review:true, preview: 'Expertises guide'
        }},
        {label: 'For each of the above networking techniques you selected, please illustrate how you developed and applied your expertise.', type: 'textarea',
        name: 'ta-concrete-examples-networks', options: null}
      ]},
      {group: 'Behavioural Skills (please elaborate with concrete examples)', questions: [
        {label: '<strong>Communication (both written and oral)</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Team working and cross-entity collaboration</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Leadership (e.g., team leadership, conference chairmanship, etc.)</strong>', type: 'textarea', name: 'ta-leadership', options: null},
        {label: '<strong>Your level of English</strong>', type: 'select', name: 'sl-english-level', options: {items: [
          'Beginner (I do not speak any English)',
          'Elementary (I can say and understand a few things in English)',
          'Pre-Intermediate (I can communicate simply and understand in familiar situations but only with some difficulty)',
          'Low Intermediate (I can make simple sentences and can understand the main points of a conversation but need much more vocabulary)',
          'Intermediate (I can speak and understand reasonably well and can use basic tenses but have problems with more complex grammar and vocabulary)',
          'Upper Intermediate (I speak and understand well but still make mistakes and fail to make myself understood occasionally)',
          'Pre-Advanced (I speak and understand well but still make mistakes and fail to make myself understood occasionally)',
          'Advanced (I speak and understand very well but sometimes have problems with unfamiliar situations and vocabulary)',
          'Very Advanced (I speak and understand English completely fluently)'
          ],
          widthClass: 'col-12'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        }
      ]},
      {group: 'Others Activities (please elaborate with concrete examples)', questions: [
        {label: '<strong>Support to Orange entities (corporate or affiliates): e.g. consulting, problem resolution.</strong>', type: 'textarea', name: 'ta-support-orange', options: null},
        {label: '<strong>Represent Orange (e.g., as a standardization or international conference delegate)</strong>', type: 'textarea', name: 'ta-represent-company', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What primarily motivates you to become a member of the "Networks of the Future" Orange Expert community (5 to 10 lines)?', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: '<p>NoF Orange Experts are expected to actively contribute to the NoF activities <span class="text-primary">up to 10% of their working time \
        (hence about 20 days per year)</span>.</p>\
        <p><strong>The applicants and their managers MUST be aware that joining the NoF community means true commitment.</strong></p><br/>\
        <p>More specifically, a NoF Orange Expert is expected to:</p>\
        <p><strong class="text-primary">Take strategic actions</strong>\
        <ul><li>Conduct analyses of critical issues that may arise in the future or assess situations that may dramatically impact future networks and services \
        and how they will be designed, delivered and operated. It is up to the NoF Orange Experts to raise awareness among the relevant Group entities (e.g., Orange \
        affiliates) about the emergence of new topics, issues, technologies, etc.</li>\
        <li>Address any question that may arise from Orange entities as far as network evolution is concerned.</li>\
        <li>Assess the impact of an operational crisis so as to better anticipate and prevent such situations in the future by means of new, potentially disruptive, techniques.</li>\
        <li>Contribute to the definition and the enforcement of the Group’s networking strategy. Shape the future of networking and assess how it impacts and possibly benefits \
        to Orange’s business.</li></ul></p>\
        <p><strong class="text-primary">Share and transfer knowledge</strong>\
        <ul><li>Contribute to the organization of webinars within the community (possibly in collaboration with other Orange Expert communities) to develop \
        members’ skills and to share ideas about the emergence of new technologies that may be used by the networks of the future.</li>\
        <li>Contribute to the organization of the NoF community’s annual seminar (e.g., organize and animate technical workshop, deliver keynotes, etc.)</li>\
        <li>Contribute to the dissemination of expertise within the Group by means of publications (2-page tech briefs, technical memos, articles of the \
        quarterly newsletter, etc.), training sessions, webinars, and workshops.</li></ul></p>', type: 'text', name: 't-commitment-contribution', options: null}
      ]},
      {group: 'How NoF Orange Experts are selected?', questions: [
        {label: '<p>Yearly Orange Expert recruitment campaigns are the opportunity for candidates who are interested by NoF activities to submit their application online. \
        The call usually closes at the end of September. The NoF governance structure (or “core team”, see below) then meets several times (depending on the number of \
        applications and the progress of the reviews and discussions) between early October and mid-December to review the applications and reach a consensus about the \
        final decision for each candidate (i.e., accept or reject).</p>\
        <p><strong>Decisions are final.</strong></p>\
        <p>Each application is carefully reviewed by at least 3 members of the NoF’s core team. Once decisions are consolidated, they are transmitted to the HR representative \
        for information. Then the Referent calls every applicant from early January of the next year to inform him/her about the final decision, along with the appropriate \
        argumentation. Note that candidates who have not been selected may very well consider re-submitting their application for the next call or the one after.</p>',
        type: 'text', name: 't-community-selection', options: null}
      ]},
      {group: 'Governance Structure (a.k.a. "Core Team")', questions: [
        {label: '<p>The governance structure of the NoF community is composed of people of various backgrounds, including experts, TGI department managers, research program leaders, \
        as well as affiliate and HR representatives.</p>\
        <ul><li>Yves Bellego, INNOV/NET</li>\
        <li>Cyril Cambien, INNOV/IT-S</li>\
        <li>Brigitte Cardinaël, INNOV/RES</li>\
        <li>Bruno Chatras, INNOV/NET</li>\
        <li>Thierry Coupaye, INNOV/RES</li>\
        <li>Laurence de la Chaise, INNOV/NET</li>\
        <li>Benoît Fondeviole, WIN/OINIS</li>\
        <li>Christian Gallard, INNOV/NET</li>\
        <li>Fabrice Guillemin, INNOV/NET</li>\
        <li>Marie-Hélène Hamon, INNOV/NET</li>\
        <li>Eric Hardouin, INNOV/RES</li>\
        <li>Ibrahim Houmed, INNOV/NET</li>\
        <li>Christian Jacquenet, INNOV/NET (Referent Expert of the NoF community)</li>\
        <li>Bernard Le Floch, INNOV/RES</li>\
        <li>Damien Logeais, Orange France/DTSI/DTRS</li>\
        <li>Tomasz Osko, Orange Labs Poland</li>\
        <li>Dinh-Thuy Phan-Huy, INNOV/NET</li>\
        <li>Vladimir Renard, INNOV/NET</li>\
        <li>Nick Sampson, INNOV/NET</li>\
        <li>Laurent Vieilledent, Orange France/DTSI/DTRS</li></ul>', type: 'text', name: 't-core-team', options: null}
      ]},
      {group: 'Commitment to Contribute', questions: [
        {label: 'Please confirm you formally commit to actively contribute to the activities and the promotion of the NoF community by dedicating at least 20 working \
        days per year. Please detail the nature of your foreseen contribution to the community in no more than 10 lines.', type: 'textarea', name: 'ta-contribute', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-new-Networks-of-the-Future.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
      {group: 'Experience and Skills', questions: [
        {label: 'How many years have you devoted to your domain of expertise?', type: 'input-text', name: 'it-expert-duration', options: null},
        {label: 'What percentage of time did you dedicate to the development of your expertise and skills over the past 3 years?', type: 'input-text', name: 'it-expert-time', options: null}
      ]},
      {group: 'Expertise', questions: [
        {label: 'How do you develop your skills?', type: 'textarea', name: 'ta-exp-skills', options: null},
        {label: 'Please provide a concise description of what are your three main contributions or achievements that fall into the scope of future networks and \
        which best illustrate your domain of expertise. Such contributions or achievements may consist in (but are not necessarily limited to) contributions to \
        internal or collaborative projects, infrastructure deployment, testing procedures (including field trials) and publications (scientific and academic \
        papers, contributions to the standardization effort, training material, etc.). Also, be specific about the context (e.g., solicitation, mission \
        assignment or personal initiative, the corresponding period of activity (e.g., the whole duration of a project), date and project), and your specific role \
        (e.g., project manager, editor of a contribution, etc.).\
        <br/><strong>Please refrain from cutting/pasting your resume and providing a "bullet" list of activities.</strong>',
        type: 'textarea', name: 'ta-activity-nof', options: null},
        {label: 'What is your vision of future networks? (please be specific and provide argumentation)', type: 'textarea', name: 'ta-vision-nof', options: null},
        {label: 'From your standpoint, how can future networks contribute to the Group’s Engage 2025 strategy (please be specific and provide argumentation)?', type: 'textarea', name: 'ta-nof-engage-2025', options: null}
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
              {label: '5G Networks', name: 'c-5g'},
              {label: 'Home Networks', name: 'c-homenet'},
              {label: 'Mesh and Ad-Hoc Networks', name: 'c-messhadhoc'},
              {label: 'Optical Networks', name: 'c-opticalnet'},
              {label: 'Peer-to-Peer Networks', name: 'c-p2pnet'},
              {label: 'Cloud and Data Center Networks', name: 'c-clouds'},
              {label: 'Network Automation', name: 'c-netauto'}
            ],
            right: [
              {label: 'Cellular and Wireless Networks', name: 'c-cellnet'},
              {label: 'IP Networks', name: 'c-ipnet'},
              {label: 'Sensor Networks', name: 'c-sensornet'},
              {label: 'Overlay (incl. VPNs and Slices) Networks', name: 'c-overlaynet'},
              {label: 'Content Delivery Networks', name: 'c-contentnet'},
              {label: 'Internet of Things', name: 'c-iot'},
              {label: 'Artificial Intelligence Applied to Networks', name: 'c-ainet'}
            ]
          },
          review:true, preview: 'Expertises guide'
        }},
        {label: 'For each of the above networking techniques you selected, please illustrate how you developed and applied your expertise.', type: 'textarea',
        name: 'ta-concrete-examples-networks', options: null}
      ]},
      {group: 'Behavioural Skills (please elaborate with concrete examples)', questions: [
        {label: '<strong>Communication (both written and oral)</strong>', type: 'textarea', name: 'ta-communication', options: null},
        {label: '<strong>Team working and cross-entity collaboration</strong>', type: 'textarea', name: 'ta-team', options: null},
        {label: '<strong>Leadership (e.g., team leadership, conference chairmanship, etc.)</strong>', type: 'textarea', name: 'ta-leadership', options: null},
        {label: '<strong>Your level of English</strong>', type: 'select', name: 'sl-english-level', options: {items: [
          'Beginner (I do not speak any English)',
          'Elementary (I can say and understand a few things in English)',
          'Pre-Intermediate (I can communicate simply and understand in familiar situations but only with some difficulty)',
          'Low Intermediate (I can make simple sentences and can understand the main points of a conversation but need much more vocabulary)',
          'Intermediate (I can speak and understand reasonably well and can use basic tenses but have problems with more complex grammar and vocabulary)',
          'Upper Intermediate (I speak and understand well but still make mistakes and fail to make myself understood occasionally)',
          'Pre-Advanced (I speak and understand well but still make mistakes and fail to make myself understood occasionally)',
          'Advanced (I speak and understand very well but sometimes have problems with unfamiliar situations and vocabulary)',
          'Very Advanced (I speak and understand English completely fluently)'
          ],
          widthClass: 'col-12'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        }
      ]},
      {group: 'Others Activities (please elaborate with concrete examples)', questions: [
        {label: '<strong>Support to Orange entities (corporate or affiliates): e.g. consulting, problem resolution.</strong>', type: 'textarea', name: 'ta-support-orange', options: null},
        {label: '<strong>Represent Orange (e.g., as a standardization or international conference delegate)</strong>', type: 'textarea', name: 'ta-represent-company', options: null}
      ]}
    ]
  },

  /****** Motivation ******/
  {name: 'Motivation', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Motivation', questions: [
        {label: 'What primarily motivates you to become a member of the "Future Networks" Orange Expert community (5 to 10 lines)?', type: 'textarea', name: 'ta-motivation', options: null}
      ]},
      {group: 'Contribution within the Networks of the Future (NoF) Community', questions: [
        {label: 'Please detail the nature of your contribution to the activities of the NoF community over the past 3 years.', type: 'textarea', name: 'ta-contrib-activities', options: null},
        {label: 'How did you publicize your contributions (e.g., towards your team/entity)?', type: 'textarea', name: 'ta-contrib-delivery', options: null},
        {label: 'Please list all the NoF events (seminars, webinars, workshops) you suggested (S), organized (O) and attended (A) over the past 3 years.', type: 'textarea', name: 'ta-nof-events', options: null},
        {label: 'How did you promote your Orange Expert status outside of the community?', type: 'textarea', name: 'ta-promote-nof', options: null},
        {label: 'Did you take advantage of your Orange Expert status? If so, how?', type: 'textarea', name: 'ta-benefits-nof', options: null},
        {label: 'What did you learn from the NoF community (e.g., new topics, disruptive trends)? Was it beneficial to you and your entity? If so, why?', type: 'textarea', name: 'ta-new-knowledge', options: null},
        {label: 'How would rate your membership overall (please elaborate accordingly)?', type: 'select', name: 'sl-rate-nof-interest', options: {items: [
          'Fully addressed my expectations because...',
          'Somewhat addressed my expectations because...',
          'Poorly addressed my expectations because...'
          ],
          widthClass: 'col-md-6'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
        {label: 'Please justify your rate: ', type: 'textarea', name: 'ta-justify-rate-nof', options: null}
      ]},
      {group: 'Contribution', questions: [
        {label: '<p>NoF Orange Experts are expected to actively contribute to the NoF activities <span class="text-primary">up to 10% of their working time \
        (hence about 20 days per year)</span>.</p>\
        <p><strong>The applicants and their managers MUST be aware that joining the NoF community means true commitment.</strong></p><br/>\
        <p>More specifically, a NoF Orange Expert is expected to:</p>\
        <p><strong class="text-primary">Take strategic actions</strong>\
        <ul><li>Conduct analyses of critical issues that may arise in the future or assess situations that may dramatically impact future networks and services \
        and how they will be designed, delivered and operated. It is up to the NoF Orange Experts to raise awareness among the relevant Group entities (e.g., Orange \
        affiliates) about the emergence of new topics, issues, technologies, etc.</li>\
        <li>Address any question that may arise from Orange entities as far as network evolution is concerned.</li>\
        <li>Assess the impact of an operational crisis so as to better anticipate and prevent such situations in the future by means of new, potentially disruptive, techniques.</li>\
        <li>Contribute to the definition and the enforcement of the Group’s networking strategy. Shape the future of networking and assess how it impacts and possibly benefits \
        to Orange’s business.</li></ul></p>\
        <p><strong class="text-primary">Share and transfer knowledge</strong>\
        <ul><li>Contribute to the organization of webinars within the community (possibly in collaboration with other Orange Expert communities) to develop \
        members’ skills and to share ideas about the emergence of new technologies that may be used by the networks of the future.</li>\
        <li>Contribute to the organization of the NoF community’s annual seminar (e.g., organize and animate technical workshop, deliver keynotes, etc.)</li>\
        <li>Contribute to the dissemination of expertise within the Group by means of publications (2-page tech briefs, technical memos, articles of the \
        quarterly newsletter, etc.), training sessions, webinars, and workshops.</li></ul></p>', type: 'text', name: 't-commitment-contribution', options: null}
      ]},
      {group: 'How NoF Orange Experts are selected?', questions: [
        {label: '<p>Yearly Orange Expert recruitment campaigns are the opportunity for candidates who are interested by NoF activities to submit their application online. \
        The call usually closes at the end of September. The NoF governance structure (or “core team”, see below) then meets several times (depending on the number of \
        applications and the progress of the reviews and discussions) between early October and mid-December to review the applications and reach a consensus about the \
        final decision for each candidate (i.e., accept or reject).</p>\
        <p><strong>Decisions are final.</strong></p>\
        <p>Each application is carefully reviewed by at least 3 members of the NoF’s core team. Once decisions are consolidated, they are transmitted to the HR representative \
        for information. Then the Referent calls every applicant from early January of the next year to inform him/her about the final decision, along with the appropriate \
        argumentation. Note that candidates who have not been selected may very well consider re-submitting their application for the next call or the one after.</p>',
        type: 'text', name: 't-community-selection', options: null}
      ]},
      {group: 'Governance Structure (a.k.a. "Core Team")', questions: [
        {label: '<p>The governance structure of the NoF community is composed of people of various backgrounds, including experts, TGI department managers, research program leaders, \
        as well as affiliate and HR representatives.</p>\
        <ul><li>Yves Bellego, INNOV/NET</li>\
        <li>Cyril Cambien, INNOV/IT-S</li>\
        <li>Brigitte Cardinaël, INNOV/RES</li>\
        <li>Bruno Chatras, INNOV/NET</li>\
        <li>Thierry Coupaye, INNOV/RES</li>\
        <li>Laurence de la Chaise, INNOV/NET</li>\
        <li>Benoît Fondeviole, WIN/OINIS</li>\
        <li>Christian Gallard, INNOV/NET</li>\
        <li>Fabrice Guillemin, INNOV/NET</li>\
        <li>Marie-Hélène Hamon, INNOV/NET</li>\
        <li>Eric Hardouin, INNOV/RES</li>\
        <li>Ibrahim Houmed, INNOV/NET</li>\
        <li>Christian Jacquenet, INNOV/NET (Referent Expert of the NoF community)</li>\
        <li>Bernard Le Floch, INNOV/RES</li>\
        <li>Damien Logeais, Orange France/DTSI/DTRS</li>\
        <li>Tomasz Osko, Orange Labs Poland</li>\
        <li>Dinh-Thuy Phan-Huy, INNOV/NET</li>\
        <li>Vladimir Renard, INNOV/NET</li>\
        <li>Nick Sampson, INNOV/NET</li>\
        <li>Laurent Vieilledent, Orange France/DTSI/DTRS</li></ul>', type: 'text', name: 't-core-team', options: null}
      ]},
      {group: 'Commitment to Contribute', questions: [
        {label: 'Please confirm you formally commit to actively contribute to the activities and the promotion of the NoF community by dedicating at least 20 working \
        days per year. Please detail the nature of your foreseen contribution to the community in no more than 10 lines.', type: 'textarea', name: 'ta-contribute', options: null}
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
        {label: 'Upload your manager letter (only pdf). The Manager Approval letter can be downloaded <a href="assets/misc/MR-letters/MR-renew-Networks-of-the-Future.doc"><mark>here</mark></a>.', type: 'input-file', name: 'file-manager-recommendation', options: null}
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
const communityName = 'Networks of the Future';
const doc = {
  name: communityName,
  label: 'NofApp',
  flag: 2,
  referentName: 'Christian JACQUENET',
  referentMail: 'christian.jacquenet@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
