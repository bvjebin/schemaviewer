/**
    @ClassName dataProvider
    @return data
*/
function dataProvider(length) {
    var data = [], datum, max = 9, min = 5;
    for(var k=0; k<10; k++) {
        var randomDtCnt = Math.floor(Math.random() * (max - min + 1)) + min;
        for(var dt=0; dt<=randomDtCnt; dt++) {
            datum = {};
            var randomAttrCnt = Math.floor(Math.random() * (max - min + 1)) + min;
            datum.name = "DS"+k+" Table"+dt;
            datum.identifier = "DS"+k+"_Table"+dt;
            datum.attributes = [];
            for(var l=0; l<=randomAttrCnt; l++) {
                datum.attributes.push({
                    name: "attr"+l,
                    identifier: datum.identifier+"_attr"+l
                });
            }
            data.push(datum);
        }
    }
    return data.slice(0, (length || 5));
}

function connectionProvider(data) {
    var connections = [], connection, srandomAttrCnt, trandomAttrCnt;
    data.forEach(function(datumsource, sidx) {
        data.forEach(function(datum, tidx) {
            if(sidx !== tidx) {
                connection = [];
                srandomAttrCnt = Math.floor(Math.random() * ((datumsource.attributes.length-1) - 0 + 1)) + 0;
                trandomAttrCnt = Math.floor(Math.random() * ((datum.attributes.length-1) - 0 + 1)) + 0;
                connection.push(datumsource.attributes[srandomAttrCnt].identifier);
                connection.push(datum.attributes[trandomAttrCnt].identifier);
                connections.push(connection);
            }
        });
    });
    return connections;
}