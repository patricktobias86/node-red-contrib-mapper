module.exports = function(RED) {
    "use strict";

    function MapperNode(config) {
        RED.nodes.createNode(this, config);

        let node = this;

        node.property = config.property;
        node.map = config.map;
        node.passthrough = config.passthrough;
        let propertyParts = config.property.split(".");

        function cast(val, type) {
            switch(type) {
            case 'num':
                return Number(val);
                break;
            case 'bool':
                return val === "true";
                break;
            default:
                return val;
            }
        }

        let mappingGroups = [];
        for (let i=0; i<node.map.length; i+=1) {
            let searchItems = node.map[i].search.split(",").map(s => {
                let searchVal = s.trim();
                let type = node.map[i].searchType;
                if (type === 're') {
                    return new RegExp(searchVal);
                } else if (['msg', 'flow', 'global'].includes(type)) {
                    return RED.util.evaluateNodeProperty(searchVal, type, node, {});
                } else if (type === 'jsonata') {
                    try {
                        let expr = RED.util.prepareJSONataExpression(searchVal, node);
                        return RED.util.evaluateJSONataExpression(expr, {});
                    } catch (e) {
                        node.warn("JSONata error in search: " + e.message);
                        return null;
                    }
                } else if (type === 'env') {
                    return process.env[searchVal] || "";
                } else {
                    return cast(searchVal, type);
                }
            });
            mappingGroups.push({
                searchValues: searchItems,
                replaceValue: node.map[i].replace,
                replaceType: node.map[i].replaceType
            });
        }

        this.on('input', function (msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };

            let err;
            try {
                let depth = 0;
                let found = false;
                let idx;
                propertyParts.reduce(function(obj, part) {
                    if (obj.hasOwnProperty(part)) {
                        if (++depth === propertyParts.length) {
                            let matched = false;
                            for (let group of mappingGroups) {
                                for (let searchVal of group.searchValues) {
                                    if ((searchVal instanceof RegExp && searchVal.test(obj[part])) ||
                                        (!(searchVal instanceof RegExp) && searchVal === obj[part])) {

                                        let replacement = group.replaceValue;
                                        let replaceType = group.replaceType;

                                        switch (replaceType) {
                                            case 'msg':
                                            case 'flow':
                                            case 'global':
                                                replacement = RED.util.evaluateNodeProperty(replacement, replaceType, node, msg);
                                                break;
                                            case 'jsonata':
                                                try {
                                                    let expr = RED.util.prepareJSONataExpression(replacement, node);
                                                    replacement = RED.util.evaluateJSONataExpression(expr, msg);
                                                } catch (e) {
                                                    node.warn("JSONata error: " + e.message);
                                                    replacement = null;
                                                }
                                                break;
                                            case 'env':
                                                replacement = process.env[replacement] || "";
                                                break;
                                            case 're':
                                                try {
                                                    replacement = new RegExp(replacement);
                                                } catch (e) {
                                                    node.warn("Invalid RegExp in replace: " + e.message);
                                                    replacement = null;
                                                }
                                                break;
                                        }

                                        obj[part] = replacement;
                                        matched = true;
                                        break;
                                    }
                                }
                                if (matched) break;
                            }
                            if (matched) {
                                found = true;
                            }
                        } else {
                            return obj[part];
                        }
                    } else {
                        ++depth;
                        return {};
                    }
                }, msg);

                if (found || node.passthrough) {
                    send(msg);
                }
            } catch(err) {
                console.log(err);
            }

            if (err) {
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
            }

        });
    }
    RED.nodes.registerType("mapper", MapperNode);
}
