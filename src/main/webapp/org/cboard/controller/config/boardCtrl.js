/**
 * Created by yfyuan on 2016/8/2.
 */

cBoard.controller('boardCtrl', function ($scope, $http, ModalUtils, $filter, updateService, $uibModal) {

    var translate = $filter('translate');

    $scope.optFlag = 'none';
    $scope.curBoard = {layout: {rows: []}};

    var getBoardList = function () {
        $http.get("/dashboard/getBoardList.do").success(function (response) {
            $scope.boardList = response;
        });
    };

    var getWidgetList = function () {
        $http.get("/dashboard/getWidgetList.do").success(function (response) {
            $scope.widgetList = response;
        });
    };

    var getCategoryList = function () {
        $http.get("/dashboard/getCategoryList.do").success(function (response) {
            $scope.categoryList = [{id: null, name: translate('CONFIG.DASHBOARD.MY_DASHBOARD')}];
            _.each(response, function (o) {
                $scope.categoryList.push(o);
            })
        });
    };

    var getDatasetList = function () {
        $http.get("/dashboard/getDatasetList.do").success(function (response) {
            $scope.datasetList = response;
        });
    };

    var loadBoardDataset = function () {
        var datasetIdArr = [];
        _.each($scope.curBoard.layout.rows, function (row) {
            _.each(row.widgets, function (widget) {
                var w = _.find($scope.widgetList, function (w) {
                    return w.id == widget.widgetId
                });
                if (w.data.datasetId) {
                    datasetIdArr.push(w.data.datasetId);
                }
            });
        });
        datasetIdArr = _.union(datasetIdArr);
        $scope.boardDataset = [];
        _.each(datasetIdArr, function (d) {
            $http.post("/dashboard/getCachedData.do", {
                datasetId: d,
            }).success(function (response) {
                var dataset = _.find($scope.datasetList, function (ds) {
                    return ds.id == d;
                });
                dataset.columns = response.data[0];
                $scope. boardDataset.push(dataset);
            });
        });
    };

    var boardChange = function () {
        $scope.$emit("boardChange");
    };

    getBoardList();
    getWidgetList();
    getCategoryList();
    getDatasetList();

    $scope.widgetGroup = function (item) {
        return item.categoryName;
    };

    $scope.newBoard = function () {
        $scope.optFlag = 'new';
        $scope.curBoard = {layout: {rows: []}};
    };

    $scope.addWidget = function (row) {
        var w = {};
        w.name = '图表名称';
        w.width = 12;
        w.widgetId = $scope.widgetList[0].id;
        row.widgets.push(w);
    };

    $scope.addRow = function () {
        $scope.curBoard.layout.rows.push({type: 'widget', widgets: []});
    };

    $scope.addPramRow = function () {
        $scope.curBoard.layout.rows.push({type: 'param', params: []});
    };

    $scope.saveBoard = function () {
        if ($scope.optFlag == 'new') {
            $http.post("/dashboard/saveNewBoard.do", {json: angular.toJson($scope.curBoard)}).success(function (serviceStatus) {
                if (serviceStatus.status == '1') {
                    getBoardList();
                    $scope.optFlag = 'edit';
                    ModalUtils.alert(serviceStatus.msg, "modal-success", "sm");
                    boardChange();
                } else {
                    ModalUtils.alert(serviceStatus.msg, "modal-warning", "lg");
                }
            });
        } else if ($scope.optFlag == 'edit') {
            $http.post("/dashboard/updateBoard.do", {json: angular.toJson($scope.curBoard)}).success(function (serviceStatus) {
                if (serviceStatus.status == '1') {
                    getBoardList();
                    $scope.optFlag = 'edit';
                    ModalUtils.alert(serviceStatus.msg, "modal-success", "sm");
                    boardChange();
                } else {
                    ModalUtils.alert(serviceStatus.msg, "modal-warning", "lg");
                }
            });
        }
    };

    $scope.editBoard = function (board) {
        var b = angular.copy(board);
        updateService.updateBoard(b);
        $scope.curBoard = b;
        $scope.optFlag = 'edit';
        loadBoardDataset();
    };

    $scope.deleteBoard = function (board) {
        ModalUtils.confirm(translate("COMMON.CONFIRM_DELETE"), "modal-warning", "lg", function () {
            $http.post("/dashboard/deleteBoard.do", {id: board.id}).success(function () {
                getBoardList();
                $scope.optFlag == 'none';
                boardChange();
            });
        });
    };

    $scope.editParam = function (row, index) {
        var parent = $scope;
        var ok;
        var param;
        if (_.isUndefined(index)) {
            param = {col: []};
            ok = function (p) {
                if (!row.params) {
                    row.params = [];
                }
                row.params.push(p);
            };
        } else {
            param = angular.copy(row.params[index]);
            ok = function (p) {
                row.params[index] = p;
            };
        }
        $uibModal.open({
            templateUrl: 'org/cboard/view/config/modal/param.html',
            windowTemplateUrl: 'org/cboard/view/util/modal/window.html',
            backdrop: false,
            size: 'lg',
            controller: function ($scope, $uibModalInstance) {
                $scope.param = param;
                $scope.boardDataset = parent.boardDataset;
                $scope.close = function () {
                    $uibModalInstance.close();
                };
                $scope.ok = function () {
                    ok($scope.param);
                    $uibModalInstance.close();
                };
            }
        });
    };

});