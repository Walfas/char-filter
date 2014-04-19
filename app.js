angular.module('charFilter', [])
  .value('csvUrl', 'http://example.com/blah.csv')

  .service('csvLoader', ['$http', 'csvUrl', function($http, csvUrl) {
    this.load = function(callback) {
      $http.get(csvUrl).then(function(response) {
        var results = parseCsv(response.data);
        callback(results);
      });

      function parseCsv(csvString) {
        var properties = ['name', 'series', 'graphic', 'type'];

        var rows = $.csv.toObjects(csvString);
        var results = _.map(rows, function(row) {
          // Convert keys to lowercase, non-properties to booleanss
          var lowercasedRow = _.object(_.map(row, function(value, key) {
            key = key.toLowerCase();
            value = properties.indexOf(key) > -1 ? value : Boolean(value);
            return [key, value];
          }));

          var splat = [lowercasedRow].concat(properties);

          var base = _.pick.apply(this, splat);
          base.attributes = _.omit.apply(this, splat);

          return base;
        })

        /* Return value format:
           [{name: 'a', series: 'b', graphic: 'http://example.com/test.png', type: '1',
             attributes: { cool: true, awesome: false }] */
        return results;
      };
    };
  }])

  .controller('charCtrl', ['$scope', 'csvLoader', function($scope, csvLoader) {
    csvLoader.load(function(data) {
      $scope.characters = data;
    })
  }])
;
