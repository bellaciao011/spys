(function (global) {
    'use strict';

    var COUNTRY_NAMES = {
        US: 'United States', BR: 'Brazil', GB: 'United Kingdom', CA: 'Canada',
        AU: 'Australia', DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy',
        PT: 'Portugal', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia', CL: 'Chile',
        IN: 'India', JP: 'Japan', KR: 'South Korea', PH: 'Philippines', NG: 'Nigeria',
        ZA: 'South Africa', AE: 'United Arab Emirates', NL: 'Netherlands', BE: 'Belgium',
        CH: 'Switzerland', AT: 'Austria', PL: 'Poland', SE: 'Sweden', NO: 'Norway',
        IE: 'Ireland', NZ: 'New Zealand', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia'
    };

    var US_AREA = {
        '201': 'New Jersey', '202': 'Washington DC', '203': 'Connecticut', '205': 'Alabama',
        '206': 'Washington', '212': 'New York', '213': 'California', '214': 'Texas',
        '215': 'Pennsylvania', '216': 'Ohio', '301': 'Maryland', '303': 'Colorado',
        '305': 'Florida', '310': 'California', '312': 'Illinois', '313': 'Michigan',
        '314': 'Missouri', '315': 'New York', '316': 'Kansas', '317': 'Indiana',
        '318': 'Louisiana', '319': 'Iowa', '320': 'Minnesota', '321': 'Florida',
        '323': 'California', '325': 'Texas', '330': 'Ohio', '331': 'Illinois',
        '334': 'Alabama', '336': 'North Carolina', '337': 'Louisiana', '339': 'Massachusetts',
        '347': 'New York', '351': 'Massachusetts', '352': 'Florida', '360': 'Washington',
        '361': 'Texas', '386': 'Florida', '401': 'Rhode Island', '402': 'Nebraska',
        '404': 'Georgia', '405': 'Oklahoma', '406': 'Montana', '407': 'Florida',
        '408': 'California', '409': 'Texas', '410': 'Maryland', '412': 'Pennsylvania',
        '413': 'Massachusetts', '414': 'Wisconsin', '415': 'California', '416': 'Ontario',
        '417': 'Missouri', '419': 'Ohio', '423': 'Tennessee', '424': 'California',
        '425': 'Washington', '430': 'Texas', '432': 'Texas', '434': 'Virginia',
        '435': 'Utah', '440': 'Ohio', '442': 'California', '443': 'Maryland',
        '469': 'Texas', '470': 'Georgia', '475': 'Connecticut', '478': 'Georgia',
        '479': 'Arkansas', '480': 'Arizona', '484': 'Pennsylvania', '501': 'Arkansas',
        '502': 'Kentucky', '503': 'Oregon', '504': 'Louisiana', '505': 'New Mexico',
        '507': 'Minnesota', '508': 'Massachusetts', '509': 'Washington', '510': 'California',
        '512': 'Texas', '513': 'Ohio', '515': 'Iowa', '516': 'New York',
        '517': 'Michigan', '518': 'New York', '520': 'Arizona', '530': 'California',
        '540': 'Virginia', '541': 'Oregon', '551': 'New Jersey', '559': 'California',
        '561': 'Florida', '562': 'California', '563': 'Iowa', '567': 'Ohio',
        '570': 'Pennsylvania', '571': 'Virginia', '573': 'Missouri', '574': 'Indiana',
        '575': 'New Mexico', '580': 'Oklahoma', '585': 'New York', '586': 'Michigan',
        '601': 'Mississippi', '602': 'Arizona', '603': 'New Hampshire', '605': 'South Dakota',
        '606': 'Kentucky', '607': 'New York', '608': 'Wisconsin', '609': 'New Jersey',
        '610': 'Pennsylvania', '612': 'Minnesota', '614': 'Ohio', '615': 'Tennessee',
        '616': 'Michigan', '617': 'Massachusetts', '618': 'Illinois', '619': 'California',
        '620': 'Kansas', '623': 'Arizona', '626': 'California', '628': 'California',
        '629': 'Tennessee', '630': 'Illinois', '631': 'New York', '636': 'Missouri',
        '641': 'Iowa', '646': 'New York', '650': 'California', '651': 'Minnesota',
        '657': 'California', '660': 'Missouri', '661': 'California', '662': 'Mississippi',
        '667': 'Maryland', '669': 'California', '678': 'Georgia', '681': 'West Virginia',
        '682': 'Texas', '701': 'North Dakota', '702': 'Nevada', '703': 'Virginia',
        '704': 'North Carolina', '706': 'Georgia', '707': 'California', '708': 'Illinois',
        '712': 'Iowa', '713': 'Texas', '714': 'California', '715': 'Wisconsin',
        '716': 'New York', '717': 'Pennsylvania', '718': 'New York', '719': 'Colorado',
        '720': 'Colorado', '724': 'Pennsylvania', '725': 'Nevada', '727': 'Florida',
        '731': 'Tennessee', '732': 'New Jersey', '734': 'Michigan', '737': 'Texas',
        '740': 'Ohio', '747': 'California', '754': 'Florida', '757': 'Virginia',
        '760': 'California', '762': 'Georgia', '763': 'Minnesota', '765': 'Indiana',
        '769': 'Mississippi', '770': 'Georgia', '772': 'Florida', '773': 'Illinois',
        '774': 'Massachusetts', '775': 'Nevada', '779': 'Illinois', '781': 'Massachusetts',
        '785': 'Kansas', '786': 'Florida', '801': 'Utah', '802': 'Vermont',
        '803': 'South Carolina', '804': 'Virginia', '805': 'California', '806': 'Texas',
        '808': 'Hawaii', '810': 'Michigan', '812': 'Indiana', '813': 'Florida',
        '814': 'Pennsylvania', '815': 'Illinois', '816': 'Missouri', '817': 'Texas',
        '818': 'California', '828': 'North Carolina', '830': 'Texas', '831': 'California',
        '832': 'Texas', '843': 'South Carolina', '845': 'New York', '847': 'Illinois',
        '848': 'New Jersey', '850': 'Florida', '856': 'New Jersey', '857': 'Massachusetts',
        '858': 'California', '859': 'Kentucky', '860': 'Connecticut', '862': 'New Jersey',
        '863': 'Florida', '864': 'South Carolina', '865': 'Tennessee', '870': 'Arkansas',
        '872': 'Illinois', '878': 'Pennsylvania', '901': 'Tennessee', '903': 'Texas',
        '904': 'Florida', '905': 'Ontario', '906': 'Michigan', '907': 'Alaska',
        '908': 'New Jersey', '909': 'California', '910': 'North Carolina', '912': 'Georgia',
        '913': 'Kansas', '914': 'New York', '915': 'Texas', '916': 'California',
        '917': 'New York', '918': 'Oklahoma', '919': 'North Carolina', '920': 'Wisconsin',
        '925': 'California', '928': 'Arizona', '929': 'New York', '931': 'Tennessee',
        '936': 'Texas', '937': 'Ohio', '938': 'Alabama', '940': 'Texas', '941': 'Florida',
        '947': 'Michigan', '949': 'California', '951': 'California', '952': 'Minnesota',
        '954': 'Florida', '956': 'Texas', '959': 'Connecticut', '970': 'Colorado',
        '971': 'Oregon', '972': 'Texas', '973': 'New Jersey', '978': 'Massachusetts',
        '979': 'Texas', '980': 'North Carolina', '984': 'North Carolina', '985': 'Louisiana',
        '989': 'Michigan'
    };

    var BR_DDD = window.DDD_MAP || {};

    function digitsOnly(v) {
        return (v || '').replace(/\D/g, '');
    }

    function getCountryName(iso2) {
        return COUNTRY_NAMES[iso2] || iso2 || 'Unknown region';
    }

    function getRegionFromPhone(countryCode, nationalNumber, dialCode) {
        var iso = (countryCode || 'US').toUpperCase();
        var national = digitsOnly(nationalNumber);
        var country = getCountryName(iso);

        if (iso === 'US' || iso === 'CA') {
            var area = national.substring(0, 3);
            var state = US_AREA[area];
            return {
                country: country,
                countryCode: iso,
                dialCode: dialCode || '1',
                region: state || 'North America',
                city: state ? state + ' area' : 'Region identified',
                areaCode: area
            };
        }

        if (iso === 'BR' && national.length >= 10) {
            var ddd = national.substring(0, 2);
            var brInfo = BR_DDD[ddd];
            if (brInfo) {
                return {
                    country: 'Brazil',
                    countryCode: 'BR',
                    dialCode: dialCode || '55',
                    region: brInfo.state,
                    city: brInfo.city,
                    areaCode: ddd
                };
            }
        }

        if (iso === 'GB' && national.length >= 10) {
            return {
                country: 'United Kingdom',
                countryCode: 'GB',
                dialCode: dialCode || '44',
                region: 'United Kingdom',
                city: 'Region identified',
                areaCode: national.substring(0, 4)
            };
        }

        return {
            country: country,
            countryCode: iso,
            dialCode: dialCode || '',
            region: country,
            city: 'Region identified',
            areaCode: national.substring(0, 3)
        };
    }

    function formatDisplayNumber(dialCode, nationalNumber, countryCode) {
        var national = digitsOnly(nationalNumber);
        var dc = dialCode ? '+' + digitsOnly(dialCode) : '';
        if (countryCode === 'US' || countryCode === 'CA') {
            if (national.length === 10) {
                return dc + ' (' + national.substring(0, 3) + ') ' +
                    national.substring(3, 6) + '-' + national.substring(6);
            }
        }
        if (countryCode === 'BR' && national.length >= 10) {
            var ddd = national.substring(0, 2);
            var rest = national.substring(2);
            if (rest.length === 9) {
                return dc + ' (' + ddd + ') ' + rest.substring(0, 5) + '-' + rest.substring(5);
            }
            return dc + ' (' + ddd + ') ' + rest.substring(0, 4) + '-' + rest.substring(4);
        }
        return dc + ' ' + national;
    }

    global.getRegionFromPhone = getRegionFromPhone;
    global.formatDisplayNumber = formatDisplayNumber;
    global.getCountryName = getCountryName;
})(typeof window !== 'undefined' ? window : this);
