angular.module('charFilter', [])
  .value('csvUrl', 'https://docs.google.com/spreadsheet/pub?key=0AoZXrx74fcbJdDJLdDU5YUE1RWxNWTZ2M3FsSnFQc1E&single=true&gid=0&output=csv')

  .service('csvLoader', ['$http', 'csvUrl', function($http, csvUrl) {
    this.load = function(callback) {
      $http.get(csvUrl).then(function(response) {
        var results = parseCsv(response.data);
        callback(results);
      });

      function parseCsv(csvString) {
        var properties = ['name', 'series', 'graphic', 'type'];

        var rows = $.csv.toObjects(csvString);
        var results = _(rows).map(function(row) {
          // Convert keys to lowercase, non-properties to booleanss
          var lowercasedRow = _(row).map(function(value, key) {
            key = key.toLowerCase();
            value = properties.indexOf(key) > -1 ? value : Boolean(value);
            return [key, value];
          }).object().value();

          var base = _(lowercasedRow).pick(properties).value();
          base.tags = _(lowercasedRow).omit(properties).map(function(value, key) {
            return value ? key : null;
          }).compact().value();

          return base;
        }).value()

        /* Return value format:
           [{name: 'a', series: 'b', graphic: 'http://example.com/test.png', type: '1',
             tags: ['cool', 'nice']] */
        return results;
      };
    };
  }])

  .controller('charCtrl', ['$scope', 'csvLoader', function($scope, csvLoader) {
    csvLoader.load(function(data) {
      $scope.characters = data;
      $scope.allTags = _(data).map(function(c) { return c.tags; }).flatten().uniq().value();
    })
  }])

  .directive('character', function() {
    return {
      scope: { character: '=' },
      templateUrl: 'character.html'
    };
  })
;
