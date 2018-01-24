var rp      = require('request-promise'),
    fs      = require('fs'),
    cheerio = require('cheerio');

var json_data = {};

var state_abbrs = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'kn', 'ky', 'la', 'me', 'md', 'ma', 
'mi', 'mn', 'ms', 'mo', 'mt', 'n e', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 
'va', 'wa', 'wv', 'wi', 'wy'];
var remaining = state_abbrs.length;
// Hardcode headings :(
var headings = ['Year', 'Population', 'Index', 'Violent', 'Property', 'Murder', 'Forcible Rape', 'Robbery', 'Aggravated Assault', 
'Burglary', 'Larceny - Theft', 'Vehicle Theft'];

state_abbrs.forEach(function (state) {
  rp(generate_url(state))
    .then(function (data) {
      remaining--;

      if (state === 'kn') state = 'ks';
      json_data[state] = {};

      $ = cheerio.load(data);
      $('table table tr:nth-child(2) table tr').each(function () {
        var cells = $(this).find('td');

        // Ignore empty rows, heading rows
        if (cells.first().text().trim() === '')     return;
        if (cells.first().text().trim() === 'Year') return;

        // Create datapoint
        var year = cells.first().text().trim();
        json_data[state][year] = {};
        for (var i = 1; i < headings.length; i++) {
          json_data[state][year][headings[i]] = parseInt(cells.eq(i).text().trim().replace(/,/g, ''));
        }
      });

      if (remaining == 0) {
        var data_filename = process.argv[2] || 'data.json';
        fs.writeFile(data_filename, JSON.stringify(json_data), function (err) {
          if (err) return console.log(err);
          console.log('Data saved in', data_filename);
        }); 
      }
    })
    .catch(function (e) {
      console.log('Error scraping', state, 'code', e.statusCode);
    })
});

function generate_url(a) {
  // The filename and data are different for these states
  var exceptions = ['nd', 'nm', 'ok', 'nj', 'ne', 'ms', 'nc', 'mt', 'mo'];

  return (exceptions.indexOf(a) >= 0)
    ? 'http://www.disastercenter.com/crime/' + a + 'crimn.htm'
    : 'http://www.disastercenter.com/crime/' + a + 'crime.htm';
}

function cap_first (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

