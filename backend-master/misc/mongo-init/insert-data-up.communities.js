/**
 * Data'Up community
 * to run the script:
 * mongo 127.0.0.1:27017/oemadb insert-data-up.communities.js
 *
 */


/********************/
/***** NEW FORM *****/
/********************/
const newForm = [

  /****** About you ******/
  {name: 'Qui suis-je ?', icon: 'fa-id-card-o', active: true, valid: false, hasError: false,
    form: [
      {group: 'About You', questions:null}
    ]
  },

  /****** Mon poste actuel ******/
  {name: 'Mon poste actuel', icon: 'fa-flask', active: false, valid: false, hasError: false,
    form: [
      {questions: [
        {label: 'Intitulé poste actuel : ', type: 'textarea', name: 'ta-current-position', options: {height: '70px'}},
        {label: 'Expliquez en 1 phrase votre activité actuelle.', type: 'textarea', name: 'ta-current-activity', options: {height: '70px'}},
        {label: 'Depuis combien de temps occupez-vous ce poste ?', type: 'input-text', name: 'it-how-long-current-position', options: null}
      ]},
    ]
  },

  /****** Ma candidature  ******/
  {name: 'Ma candidature', icon: 'fa-rocket', active: false, valid: false, hasError: false,
    form: [
      {questions: [
        {label: 'Cette candidature rentre-t-elle dans une démarche de mobilité ?', type: 'input-radio', name: 'ir-targeting-mobility', options: {
          items: [
            {label: 'Oui', name: 'r-mobility-yes'},
            {label: 'Non', name: 'r-mobility-no'}
          ],
          widthClass: 'w-100'
        }},
        {label: '<p><strong>Pour rappel, la prise de poste s\'effectue le <mark>xx/xx/xx</mark>. \
        Vous serez informé, <mark>date à compléter</mark>, ainsi que votre manager actuel, si vous êtes recruté.</strong></p>', type: 'text', name: 't-commitment', option:null},
        {label: 'Comment avez-vous eu connaissance de ce programme ?', type: 'input-checkboxes', name: 'ic-hear-about', options: {
          items: {
            left: [
              {label: 'Communauté data', name: 'c-proba'},
              {label: 'E-mail Orange Avenirs', name: 'c-mail-orange-avenir'},
              {label: 'Conseiller Orange Avenir', name: 'c-advisor-orange-avenir'},
              {label: 'Bouche à oreille', name: 'c-word-mouth'},
              {label: 'Autres', name: 'c-hear-other'}
            ],
            right: [
            ]
          }
        }},
        {label: 'Qu\'attendez-vous de ce programme ?', type: 'textarea', name: 'ta-program-expectation', options: null},
        {label: 'En 1 mot, si je vous dit "Data", vous me répondez ?', type: 'input-text', name: 'ta-one-word-data', options: null},
        {label: 'Une idée vous tenait à c&#339;ur... Racontez-nous comment vous avez réussi à la (faire) mettre en &#339;uvre (chez Orange ou même en dehors) ?',
          type: 'textarea', name: 'ta-release-idea', options: null},
        {label: 'Qu\'avez-vous envie d\'apporter au programme Data\'Up ?', type: 'textarea', name: 'ta-contribute-data-up', options: null},
        {label: 'Dans un groupe (équipe, association, entourage...), quelles qualités les autres vous reconnaissent-ils le plus souvent ?',
          type: 'textarea', name: 'ta-your-qualities', options: null},
        {label: 'Le truc en plus qui vous rend vraiment unique (un talent, une passion, un trait de caractère, une expérience...) ?',
          type: 'textarea', name: 'ta-your-passions-skills', options: null},
      ]},
    ]
  },

  /****** Mes choix ******/
  {name: 'Mes choix', icon: 'fa-child', active: false, valid: false, hasError: false,
    form: [
      {group: 'Je choisis mes postes "coup de c&#339;ur" - 3 maximum', questions: [
        {label: 'Choix #1', type: 'select', name: 'sl-jobs-selection-1', options: {items: [
            'Poste 1',
            'Poste 2',
            'Poste 3',
            'Poste 4',
            'Poste 5',
            'Poste 6',
            'Poste 7',
            'Poste 8',
            'Poste 9',
            'Poste 10'
          ],
          widthClass: 'col-12'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
        {label: 'Choix #2', type: 'select', name: 'sl-jobs-selection-2', options: {items: [
            'Poste 1',
            'Poste 2',
            'Poste 3',
            'Poste 4',
            'Poste 5',
            'Poste 6',
            'Poste 7',
            'Poste 8',
            'Poste 9',
            'Poste 10'
          ],
          widthClass: 'col-12'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
        {label: 'Choix #3', type: 'select', name: 'sl-jobs-selection-3', options: {items: [
            'Poste 1',
            'Poste 2',
            'Poste 3',
            'Poste 4',
            'Poste 5',
            'Poste 6',
            'Poste 7',
            'Poste 8',
            'Poste 9',
            'Poste 10'
          ],
          widthClass: 'col-12'} /*** or col-md-12 (valeur maximale!), col-md-2, col-md-4 etc; ***/
        },
      ]},
      {questions: [
        {label: '<p><strong>Nous vous informons que la Core team du programme se réserve la possibilité de proposer votre candidature aux managers du catalogue \
        d\'un ou des postes que vous n\'auriez pas sélectionné, afin de maximiser vos chances d\'intégrer le programme.</strong></p>',
          type: 'text', name: 't-warning-selection', option:null}
      ]},
    ]
  },

  /******  Uploads   ******/
  {name: 'Mes documents', icon: 'fa-file-pdf-o', active: false, valid: false, hasError: false,
    form: [
      {questions: [
        {label: '<p>Merci d\'envoyer les documents suivants.</p>', type: 'text', name: 't-uploads', option:null}
      ]},
      {group: 'CV', questions: [
        {label: 'Envoyer votre CV (uniquement en pdf)', type: 'input-file', name: 'file-cv', options: null}
      ]},
      {group: 'Lettre de motivation', questions: [
        {label: 'Envoyer votre lettre de motivation (only pdf)', type: 'input-file', name: 'file-manager-recommendation', options: null}
      ]},
      {group: 'Autres documents (optionnel)', questions: [
        {label: 'En option, vous pouvez aussi joindre d\'autres documents or lettres de recommendation (uniquement en pdf).', type: 'dropzone', name: 'other-documents-upload', options: null}
      ]}
    ]
  },

  {name: 'Soumission', icon: 'fa-paper-plane-o', active: false, valid: false, hasError: false, form: null}
];


/************************/
/***** RENEWAL FORM *****/
/************************/
const renewalForm = [

];


/***************/
/***** DOC *****/
/***************/
const communityName = 'Data\'Up';
const doc = {
  name: communityName,
  label: 'DataUpApp',
  flag: 131072, /* 100000000000000000 */
  referentName: 'Alix BUET',
  referentMail: 'alix.buet@orange.com',
  newForm: newForm,
  renewalForm: renewalForm
};


db = db.getSiblingDB('oemadb');

db.communities.update({label: doc.label}, {$set: doc}, {upsert: true});
