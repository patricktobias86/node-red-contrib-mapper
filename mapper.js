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

        let search = [];
        let replace = [];
        for (let i=0; i<node.map.length; i+=1) {
            search.push(cast(node.map[i].search, node.map[i].searchType));
            replace.push(cast(node.map[i].replace, node.map[i].replaceType));
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
                            if ((idx = search.indexOf(obj[part])) !== -1) {
                                found = true;
                                obj[part] = replace[idx];
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
