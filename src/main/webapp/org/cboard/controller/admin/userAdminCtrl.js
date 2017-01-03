/**
 * Created by yfyuan on 2016/12/5.
 */
cBoard.controller('userAdminCtrl', function ($scope, $http, ModalUtils, $filter) {

    var translate = $filter('translate');
    $scope.optFlag;
    $scope.curUser;

    var getUserList = function () {
        $http.get("/admin/getUserList.do").success(function (response) {
            $scope.userList = response;
        });
    };
    getUserList();

    var getRoleList = function () {
        $http.get("/admin/getRoleList.do").success(function (response) {
            $scope.roleList = response;
        });
    };
    getRoleList();

    var getUserRoleList = function () {
        $http.get("/admin/getUserRoleList.do").success(function (response) {
            $scope.userRoleList = response;
        });
    };
    getUserRoleList();

    $scope.resList = [{id: 'Menu', text: 'Menu', parent: '#'}, {
        id: 'Dashboard',
        text: 'Dashboard',
        parent: '#',
    }, {
        id: 'Datasource',
        text: 'Datasource',
        parent: '#'
    }, {id: 'Dataset', text: 'Cube', parent: '#'}, {id: 'Widget', text: 'Widget', parent: '#'}];

    var getBoardList = function () {
        return $http.get("/dashboard/getBoardList.do").success(function (response) {
            _.each(_.filter(response, function (e) {
                return e.categoryId;
            }), function (e) {
                $scope.resList.push({
                    id: 'Dashboard_' + e.id, text: e.name, parent: 'Dashboard', resId: e.id,
                    type: 'board'
                });
            });
        });
    };

    var getMenuList = function () {
        return $http.get("/commons/getMenuList.do").success(function (response) {
            $scope.menuList = response;
            _.each(response, function (e) {
                $scope.resList.push({
                    id: 'menu_' + e.menuId,
                    text: translate(e.menuName),
                    parent: e.parentId == -1 ? 'Menu' : ('menu_' + e.parentId),
                    resId: e.menuId,
                    type: 'menu'
                });
            });
        });
    };

    var getDatasourceList = function () {
        return $http.get("/dashboard/getDatasourceList.do").success(function (response) {
            _.each(response, function (e) {
                $scope.resList.push({
                    id: 'Datasource_' + e.id, text: e.name, parent: 'Datasource', resId: e.id,
                    type: 'datasource'
                });
            });
        });
    };

    var getDatasetList = function () {
        return $http.get("/dashboard/getDatasetList.do").success(function (response) {
            _.each(response, function (e) {
                $scope.resList.push({
                    id: 'Dataset_' + e.id, text: e.name, parent: 'Dataset', resId: e.id,
                    type: 'dataset'
                });
            });
        });
    };

    var getWidgetList = function () {
        return $http.get("/dashboard/getWidgetList.do").success(function (response) {
            _.each(response, function (e) {
                $scope.resList.push({
                    id: 'widget_' + e.id,
                    text: e.name,
                    parent: 'Widget',
                    resId: e.id,
                    type: 'widget'
                });
            });
        });
    };

    var loadResData = function () {
        getBoardList().then(function () {
            return getMenuList();
        }).then(function () {
            return getDatasourceList();
        }).then(function () {
            return getDatasetList();
        }).then(function () {
            return getWidgetList();
        }).then(function () {
            $scope.treeConfig = {
                core: {
                    multiple: true,
                    animation: true,
                    error: function (error) {
                    },
                    check_callback: true,
                    worker: true
                },
                checkbox: {
                    three_state: false
                },
                version: 1,
                plugins: ['types', 'checkbox']
            };
        });
    }();

    var getRoleResList = function () {
        $http.get("/admin/getRoleResList.do").success(function (response) {
            $scope.roleResList = response;
        });
    };
    getRoleResList();

    $scope.changeRoleSelect = function () {
        if ($scope.selectUser && $scope.selectUser.length == 1) {
            var userRole = _.filter($scope.userRoleList, function (e) {
                return e.userId == $scope.selectUser[0].userId;
            });
            $scope.selectRole = _.filter($scope.roleList, function (e) {
                return _.find(userRole, function (ur) {
                    return ur.roleId == e.roleId;
                })
            });
        }
    };

    $scope.newUser = function () {
        $scope.optFlag = 'newUser';
        $scope.curUser = {};
    };

    $scope.editUser = function (user) {
        $scope.optFlag = 'editUser';
        $scope.curUser = angular.copy(user);
    };

    $scope.newRole = function () {
        $scope.optFlag = 'newRole';
        $scope.curRole = {};
    };

    $scope.editRole = function (role) {
        $scope.optFlag = 'editRole';
        $scope.curRole = angular.copy(role);
    };

    $scope.saveUser = function () {
        // if(!validate()){
        //     return;
        // }
        if ($scope.optFlag == 'newUser') {
            $http.post("/admin/saveNewUser.do", {user: angular.toJson($scope.curUser)}).success(function (serviceStatus) {
                if (serviceStatus == '1') {
                    $scope.optFlag = 'none';
                    getUserList();
                    $scope.verify = {dsName: true};
                    ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
                } else {
                    $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
                }
            });
        } else {
            $http.post("/admin/updateUser.do", {user: angular.toJson($scope.curUser)}).success(function (serviceStatus) {
                if (serviceStatus == '1') {
                    $scope.optFlag = 'none';
                    getUserList();
                    $scope.verify = {dsName: true};
                    ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
                } else {
                    $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
                }
            });
        }

    };

    $scope.saveRole = function () {
        // if(!validate()){
        //     return;
        // }
        if ($scope.optFlag == 'newRole') {
            $http.post("/admin/saveRole.do", {role: angular.toJson($scope.curRole)}).success(function (serviceStatus) {
                if (serviceStatus == '1') {
                    $scope.optFlag = 'none';
                    getRoleList();
                    $scope.verify = {dsName: true};
                    ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
                } else {
                    $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
                }
            });
        } else {
            $http.post("/admin/updateRole.do", {role: angular.toJson($scope.curRole)}).success(function (serviceStatus) {
                if (serviceStatus == '1') {
                    $scope.optFlag = 'none';
                    getRoleList();
                    $scope.verify = {dsName: true};
                    ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
                } else {
                    $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
                }
            });
        }

    };

    $scope.grantRole = function () {
        var userIds = _.map($scope.selectUser, function (e) {
            return e.userId;
        });
        var roleIds = _.map($scope.selectRole, function (e) {
            return e.roleId;
        });
        $http.post("/admin/updateUserRole.do", {
            userIdArr: angular.toJson(userIds),
            roleIdArr: angular.toJson(roleIds)
        }).success(function (serviceStatus) {
            if (serviceStatus == '1') {
                $scope.selectUser = null;
                $scope.selectRole = null;
                getUserRoleList();
                ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
            } else {
                $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
            }
        });
    };

    $scope.changeResSelect = function () {
        $scope.optFlag = 'selectRes';
        $scope.treeInstance.jstree(true).open_all();
        if ($scope.selectRole && $scope.selectRole.length == 1) {
            var roleRes = _.filter($scope.roleResList, function (e) {
                return e.roleId == $scope.selectRole[0].roleId;
            });
            $scope.treeInstance.jstree(true).uncheck_all();
            _.each($scope.resList, function (e) {
                var f = _.find(roleRes, function (rr) {
                    return rr.resId == e.resId && rr.resType == e.type;
                });
                if (!_.isUndefined(f)) {
                    $scope.treeInstance.jstree(true).check_node(e);
                }
            });
        }
    };

    $scope.grantRes = function () {
        var roleIds = _.map($scope.selectRole, function (e) {
            return e.roleId;
        });
        var resIds = _.map(_.filter($scope.treeInstance.jstree(true).get_checked(true), function (e) {
            return !_.isUndefined(e.original.resId);
        }), function (e) {
            return {resId: e.original.resId, resType: e.original.type};
        });
        $http.post("/admin/updateRoleRes.do", {
            roleIdArr: angular.toJson(roleIds),
            resIdArr: angular.toJson(resIds),
        }).success(function (serviceStatus) {
            if (serviceStatus == '1') {
                $scope.selectRole = null;
                $scope.selectRes = null;
                getRoleResList();
                ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
            } else {
                $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
            }
        });

    };
});