/**
 * Created by yfyuan on 2016/8/12.
 */
cBoard.service('dataService', function ($http) {

    /**
     * Get raw data from server side.
     * @param datasource
     * @param query
     * @param callback
     */
    this.getData = function (datasource, query, callback) {
        $http.post("/dashboard/getData.do", {
            datasourceId: datasource,
            query: angular.toJson(query)
        }).success(function (response) {
            callback(response);
        });
    };

    this.parseKpiOption = function (chartData, config) {
        var option = {};
        castRawData2Series(chartData, config, function (casted_keys, casted_values, aggregate_data, newValuesConfig) {
            option.kpiValue = aggregate_data[0][0];
            if (config.values[0].format) {
                option.kpiValue = numbro(option.kpiValue).format(config.values[0].format);
            }
            option.kpiName = config.values[0].name;
            option.style = config.values[0].style;

        });
        return option;
    };

    this.parseEchartOption = function (chartData, config) {
        switch (config.chart_type) {
            case 'line':
                return parseEchartOptionLine(chartData, config);
            case 'pie':
                return parseEchartOptionPie(chartData, config);
            default:
                return null;
        }
    };

    var parseEchartOptionLine = function (chartData, chartConfig) {
        var echartOption = null;
        castRawData2Series(chartData, chartConfig, function (casted_keys, casted_values, aggregate_data, newValuesConfig) {
            var series_data = new Array();
            var string_keys = _.map(casted_keys, function (key) {
                return JSON.parse(key).join('-');
            });

            for (var i = 0; i < aggregate_data.length; i++) {
                var s = angular.copy(newValuesConfig[casted_values[i]]);
                s.name = casted_values[i];
                s.data = aggregate_data[i];
                if (s.type == 'stackbar') {
                    s.type = 'bar';
                    s.stack = s.yAxisIndex.toString();
                }
                series_data.push(s);
            }

            var yAxis = angular.copy(chartConfig.values);
            _.each(yAxis, function (e, i) {
                e.axisLabel = {
                    formatter: function (value) {
                        return numbro(value).format("0a.[0000]");
                    }
                };
                if (i > 0) {
                    e.splitLine = false;
                }
            });
            echartOption = {
                legend: {
                    data: casted_values
                },
                xAxis: {
                    type: 'category',
                    data: string_keys
                },
                yAxis: yAxis,
                series: series_data
            };
        });
        return echartOption;
    };

    var parseEchartOptionPie = function (chartData, chartConfig) {
        var echartOption = null;
        castRawData2Series(chartData, chartConfig, function (casted_keys, casted_values, aggregate_data, newValuesConfig) {
            var series_data = new Array();
            var string_keys = _.map(casted_keys, function (key) {
                return JSON.parse(key).join('-');
            });

            for (var i = 0; i < aggregate_data[0].length; i++) {
                series_data.push({name: string_keys[i], value: aggregate_data[0][i]});
            }
            echartOption = {
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: string_keys
                },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                toolbox: false,
                series: [
                    {
                        name: chartConfig.values[0].name,
                        type: 'pie',
                        data: series_data,
                        roseType: 'angle'
                    }
                ]
            };
        });
        return echartOption;
    };

    this.parseTableOption = function (chartData, chartConfig) {
        var tableOption = null;
        castRawData2Series(chartData, chartConfig, function (casted_keys, casted_values, aggregate_data, newValuesConfig) {
            var table_data = new Array();
            var columns = [];
            var keyLength = chartConfig.keys.length;
            for (var i = 0; i < keyLength; i++) {
                columns.push({title: chartConfig.keys[i]});
            }
            _.each(casted_values, function (e) {
                columns.push({title: e});
            });

            for (var i = 0; i < casted_keys.length; i++) {
                table_data[i] = JSON.parse(casted_keys[i]);
            }

            for (var i = 0; i < casted_values.length; i++) {
                for (var j = 0; j < casted_keys.length; j++) {
                    if (!_.isUndefined(aggregate_data[i][j])) {
                        table_data[j][i + keyLength] = aggregate_data[i][j];
                    } else {
                        table_data[j][i + keyLength] = 'N/A';
                    }
                }
            }

            tableOption = {
                columns: columns,
                data: table_data
            };
        });

        return tableOption;
    };

    var getDataSeries = function (rawData, chartConfig) {
        var result = [];
        _.each(chartConfig.values, function (v) {
            _.each(v.cols, function (c) {
                var series = configToDataSeries(rawData, c);
                _.each(series, function (s) {
                    if (!_.find(result, function (e) {
                            return JSON.stringify(e) == JSON.stringify(s);
                        })) {
                        result.push(s);
                    }
                });
            });
        });
        return result;
    };

    var configToDataSeries = function (rawData, config) {
        switch (config.type) {
            case 'exp':
                return getExpSeries(rawData, config.exp);
                break;
            default:
                return [{
                    name: config.col,
                    aggregate: config.aggregate_type,
                    index: getHeaderIndex(rawData, [config.col])[0]
                }]
                break;
        }
    };

    var getExpSeries = function (rawData, exp) {
        var result = [];
        exp = exp.trim();
        _.each(exp.match(/(sum|avg|count|max|min)\([\u4e00-\u9fa5_a-zA-Z0-9]+\)/g), function (text) {
            var name = text.substring(text.indexOf('(') + 1, text.indexOf(')'));
            result.push({
                name: name,
                aggregate: text.substring(0, text.indexOf('(')),
                index: getHeaderIndex(rawData, [name])[0]
            });
        });
        return result;
    };

    /**
     * Cast the aggregated raw data into data series
     * @param rawData
     * @param chartConfig
     * @param callback function which is used to transform series data to widgets option
     */
    var castRawData2Series = function (rawData, chartConfig, callback) {

        var keysIdx = getHeaderIndex(rawData, chartConfig.keys);
        var groupsIdx = getHeaderIndex(rawData, chartConfig.groups);
        var dataSeries = getDataSeries(rawData, chartConfig);

        var castedKeys = new Array();
        var castedGroups = new Array();
        var newData = {};
        for (var i = 1; i < rawData.length; i++) {
            //组合keys
            var newKey = getRowElements(rawData[i], keysIdx);
            newKey = JSON.stringify(newKey);
            pushIfNoExist(castedKeys, newKey);
            //组合groups
            var group = getRowElements(rawData[i], groupsIdx);
            var newGroup = group.join('-');
            pushIfNoExist(castedGroups, newGroup);
            // pick the raw values into coordinate cell and then use aggregate function to do calculate
            var _keyIdx = indexOf(castedKeys, newKey);
            _.each(dataSeries, function (dSeries) {
                if (!newData[newGroup]) {
                    newData[newGroup] = {};
                }
                if (!newData[newGroup][dSeries.name]) {
                    newData[newGroup][dSeries.name] = {};
                }
                if (!newData[newGroup][dSeries.name][dSeries.aggregate]) {
                    newData[newGroup][dSeries.name][dSeries.aggregate] = new Array();
                }
                if (!newData[newGroup][dSeries.name][dSeries.aggregate][_keyIdx]) {
                    newData[newGroup][dSeries.name][dSeries.aggregate][_keyIdx] = new Array();
                }
                newData[newGroup][dSeries.name][dSeries.aggregate][_keyIdx].push(rawData[i][dSeries.index]);
            });
        }
        // do aggregate
        _.mapObject(newData, function (g) {
            _.mapObject(g, function (groupSeries) {
                _.each(_.keys(groupSeries), function (aggregateType) {
                    for (var i = 0; i < groupSeries[aggregateType].length; i++) {
                        if (groupSeries[aggregateType][i]) {
                            groupSeries[aggregateType][i] = aggregate(groupSeries[aggregateType][i], aggregateType);
                        }
                    }
                });
            });
        });
        var castedAliasSeriesName = new Array();
        var aliasSeriesConfig = {};
        var aliasData = new Array();
        _.each(castedGroups, function (group) {
            _.each(chartConfig.values, function (value, vIdx) {
                _.each(value.cols, function (series) {
                    var seriesName = series.alias ? series.alias : series.col;
                    var newSeriesName = group ? (group + '-' + seriesName) : seriesName;
                    castedAliasSeriesName.push(newSeriesName);
                    aliasSeriesConfig[newSeriesName] = {type: value.series_type, yAxisIndex: vIdx};

                    castSeriesData(series, group, castedKeys, newData, function (castedData, keyIdx) {
                        if (!aliasData[castedAliasSeriesName.length - 1]) {
                            aliasData[castedAliasSeriesName.length - 1] = new Array();
                        }
                        // Only format decimal
                        aliasData[castedAliasSeriesName.length - 1][keyIdx] = dataFormat(castedData);
                    });
                });
            });
        });

        callback(castedKeys, castedAliasSeriesName, aliasData, aliasSeriesConfig);
    };

    var castSeriesData = function (series, group, castedKeys, newData, iterator) {
        switch (series.type) {
            case 'exp':
                var runExp = compileExp(series.exp);
                for (var i = 0; i < castedKeys.length; i++) {
                    iterator(runExp(newData[group], i), i);
                }
                break;
            default:
                _.each(newData[group][series.col][series.aggregate_type], iterator);
                break;
        }
    };

    var compileExp = function (exp) {
        exp = exp.trim();
        _.each(exp.match(/(sum|avg|count|max|min)\([\u4e00-\u9fa5_a-zA-Z0-9]+\)/g), function (text) {
            var name = text.substring(text.indexOf('(') + 1, text.indexOf(')'));
            var aggregate = text.substring(0, text.indexOf('('));
            exp = exp.replace(text, "groupData['" + name + "']['" + aggregate + "'][keyIdx]");
        });
        return function (groupData, keyIdx) {
            return eval(exp);
        };
    };

    var aggregate = function (data_array, fnc) {
        if (!data_array) {
            return data_array;
        }
        switch (fnc) {
            case 'sum':
                return aggregate_sum(data_array);
            case 'count':
                return aggregate_count(data_array);
            case 'avg':
                return aggregate_avg(data_array);
            case 'max':
                return _.max(data_array, function (f) {
                    return parseFloat(f);
                });
            case 'min':
                return _.min(data_array, function (f) {
                    return parseFloat(f);
                });
        }
    };

    var aggregate_sum = function (data_array) {
        var sum = 0;
        for (var i = 0; i < data_array.length; i++) {
            var f = parseFloat(data_array[i]);
            if (f) {
                sum += f;
            }
        }
        return sum;
    };

    var aggregate_count = function (data_array) {
        return data_array.length;
    };

    var aggregate_avg = function (data_array) {
        var sum = 0;
        var count = 0;
        for (var i = 0; i < data_array.length; i++) {
            var f = parseFloat(data_array[i]);
            if (f) {
                sum += f;
                count++;
            }
        }
        return count == 0 ? 0 : sum / count;
    };

    var getHeaderIndex = function (chartData, col) {
        var result = new Array();
        if (col) {
            for (var j = 0; j < col.length; j++) {
                var idx = _.indexOf(chartData[0], col[j]);
                result.push(idx);
            }
        }
        return result;
    };

    var getRowElements = function (row, elmIdxs) {
        var arr = new Array();
        for (var j = 0; j < elmIdxs.length; j++) {
            var elm = row[elmIdxs[j]];
            arr.push(elm);
        }
        return arr;
    };

    var pushIfNoExist = function (arr, elm) {
        if (indexOf(arr, elm) < 0) {
            arr.push(elm);
            return true;
        }
        return false;
    };

    var indexOf = function (array, key) {
        var idx = -1;
        for (var i = 0; i < array.length; i++) {
            if (key.toString() == array[i].toString()) {
                idx = i;
                break;
            }
        }
        return idx;
    };
});
