/**
 * Copyright 2024 And Rom
 * Copyright 2014 Nicholas Humfrey
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

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
                if (node.map[i].searchType === 're') {
                    return new RegExp(s.trim());
                } else {
                    return cast(s.trim(), node.map[i].searchType);
                }
            });
            let replaceItem = cast(node.map[i].replace, node.map[i].replaceType);
            mappingGroups.push({ searchValues: searchItems, replaceValue: replaceItem });
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
                                        obj[part] = group.replaceValue;
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
