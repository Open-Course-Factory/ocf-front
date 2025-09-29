/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

/**
 * Country mapping service for billing addresses
 * Maps full country names to ISO 2-character codes
 */

interface Country {
  code: string
  name: string
  nameFr: string
}

export const countries: Country[] = [
  { code: 'AD', name: 'Andorra', nameFr: 'Andorre' },
  { code: 'AE', name: 'United Arab Emirates', nameFr: 'Émirats Arabes Unis' },
  { code: 'AF', name: 'Afghanistan', nameFr: 'Afghanistan' },
  { code: 'AG', name: 'Antigua and Barbuda', nameFr: 'Antigua-et-Barbuda' },
  { code: 'AI', name: 'Anguilla', nameFr: 'Anguilla' },
  { code: 'AL', name: 'Albania', nameFr: 'Albanie' },
  { code: 'AM', name: 'Armenia', nameFr: 'Arménie' },
  { code: 'AO', name: 'Angola', nameFr: 'Angola' },
  { code: 'AQ', name: 'Antarctica', nameFr: 'Antarctique' },
  { code: 'AR', name: 'Argentina', nameFr: 'Argentine' },
  { code: 'AS', name: 'American Samoa', nameFr: 'Samoa Américaines' },
  { code: 'AT', name: 'Austria', nameFr: 'Autriche' },
  { code: 'AU', name: 'Australia', nameFr: 'Australie' },
  { code: 'AW', name: 'Aruba', nameFr: 'Aruba' },
  { code: 'AX', name: 'Åland Islands', nameFr: 'Îles Åland' },
  { code: 'AZ', name: 'Azerbaijan', nameFr: 'Azerbaïdjan' },
  { code: 'BA', name: 'Bosnia and Herzegovina', nameFr: 'Bosnie-Herzégovine' },
  { code: 'BB', name: 'Barbados', nameFr: 'Barbade' },
  { code: 'BD', name: 'Bangladesh', nameFr: 'Bangladesh' },
  { code: 'BE', name: 'Belgium', nameFr: 'Belgique' },
  { code: 'BF', name: 'Burkina Faso', nameFr: 'Burkina Faso' },
  { code: 'BG', name: 'Bulgaria', nameFr: 'Bulgarie' },
  { code: 'BH', name: 'Bahrain', nameFr: 'Bahreïn' },
  { code: 'BI', name: 'Burundi', nameFr: 'Burundi' },
  { code: 'BJ', name: 'Benin', nameFr: 'Bénin' },
  { code: 'BL', name: 'Saint Barthélemy', nameFr: 'Saint-Barthélemy' },
  { code: 'BM', name: 'Bermuda', nameFr: 'Bermudes' },
  { code: 'BN', name: 'Brunei Darussalam', nameFr: 'Brunei' },
  { code: 'BO', name: 'Bolivia', nameFr: 'Bolivie' },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius and Saba', nameFr: 'Bonaire, Saint-Eustache et Saba' },
  { code: 'BR', name: 'Brazil', nameFr: 'Brésil' },
  { code: 'BS', name: 'Bahamas', nameFr: 'Bahamas' },
  { code: 'BT', name: 'Bhutan', nameFr: 'Bhoutan' },
  { code: 'BV', name: 'Bouvet Island', nameFr: 'Île Bouvet' },
  { code: 'BW', name: 'Botswana', nameFr: 'Botswana' },
  { code: 'BY', name: 'Belarus', nameFr: 'Biélorussie' },
  { code: 'BZ', name: 'Belize', nameFr: 'Belize' },
  { code: 'CA', name: 'Canada', nameFr: 'Canada' },
  { code: 'CC', name: 'Cocos (Keeling) Islands', nameFr: 'Îles Cocos' },
  { code: 'CD', name: 'Congo, Democratic Republic of the', nameFr: 'République Démocratique du Congo' },
  { code: 'CF', name: 'Central African Republic', nameFr: 'République Centrafricaine' },
  { code: 'CG', name: 'Congo', nameFr: 'Congo' },
  { code: 'CH', name: 'Switzerland', nameFr: 'Suisse' },
  { code: 'CI', name: 'Côte d\'Ivoire', nameFr: 'Côte d\'Ivoire' },
  { code: 'CK', name: 'Cook Islands', nameFr: 'Îles Cook' },
  { code: 'CL', name: 'Chile', nameFr: 'Chili' },
  { code: 'CM', name: 'Cameroon', nameFr: 'Cameroun' },
  { code: 'CN', name: 'China', nameFr: 'Chine' },
  { code: 'CO', name: 'Colombia', nameFr: 'Colombie' },
  { code: 'CR', name: 'Costa Rica', nameFr: 'Costa Rica' },
  { code: 'CU', name: 'Cuba', nameFr: 'Cuba' },
  { code: 'CV', name: 'Cape Verde', nameFr: 'Cap-Vert' },
  { code: 'CW', name: 'Curaçao', nameFr: 'Curaçao' },
  { code: 'CX', name: 'Christmas Island', nameFr: 'Île Christmas' },
  { code: 'CY', name: 'Cyprus', nameFr: 'Chypre' },
  { code: 'CZ', name: 'Czech Republic', nameFr: 'République Tchèque' },
  { code: 'DE', name: 'Germany', nameFr: 'Allemagne' },
  { code: 'DJ', name: 'Djibouti', nameFr: 'Djibouti' },
  { code: 'DK', name: 'Denmark', nameFr: 'Danemark' },
  { code: 'DM', name: 'Dominica', nameFr: 'Dominique' },
  { code: 'DO', name: 'Dominican Republic', nameFr: 'République Dominicaine' },
  { code: 'DZ', name: 'Algeria', nameFr: 'Algérie' },
  { code: 'EC', name: 'Ecuador', nameFr: 'Équateur' },
  { code: 'EE', name: 'Estonia', nameFr: 'Estonie' },
  { code: 'EG', name: 'Egypt', nameFr: 'Égypte' },
  { code: 'EH', name: 'Western Sahara', nameFr: 'Sahara Occidental' },
  { code: 'ER', name: 'Eritrea', nameFr: 'Érythrée' },
  { code: 'ES', name: 'Spain', nameFr: 'Espagne' },
  { code: 'ET', name: 'Ethiopia', nameFr: 'Éthiopie' },
  { code: 'FI', name: 'Finland', nameFr: 'Finlande' },
  { code: 'FJ', name: 'Fiji', nameFr: 'Fidji' },
  { code: 'FK', name: 'Falkland Islands (Malvinas)', nameFr: 'Îles Malouines' },
  { code: 'FM', name: 'Micronesia', nameFr: 'Micronésie' },
  { code: 'FO', name: 'Faroe Islands', nameFr: 'Îles Féroé' },
  { code: 'FR', name: 'France', nameFr: 'France' },
  { code: 'GA', name: 'Gabon', nameFr: 'Gabon' },
  { code: 'GB', name: 'United Kingdom', nameFr: 'Royaume-Uni' },
  { code: 'GD', name: 'Grenada', nameFr: 'Grenade' },
  { code: 'GE', name: 'Georgia', nameFr: 'Géorgie' },
  { code: 'GF', name: 'French Guiana', nameFr: 'Guyane Française' },
  { code: 'GG', name: 'Guernsey', nameFr: 'Guernesey' },
  { code: 'GH', name: 'Ghana', nameFr: 'Ghana' },
  { code: 'GI', name: 'Gibraltar', nameFr: 'Gibraltar' },
  { code: 'GL', name: 'Greenland', nameFr: 'Groenland' },
  { code: 'GM', name: 'Gambia', nameFr: 'Gambie' },
  { code: 'GN', name: 'Guinea', nameFr: 'Guinée' },
  { code: 'GP', name: 'Guadeloupe', nameFr: 'Guadeloupe' },
  { code: 'GQ', name: 'Equatorial Guinea', nameFr: 'Guinée Équatoriale' },
  { code: 'GR', name: 'Greece', nameFr: 'Grèce' },
  { code: 'GS', name: 'South Georgia and the South Sandwich Islands', nameFr: 'Géorgie du Sud-et-les Îles Sandwich du Sud' },
  { code: 'GT', name: 'Guatemala', nameFr: 'Guatemala' },
  { code: 'GU', name: 'Guam', nameFr: 'Guam' },
  { code: 'GW', name: 'Guinea-Bissau', nameFr: 'Guinée-Bissau' },
  { code: 'GY', name: 'Guyana', nameFr: 'Guyane' },
  { code: 'HK', name: 'Hong Kong', nameFr: 'Hong Kong' },
  { code: 'HM', name: 'Heard Island and McDonald Islands', nameFr: 'Îles Heard-et-MacDonald' },
  { code: 'HN', name: 'Honduras', nameFr: 'Honduras' },
  { code: 'HR', name: 'Croatia', nameFr: 'Croatie' },
  { code: 'HT', name: 'Haiti', nameFr: 'Haïti' },
  { code: 'HU', name: 'Hungary', nameFr: 'Hongrie' },
  { code: 'ID', name: 'Indonesia', nameFr: 'Indonésie' },
  { code: 'IE', name: 'Ireland', nameFr: 'Irlande' },
  { code: 'IL', name: 'Israel', nameFr: 'Israël' },
  { code: 'IM', name: 'Isle of Man', nameFr: 'Île de Man' },
  { code: 'IN', name: 'India', nameFr: 'Inde' },
  { code: 'IO', name: 'British Indian Ocean Territory', nameFr: 'Territoire Britannique de l\'Océan Indien' },
  { code: 'IQ', name: 'Iraq', nameFr: 'Irak' },
  { code: 'IR', name: 'Iran', nameFr: 'Iran' },
  { code: 'IS', name: 'Iceland', nameFr: 'Islande' },
  { code: 'IT', name: 'Italy', nameFr: 'Italie' },
  { code: 'JE', name: 'Jersey', nameFr: 'Jersey' },
  { code: 'JM', name: 'Jamaica', nameFr: 'Jamaïque' },
  { code: 'JO', name: 'Jordan', nameFr: 'Jordanie' },
  { code: 'JP', name: 'Japan', nameFr: 'Japon' },
  { code: 'KE', name: 'Kenya', nameFr: 'Kenya' },
  { code: 'KG', name: 'Kyrgyzstan', nameFr: 'Kirghizistan' },
  { code: 'KH', name: 'Cambodia', nameFr: 'Cambodge' },
  { code: 'KI', name: 'Kiribati', nameFr: 'Kiribati' },
  { code: 'KM', name: 'Comoros', nameFr: 'Comores' },
  { code: 'KN', name: 'Saint Kitts and Nevis', nameFr: 'Saint-Christophe-et-Niévès' },
  { code: 'KP', name: 'Korea, Democratic People\'s Republic of', nameFr: 'Corée du Nord' },
  { code: 'KR', name: 'Korea, Republic of', nameFr: 'Corée du Sud' },
  { code: 'KW', name: 'Kuwait', nameFr: 'Koweït' },
  { code: 'KY', name: 'Cayman Islands', nameFr: 'Îles Caïmans' },
  { code: 'KZ', name: 'Kazakhstan', nameFr: 'Kazakhstan' },
  { code: 'LA', name: 'Lao People\'s Democratic Republic', nameFr: 'Laos' },
  { code: 'LB', name: 'Lebanon', nameFr: 'Liban' },
  { code: 'LC', name: 'Saint Lucia', nameFr: 'Sainte-Lucie' },
  { code: 'LI', name: 'Liechtenstein', nameFr: 'Liechtenstein' },
  { code: 'LK', name: 'Sri Lanka', nameFr: 'Sri Lanka' },
  { code: 'LR', name: 'Liberia', nameFr: 'Libéria' },
  { code: 'LS', name: 'Lesotho', nameFr: 'Lesotho' },
  { code: 'LT', name: 'Lithuania', nameFr: 'Lituanie' },
  { code: 'LU', name: 'Luxembourg', nameFr: 'Luxembourg' },
  { code: 'LV', name: 'Latvia', nameFr: 'Lettonie' },
  { code: 'LY', name: 'Libya', nameFr: 'Libye' },
  { code: 'MA', name: 'Morocco', nameFr: 'Maroc' },
  { code: 'MC', name: 'Monaco', nameFr: 'Monaco' },
  { code: 'MD', name: 'Moldova', nameFr: 'Moldavie' },
  { code: 'ME', name: 'Montenegro', nameFr: 'Monténégro' },
  { code: 'MF', name: 'Saint Martin (French part)', nameFr: 'Saint-Martin (partie française)' },
  { code: 'MG', name: 'Madagascar', nameFr: 'Madagascar' },
  { code: 'MH', name: 'Marshall Islands', nameFr: 'Îles Marshall' },
  { code: 'MK', name: 'Macedonia', nameFr: 'Macédoine du Nord' },
  { code: 'ML', name: 'Mali', nameFr: 'Mali' },
  { code: 'MM', name: 'Myanmar', nameFr: 'Myanmar' },
  { code: 'MN', name: 'Mongolia', nameFr: 'Mongolie' },
  { code: 'MO', name: 'Macao', nameFr: 'Macao' },
  { code: 'MP', name: 'Northern Mariana Islands', nameFr: 'Îles Mariannes du Nord' },
  { code: 'MQ', name: 'Martinique', nameFr: 'Martinique' },
  { code: 'MR', name: 'Mauritania', nameFr: 'Mauritanie' },
  { code: 'MS', name: 'Montserrat', nameFr: 'Montserrat' },
  { code: 'MT', name: 'Malta', nameFr: 'Malte' },
  { code: 'MU', name: 'Mauritius', nameFr: 'Maurice' },
  { code: 'MV', name: 'Maldives', nameFr: 'Maldives' },
  { code: 'MW', name: 'Malawi', nameFr: 'Malawi' },
  { code: 'MX', name: 'Mexico', nameFr: 'Mexique' },
  { code: 'MY', name: 'Malaysia', nameFr: 'Malaisie' },
  { code: 'MZ', name: 'Mozambique', nameFr: 'Mozambique' },
  { code: 'NA', name: 'Namibia', nameFr: 'Namibie' },
  { code: 'NC', name: 'New Caledonia', nameFr: 'Nouvelle-Calédonie' },
  { code: 'NE', name: 'Niger', nameFr: 'Niger' },
  { code: 'NF', name: 'Norfolk Island', nameFr: 'Île Norfolk' },
  { code: 'NG', name: 'Nigeria', nameFr: 'Nigéria' },
  { code: 'NI', name: 'Nicaragua', nameFr: 'Nicaragua' },
  { code: 'NL', name: 'Netherlands', nameFr: 'Pays-Bas' },
  { code: 'NO', name: 'Norway', nameFr: 'Norvège' },
  { code: 'NP', name: 'Nepal', nameFr: 'Népal' },
  { code: 'NR', name: 'Nauru', nameFr: 'Nauru' },
  { code: 'NU', name: 'Niue', nameFr: 'Niue' },
  { code: 'NZ', name: 'New Zealand', nameFr: 'Nouvelle-Zélande' },
  { code: 'OM', name: 'Oman', nameFr: 'Oman' },
  { code: 'PA', name: 'Panama', nameFr: 'Panama' },
  { code: 'PE', name: 'Peru', nameFr: 'Pérou' },
  { code: 'PF', name: 'French Polynesia', nameFr: 'Polynésie Française' },
  { code: 'PG', name: 'Papua New Guinea', nameFr: 'Papouasie-Nouvelle-Guinée' },
  { code: 'PH', name: 'Philippines', nameFr: 'Philippines' },
  { code: 'PK', name: 'Pakistan', nameFr: 'Pakistan' },
  { code: 'PL', name: 'Poland', nameFr: 'Pologne' },
  { code: 'PM', name: 'Saint Pierre and Miquelon', nameFr: 'Saint-Pierre-et-Miquelon' },
  { code: 'PN', name: 'Pitcairn', nameFr: 'Îles Pitcairn' },
  { code: 'PR', name: 'Puerto Rico', nameFr: 'Porto Rico' },
  { code: 'PS', name: 'Palestine', nameFr: 'Palestine' },
  { code: 'PT', name: 'Portugal', nameFr: 'Portugal' },
  { code: 'PW', name: 'Palau', nameFr: 'Palaos' },
  { code: 'PY', name: 'Paraguay', nameFr: 'Paraguay' },
  { code: 'QA', name: 'Qatar', nameFr: 'Qatar' },
  { code: 'RE', name: 'Réunion', nameFr: 'La Réunion' },
  { code: 'RO', name: 'Romania', nameFr: 'Roumanie' },
  { code: 'RS', name: 'Serbia', nameFr: 'Serbie' },
  { code: 'RU', name: 'Russian Federation', nameFr: 'Russie' },
  { code: 'RW', name: 'Rwanda', nameFr: 'Rwanda' },
  { code: 'SA', name: 'Saudi Arabia', nameFr: 'Arabie Saoudite' },
  { code: 'SB', name: 'Solomon Islands', nameFr: 'Îles Salomon' },
  { code: 'SC', name: 'Seychelles', nameFr: 'Seychelles' },
  { code: 'SD', name: 'Sudan', nameFr: 'Soudan' },
  { code: 'SE', name: 'Sweden', nameFr: 'Suède' },
  { code: 'SG', name: 'Singapore', nameFr: 'Singapour' },
  { code: 'SH', name: 'Saint Helena', nameFr: 'Sainte-Hélène' },
  { code: 'SI', name: 'Slovenia', nameFr: 'Slovénie' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', nameFr: 'Svalbard et Jan Mayen' },
  { code: 'SK', name: 'Slovakia', nameFr: 'Slovaquie' },
  { code: 'SL', name: 'Sierra Leone', nameFr: 'Sierra Leone' },
  { code: 'SM', name: 'San Marino', nameFr: 'Saint-Marin' },
  { code: 'SN', name: 'Senegal', nameFr: 'Sénégal' },
  { code: 'SO', name: 'Somalia', nameFr: 'Somalie' },
  { code: 'SR', name: 'Suriname', nameFr: 'Suriname' },
  { code: 'SS', name: 'South Sudan', nameFr: 'Soudan du Sud' },
  { code: 'ST', name: 'Sao Tome and Principe', nameFr: 'São Tomé-et-Principe' },
  { code: 'SV', name: 'El Salvador', nameFr: 'El Salvador' },
  { code: 'SX', name: 'Sint Maarten (Dutch part)', nameFr: 'Saint-Martin (partie néerlandaise)' },
  { code: 'SY', name: 'Syrian Arab Republic', nameFr: 'Syrie' },
  { code: 'SZ', name: 'Swaziland', nameFr: 'Eswatini' },
  { code: 'TC', name: 'Turks and Caicos Islands', nameFr: 'Îles Turques-et-Caïques' },
  { code: 'TD', name: 'Chad', nameFr: 'Tchad' },
  { code: 'TF', name: 'French Southern Territories', nameFr: 'Terres Australes Françaises' },
  { code: 'TG', name: 'Togo', nameFr: 'Togo' },
  { code: 'TH', name: 'Thailand', nameFr: 'Thaïlande' },
  { code: 'TJ', name: 'Tajikistan', nameFr: 'Tadjikistan' },
  { code: 'TK', name: 'Tokelau', nameFr: 'Tokelau' },
  { code: 'TL', name: 'Timor-Leste', nameFr: 'Timor Oriental' },
  { code: 'TM', name: 'Turkmenistan', nameFr: 'Turkménistan' },
  { code: 'TN', name: 'Tunisia', nameFr: 'Tunisie' },
  { code: 'TO', name: 'Tonga', nameFr: 'Tonga' },
  { code: 'TR', name: 'Turkey', nameFr: 'Turquie' },
  { code: 'TT', name: 'Trinidad and Tobago', nameFr: 'Trinité-et-Tobago' },
  { code: 'TV', name: 'Tuvalu', nameFr: 'Tuvalu' },
  { code: 'TW', name: 'Taiwan', nameFr: 'Taïwan' },
  { code: 'TZ', name: 'Tanzania', nameFr: 'Tanzanie' },
  { code: 'UA', name: 'Ukraine', nameFr: 'Ukraine' },
  { code: 'UG', name: 'Uganda', nameFr: 'Ouganda' },
  { code: 'UM', name: 'United States Minor Outlying Islands', nameFr: 'Îles Mineures Éloignées des États-Unis' },
  { code: 'US', name: 'United States', nameFr: 'États-Unis' },
  { code: 'UY', name: 'Uruguay', nameFr: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan', nameFr: 'Ouzbékistan' },
  { code: 'VA', name: 'Vatican City State', nameFr: 'Vatican' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', nameFr: 'Saint-Vincent-et-les Grenadines' },
  { code: 'VE', name: 'Venezuela', nameFr: 'Venezuela' },
  { code: 'VG', name: 'Virgin Islands, British', nameFr: 'Îles Vierges Britanniques' },
  { code: 'VI', name: 'Virgin Islands, U.S.', nameFr: 'Îles Vierges Américaines' },
  { code: 'VN', name: 'Viet Nam', nameFr: 'Viêt Nam' },
  { code: 'VU', name: 'Vanuatu', nameFr: 'Vanuatu' },
  { code: 'WF', name: 'Wallis and Futuna', nameFr: 'Wallis-et-Futuna' },
  { code: 'WS', name: 'Samoa', nameFr: 'Samoa' },
  { code: 'YE', name: 'Yemen', nameFr: 'Yémen' },
  { code: 'YT', name: 'Mayotte', nameFr: 'Mayotte' },
  { code: 'ZA', name: 'South Africa', nameFr: 'Afrique du Sud' },
  { code: 'ZM', name: 'Zambia', nameFr: 'Zambie' },
  { code: 'ZW', name: 'Zimbabwe', nameFr: 'Zimbabwe' }
]

/**
 * Get countries formatted for select dropdown
 * @param locale - Language locale ('en' or 'fr')
 * @returns Array of {text: string, value: string} objects
 */
export function getCountryOptions(locale: string = 'en') {
  return countries.map(country => ({
    text: locale === 'fr' ? country.nameFr : country.name,
    value: country.code
  })).sort((a, b) => a.text.localeCompare(b.text))
}

/**
 * Get country name from ISO code
 * @param code - ISO 2-character country code
 * @param locale - Language locale ('en' or 'fr')
 * @returns Country name or code if not found
 */
export function getCountryName(code: string, locale: string = 'en'): string {
  const country = countries.find(c => c.code === code)
  if (!country) return code

  return locale === 'fr' ? country.nameFr : country.name
}

/**
 * Get ISO code from country name
 * @param name - Country name (in any supported language)
 * @returns ISO code or original name if not found
 */
export function getCountryCode(name: string): string {
  const country = countries.find(c =>
    c.name.toLowerCase() === name.toLowerCase() ||
    c.nameFr.toLowerCase() === name.toLowerCase()
  )

  return country ? country.code : name
}