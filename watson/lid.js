/**
 * Copyright 2013,2015 IBM Corp.
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

module.exports = function (RED) {
  var cfenv = require('cfenv');

  var services = cfenv.getAppEnv().services,
    service;

  if (services.language_identification) service = services.language_identification[0];

  RED.httpAdmin.get('/watson-language-identification/vcap', function (req, res) {
    res.json(service);
  });

  function Node (config) {
    RED.nodes.createNode(this, config);
    var node = this;

    if (!service) {
      node.error('No language identification service bound');
    } else {
      var cred = service.credentials;
      var username = cred.username;
      var password = cred.password;

      this.on('input', function (msg) {
        if (!msg.payload) {
          node.error('Missing property: msg.payload');
          return;
        }

        var watson = require('watson-developer-cloud');

        var language_identification = watson.language_identification({
          username: username,
          password: password,
          version: 'v1'
        });

        language_identification.identify({text: msg.payload}, function (err, response) {
          if (err) {
            node.error(err);
          } else {
            msg.lang = response.language;
          }

          node.send(msg);
        });
      });
    }
  }
  RED.nodes.registerType('watson-language-identification',Node);
};
