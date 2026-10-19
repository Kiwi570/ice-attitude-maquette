/* Données de la maquette ICE Attitude — un seul fichier, généré depuis data.py */
window.ICE = {
 "contact": {
  "tel": "06 16 129 129",
  "tel_href": "+33616129129",
  "email": "contact@ice-attitude.fr",
  "adresse": [
   "4 ter square de Versailles",
   "78160 Marly-le-Roi"
  ],
  "facebook": "https://www.facebook.com/profile.php?id=61588545560443"
 },
 "sessions": [
  {
   "titre": "Stage survie 2 jours et 1 nuit",
   "lieu": "Forêt Notre-Dame (94)",
   "debut": "2024-05-25",
   "fin": "2024-05-26",
   "detail": "15 participants maximum, 169 € par personne, 149 € dès 4 personnes"
  },
  {
   "titre": "Immersion 5 jours dans l'Aubrac",
   "lieu": "Laguiole (12)",
   "debut": "2019-01-01",
   "fin": "2019-12-31",
   "annee_seule": true,
   "detail": "Dates exactes à compléter"
  }
 ],
 "surDemande": [
  {
   "titre": "Stage survie 1 journée",
   "quand": "Date de votre choix, sous réserve de disponibilité",
   "detail": "10 à 20 personnes, 10h à 16h",
   "devis": "stage-1-jour"
  },
  {
   "titre": "Anniversaire survie",
   "quand": "Les samedis et dimanches",
   "detail": "2 heures, 10 à 15 enfants",
   "devis": "anniversaire",
   "weekend": true
  },
  {
   "titre": "Team building",
   "quand": "Date de votre choix",
   "detail": "10 à 100 participants",
   "devis": "team-building"
  }
 ],
 "devisTypes": [
  {
   "id": "team-building",
   "label": "Team building",
   "min": 10,
   "max": 100,
   "defaut": 25,
   "formats": [
    "Demi-journée (2h30)",
    "Journée complète (6h)",
    "Expérience immersive (24h)"
   ]
  },
  {
   "id": "stage-1-jour",
   "label": "Stage survie 1 journée",
   "min": 10,
   "max": 20,
   "defaut": 12,
   "formats": [
    "Journée de 10h à 16h"
   ]
  },
  {
   "id": "anniversaire",
   "label": "Anniversaire survie",
   "min": 10,
   "max": 15,
   "defaut": 10,
   "formats": [
    "2 heures, samedi ou dimanche"
   ]
  },
  {
   "id": "evg",
   "label": "EVG ou EVJF",
   "min": 10,
   "max": 30,
   "defaut": 10,
   "formats": [
    "Demi-journée",
    "Journée"
   ]
  },
  {
   "id": "stage-2-jours",
   "label": "Stage 2 jours et 1 nuit",
   "min": 1,
   "max": 15,
   "defaut": 4,
   "formats": [
    "2 jours et 1 nuit"
   ]
  },
  {
   "id": "aubrac",
   "label": "Immersion 5 jours Aubrac",
   "min": 1,
   "max": 20,
   "defaut": 4,
   "formats": [
    "5 jours et 4 nuits"
   ]
  }
 ],
 "objectifs": [
  "Motiver vos collaborateurs",
  "Développer l'esprit d'équipe",
  "Gérer des tensions",
  "Fêter de bons résultats"
 ],
 "ateliers": [
  {
   "id": "orientation",
   "titre": "L'orientation",
   "heure": "10:00"
  },
  {
   "id": "abri",
   "titre": "L'abri",
   "heure": "11:00"
  },
  {
   "id": "eau",
   "titre": "Le filtrage de l'eau",
   "heure": "12:00"
  },
  {
   "id": "brancard",
   "titre": "Le brancard",
   "heure": "13:30"
  },
  {
   "id": "insectes",
   "titre": "La dégustation",
   "heure": "14:30"
  },
  {
   "id": "feu",
   "titre": "L'épreuve ultime : le feu",
   "heure": "15:30"
  }
 ],
 "equipe": [
  {
   "nom": "Didier",
   "role": "Formateur survie"
  },
  {
   "nom": "David",
   "role": "Formateur survie et risques NRBCe"
  },
  {
   "nom": "Laurence",
   "role": "Formatrice survie, botaniste en herbe"
  },
  {
   "nom": "Christophe",
   "role": "Officier de réserve"
  },
  {
   "nom": "Maylis",
   "role": "Formatrice survie"
  },
  {
   "nom": "Théo",
   "role": "Formateur survie"
  },
  {
   "nom": "David",
   "role": "Gendarme de réserve, arts martiaux"
  },
  {
   "nom": "Charlotte",
   "role": "Sonothérapie"
  },
  {
   "nom": "Mickaël",
   "role": "Qi Gong et Taï Chi"
  }
 ],
 "tarifs": {
  "stage1jour": {
   "base": 750,
   "inclus": 10,
   "supp": 75,
   "max": 20
  },
  "anniversaire": {
   "base": 390,
   "inclus": 10
  },
  "evg": {
   "parPers": 55,
   "base": 10
  },
  "stage2jours": {
   "parPers": 169,
   "parPersGroupe": 149,
   "seuil": 4
  },
  "aubrac": {
   "parPers": 480
  }
 }
};
