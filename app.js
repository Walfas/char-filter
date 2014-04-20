angular.module('charFilter', [])
  .value('csvUrl', 'https://docs.google.com/spreadsheet/pub?key=0AoZXrx74fcbJdDJLdDU5YUE1RWxNWTZ2M3FsSnFQc1E&single=true&gid=0&output=csv')
  .service('imageSearcher', ['$http', function($http) {
    var params = {
      callback: 'JSON_CALLBACK',
      imgsz: 'small',
      safe: 'active',
      v: '1.0'
    };
    var baseUrl = '//ajax.googleapis.com/ajax/services/search/images?' + $.param(params);

    this.search = function(query, callback) {
      var url = baseUrl + '&q=' + query;
      $http.jsonp(url).success(function(data) {
        var imageUrl = _.sample(data.responseData.results).url;
        callback(imageUrl);
      });
    };
  }])

  .service('csvLoader', ['$http', 'imageSearcher', 'csvUrl', function($http, imageSearcher, csvUrl) {
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

          var obj = _(lowercasedRow).pick(properties).value();
          obj.tags = _(lowercasedRow).omit(properties).map(function(value, key) {
            return value ? key : null;
          }).compact().sort().value();

          /*
          if (obj.graphic == '') {
            imageSearcher.search([obj.name, obj.series].join(' '), function (url) {
              obj.graphic = url;
            });
          }
          */

          return obj;
        }).value()

        /* Return value format:
           [{name: 'a', series: 'b', graphic: 'http://example.com/test.png', type: '1',
             tags: ['cool', 'nice']] */
        return results;
      };
    };
  }])

  .directive('character', function() {
    return {
      transclude: true,
      templateUrl: 'character.html',
      replace: true
    };
  })

  .controller('charCtrl', ['$scope', 'csvLoader', function($scope, csvLoader) {
    $scope.selectedTags = [];

    csvLoader.load(function(data) {
      $scope.characters = data;
      $scope.allTags = _(data).map(function(c) { return c.tags; }).flatten().uniq().value();
    })

    $scope.tagMatches = function(tag) {
      return $scope.selectedTags.indexOf(tag) > -1;
    }

    $scope.toggleTag = function(tag) {
      var index = $scope.selectedTags.indexOf(tag);

      if (index < 0) {
        $scope.selectedTags.push(tag);
      } else {
        $scope.selectedTags.splice(index, 1);
      }
    }

    $scope.filterCharacter = function(character) {
      if ($scope.selectedTags.length == 0) return true;

      return _.difference($scope.selectedTags, character.tags).length == 0;

      var common = _.intersection($scope.selectedTags, character.tags);
      return common.length == $scope.selectedTags.length;
    }
  }])
;
