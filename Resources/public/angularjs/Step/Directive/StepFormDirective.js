(function () {
    'use strict';

    angular.module('StepModule').directive('stepForm', [
        function () {
            return {
                restrict: 'E',
                replace: true,
                controller: 'StepFormCtrl',
                controllerAs: 'stepFormCtrl',
                templateUrl: EditorApp.webDir + 'bundles/innovapath/angularjs/Step/Partial/step-form.html',
                scope: {
                    step: '=',
                    inheritedResources: '='
                },
                link: function (scope, element, attrs, stepFormCtrl) {
                    scope.$watch('step', function (newValue) {
                        stepFormCtrl.step = newValue;
                    });

                    scope.$watch('inheritedResources', function (newValue) {
                        stepFormCtrl.inheritedResources = newValue;
                    });
                }
            }
        }
    ]);
})();